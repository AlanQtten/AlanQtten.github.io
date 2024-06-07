<script lang="ts">
import type { Component, VNode } from 'vue'
import { defineComponent, h, ref, useCssModule, watchEffect } from 'vue'
import { codeToHast } from 'shiki'
import cx from 'classnames'
import { O, R, W } from '../letter'
import DoubleLetter from '../letter/DoubleLetter.vue'
import transformerPerm from './transformerPerm'
import { lineIndexSymbol, propsMergeSymbol } from './constant'

export function pushInMiddle<T>(arr: T[], pusher: (p: { before: T, after: T }) => T | T[] | false) {
  const l = arr.length
  const _arr = []
  for (let i = -1; i < l; i++) {
    const needPush = pusher({ before: arr[i], after: arr[i + 1] })

    if (needPush) {
      const _needPush = Array.isArray(needPush) ? needPush : [needPush]
      if (i === -1) {
        _arr.push(..._needPush)
      }
      else {
        _arr.push(arr[i], ..._needPush)
      }
    }
    else {
      i >= 0 && _arr.push(arr[i])
    }
  }

  return _arr
}

interface TreeNode {
  type: 'root' | 'element' | 'text'
  tagName?: string
  children?: TreeNode[]
  value?: string
  properties?: {
    class?: string
    style?: string
    [k: symbol]: any
  }
}

function isDefinedComponent(tagName: string): Component | false {
  switch (tagName) {
    case 'R': return R
    case 'W': return W
    case 'O': return O
    case 'DoubleLetter': return DoubleLetter
    default: return false
  }
}

function resolveTagName(treeNode: TreeNode): Component | string {
  const tagName = treeNode.tagName ?? 'div'

  switch (treeNode.type) {
    case 'root':
      return 'div'
    case 'element':
      return isDefinedComponent(tagName) || tagName
    case 'text':
    default:
      return 'span'
  }
}

function transferStyleToCssVar(styleStr: string, cssProp: string, cssVar: string) {
  const style = styleStr.split(';').map(s => s.trim()).filter(Boolean)
  return style.map((s) => {
    const [prop, value] = s.split(':').map(s => s.trim())
    if (prop === cssProp) {
      return `${cssVar}: ${value}`
    }
    return s
  }).join(';')
}

function resolveProps(treeNode: TreeNode, tagName: Component | string) {
  let props: any = {}
  const properties = treeNode.properties

  if (!properties) {
    return props
  }

  if (properties.class) {
    props.class = properties.class
  }
  if (properties.style) {
    props.style = tagName === 'span' ? transferStyleToCssVar(properties.style, 'color', '--shiki-light') : properties.style
  }
  if (properties[lineIndexSymbol] !== undefined) {
    props.dataLineIndex = properties[lineIndexSymbol]
  }
  if (typeof properties[propsMergeSymbol] === 'function') {
    props = properties[propsMergeSymbol](props)
  }

  return props
}

function generateTree(treeNode: TreeNode): VNode {
  const tagName = resolveTagName(treeNode)
  const props = resolveProps(treeNode, tagName)

  let children: any
  if (Array.isArray(treeNode.children)) {
    children = treeNode.children.map(child => generateTree(child))
    if (treeNode.children.length === 1 && treeNode.children[0].type === 'text') {
      children = treeNode.children[0].value
    }
    else {
      children = treeNode.children.map(child => generateTree(child))
    }
  }
  else {
    children = treeNode.value
  }

  return h(
    tagName,
    props,
    children,
  )
}

function traverse(treeNode: VNode, callback: (node: VNode) => void) {
  callback(treeNode)
  Array.isArray(treeNode.children)
  && treeNode.children.forEach(child =>
    traverse(child as VNode, callback),
  )
}

export default defineComponent({
  props: ['inserter', 'initCode'],
  setup(props) {
    const $style = useCssModule()
    const resultTree = ref<TreeNode>({ type: 'root' })
    const { inserter, initCode } = props

    const { code: initCodeStr, lang: initLang } = initCode()

    const code = ref(initCodeStr)
    const lang = ref(initLang)

    watchEffect(() => {
      codeToHast(code.value, {
        lang: lang.value,
        themes: {
          dark: 'github-dark',
          light: 'github-light',
        },
        transformers: [
          {
            code(node) {
              node.children = node.children.filter((ele: any) => ele.value !== '\n')
            },
            pre(node) {
              this.addClassToHast(node, 'vp-code')

              delete node.properties.style
            },
            line(node, lineIndex) {
              this.addClassToHast(node, 'relative w-full block clear-both')
              node.properties = {
                ...node.properties,
                [lineIndexSymbol]: lineIndex - 1,
              }
            },
          },
          transformerPerm,
        ],
      }).then((result) => {
        resultTree.value = {
          ...(result as TreeNode),
          properties: {
            class: `language-${lang.value} vp-adaptive-theme`,
          },
        }
      })
    })

    return () => {
      const root = generateTree(resultTree.value)

      root.props!.class = cx(root.props?.class, $style.root)

      inserter && traverse(root, (node) => {
        if (Array.isArray(node.children) && node.props?.class?.includes('line')) {
          node.children = pushInMiddle(node.children, ({ before, after }) => {
            return inserter({ before, after, line: node.props!.dataLineIndex })
          })
        }
      })

      return root
    }
  },
})
</script>

<style module>
.root :global(pre code .line:nth-last-child(1) table) {
  margin-bottom: 0!important;
}
</style>

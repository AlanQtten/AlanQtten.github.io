import type { ShikiTransformer } from 'shiki'
import { propsMergeSymbol } from './constant'

const regexResolverList = [
  {
    regex: /\/\*\[!perm ([a-zA-Z0-9.,{}: "]+)\]\*\/$/,
    resolver(value: string) {
      const [letter, restProps] = value.split('.')

      return {
        value: letter,
        properties: {
          [propsMergeSymbol]: (props: any) => {
            return {
              ...props,
              ...restProps ? JSON.parse(restProps) : {},
            }
          },
        },
      }
    },
  },
  {
    regex: /\/\*\[!perm_double ([a-zA-Z0-9.,{}: "]+)\]\*\/$/,
    resolver(value: string) {
      const [letterA, letterB, restProps] = value.split('.')

      return {
        value: 'DoubleLetter',
        properties: {
          [propsMergeSymbol]: (props: any) => {
            return {
              ...props,
              letterA,
              letterB,
              ...restProps ? JSON.parse(restProps) : {},
            }
          },
        },
      }
    },
  },
]

function matchPipe(str: string) {
  const l = regexResolverList.length
  for (let i = 0; i < l; i++) {
    const { regex, resolver } = regexResolverList[i]
    const match = str.match(regex)
    if (match) {
      const { value, properties } = resolver(match[1])

      return {
        value,
        properties,
        replaceValue: str.replace(regex, ''),
        match: true,
      }
    }
  }

  return {
    match: false,
  }
}

const transformer: ShikiTransformer = {
  line(line) {
    line.children = line.children.reduce<typeof line.children>((allEle, ele) => {
      if (ele.type === 'comment' || ele.type === 'text') {
        return allEle
      }

      let pushInfo: { value: string, properties: any } | undefined

      allEle.push({
        ...ele,
        children: ele.children.reduce<any>((subChildren, subEle) => {
          const { match, value, replaceValue, properties } = matchPipe((subEle as any).value)

          if (match) {
            subChildren.push(
              {
                ...subEle,
                value: replaceValue,
              },
            )
            pushInfo = {
              value: value as string,
              properties,
            }
          }
          else {
            subChildren.push(subEle)
          }
          return subChildren
        }, []),
      })

      if (pushInfo) {
        allEle.push({
          type: 'element',
          tagName: pushInfo.value,
          properties: pushInfo.properties,
        } as any)
      }

      return allEle
    }, [])
  },
}

export default transformer

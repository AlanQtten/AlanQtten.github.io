import { cloneVNode, defineComponent, h } from 'vue'
import Quiz from './QuizHolder.vue'

export default defineComponent({
  setup(props, { slots }) {
    return () => {
      // eslint-disable-next-line ts/no-non-null-asserted-optional-chain
      const nodes = slots.default?.()!

      const _nodes = []
      const l = nodes.length

      let questionIndex = 0
      for (let i = 0; i < l; i++) {
        if (nodes[i].type === Quiz) {
          _nodes.push(cloneVNode(nodes[i], {
            questionMark: ++questionIndex,
          }))
        }
        else {
          _nodes.push(nodes[i])
        }

        if (i < l - 1) {
          _nodes.push(h('hr', {
            class: '!border-t !border-aq',
          }))
        }
      }

      return _nodes
    }
  },
})

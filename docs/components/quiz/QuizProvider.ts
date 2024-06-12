import { cloneVNode, defineComponent, h } from 'vue'
import StrongHr from '../hr/StrongHr.vue'

export default defineComponent({
  setup(props, { slots }) {
    return () => {
      // eslint-disable-next-line ts/no-non-null-asserted-optional-chain
      const nodes = slots.default?.()!

      const _nodes = []
      const l = nodes.length

      for (let i = 0; i < l; i++) {
        _nodes.push(cloneVNode(nodes[i], { questionMark: i + 1 }))
        if (i < l - 1) {
          _nodes.push(h(StrongHr))
        }
      }

      return _nodes
    }
  },
})

import { cloneVNode, defineComponent, inject, provide, toRefs } from 'vue'
import { updateAnswerSymbol } from './quiz'

export default defineComponent({
  props: ['name'],
  setup(props, { slots }) {
    const { name } = toRefs(props)

    const updateAnswer = inject<(v: string) => void>(updateAnswerSymbol, () => {})

    function internalUpdateAnswer(payload: string) {
      updateAnswer(payload)
    }

    provide('name', name)
    provide('updateAnswer', internalUpdateAnswer)

    return () => {
      const nodes = slots.default?.()

      return nodes?.map((node, i) =>
        cloneVNode(node, { value: String.fromCharCode(65 + i) }),
      )
    }
  },
})

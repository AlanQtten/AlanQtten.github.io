import { cloneVNode, defineComponent, inject, provide } from 'vue'
import { updateAnswerSymbol } from './quiz'

export default defineComponent({
  setup(props, { slots }) {
    const updateAnswer = inject<(v: string) => void>(updateAnswerSymbol, () => {})

    function internalUpdateAnswer(payload: string) {
      updateAnswer(payload)
    }

    provide('updateAnswer', internalUpdateAnswer)

    return () => {
      const nodes = slots.default?.()

      return nodes?.map((node, i) =>
        cloneVNode(node, { value: String.fromCharCode(65 + i) }),
      )
    }
  },
})

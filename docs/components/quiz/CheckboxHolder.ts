import { cloneVNode, defineComponent, inject, provide, ref, watch } from 'vue'
import { updateAnswerSymbol, updateShowingAnswerSymbol } from './quiz'

export default defineComponent({
  setup(props, { slots }) {
    const updateAnswer = inject<(answer: string[]) => void>(updateAnswerSymbol, () => {})
    const updateShowingAnswer = inject<(sa: string) => void>(updateShowingAnswerSymbol, () => {})

    const correctAnswer = ref<Set<string>>(new Set())
    function internalUpdateAnswer(payload: string) {
      correctAnswer.value.add(payload)
    }

    provide('updateAnswer', internalUpdateAnswer)

    watch(
      correctAnswer,
      (newVal) => {
        const latestAnswer = Array.from(newVal)

        updateAnswer(latestAnswer)
        updateShowingAnswer(latestAnswer.join(','))
      },
      {
        deep: true,
      },
    )

    return () => {
      const nodes = slots.default?.()

      return nodes?.map((node, i) =>
        cloneVNode(node, { value: String.fromCharCode(65 + i) }),
      )
    }
  },
})

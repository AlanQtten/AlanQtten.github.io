import { cloneVNode, defineComponent, inject, provide } from 'vue'
import { onChangeSymbol, updateAnswerSymbol, valueSymbol } from './quiz'

export default defineComponent({
  setup(props, { slots }) {
    const updateAnswer = inject<(v: string) => void>(updateAnswerSymbol, () => {})
    const onChange = inject<((v: any) => void)>(onChangeSymbol)
    const value = inject<string>(valueSymbol)

    function internalUpdateAnswer(payload: string) {
      updateAnswer(payload)
    }

    function interceptOnChange(value: string[]) {
      onChange?.(value[0])
    }

    provide('updateAnswer', internalUpdateAnswer)
    provide(onChangeSymbol, interceptOnChange)
    provide(valueSymbol, [value])

    return () => {
      const nodes = slots.default?.()

      return nodes?.map((node, i) =>
        cloneVNode(node, { value: String.fromCharCode(65 + i) }),
      )
    }
  },
})

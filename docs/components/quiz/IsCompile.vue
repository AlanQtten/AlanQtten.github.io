<script setup lang="ts">
import type { Ref } from 'vue'
import { inject, onMounted, ref, computed } from 'vue'
import { disabledSymbol, nameSymbol, onChangeSymbol, updateAnswerSymbol, updateShowingAnswerSymbol, valueSymbol } from './quiz'

interface Value { compiled?: boolean, result?: string }

const { answer, textarea } = defineProps<{
  answer: Value,
  textarea?: boolean | {
    rows?: number
  }
}>()

const textareaRows = computed(() => {
  if (typeof textarea === 'boolean') {
    return 3
  }
  return textarea?.rows ?? 3
})

type OnChange = (v: Value) => void

const name = inject(nameSymbol, '')
const updateAnswer = inject<(v: Value) => void>(updateAnswerSymbol, () => {})
const updateShowingAnswer = inject<(v: string) => void>(updateShowingAnswerSymbol, () => {})
const defaultValue = ref<Value>(({ compiled: undefined, result: undefined }))
const injectValue = inject<Ref<Value>>(valueSymbol, defaultValue)
const onChange = inject<OnChange>(onChangeSymbol, () => {})
const disabled = inject<boolean>(disabledSymbol)

function handleRadioChange(e: Event) {
  onChange((e.target as HTMLInputElement).value === 'true'
    ? { compiled: true, result: injectValue.value?.result }
    : { compiled: false },
  )
}

function handleInputChange(e: Event) {
  onChange({ compiled: injectValue.value?.compiled, result: (e.target as HTMLInputElement).value })
}

onMounted(() => {
  updateAnswer(answer)
  if (answer.compiled) {
    updateShowingAnswer(`编译成功，输出${answer.result}`)
  }
  else {
    updateShowingAnswer('编译失败')
  }
})
</script>

<template>
  <div class="my-4">
    这段程序：
    <label class="p-2 border-aq border border-solid rounded">
      <input
        type="radio"
        :name="name"
        :value="true"
        :onChange="handleRadioChange"
        :checked="injectValue?.compiled === true"
        :disabled="disabled"
      >

      <span>编译成功</span>
    </label>

    或

    <label class="p-2 border-aq border border-solid rounded">
      <input
        type="radio"
        :name="name"
        :value="false"
        :onChange="handleRadioChange"
        :checked="injectValue?.compiled === false"
        :disabled="disabled"
      >

      <span>编译失败</span>
    </label>
  </div>

  <template v-if="injectValue?.compiled">
    <textarea
      v-if="textarea"
      type="text"
      :value="injectValue?.result"
      :disabled="disabled"
      placeholder="请输入编译结果"
      class="block bg-transparent resize-none w-full"
      @input="handleInputChange"
      :rows="textareaRows"
    />

    <input
      v-else
      type="text"
      :value="injectValue?.result"
      :disabled="disabled"
      placeholder="请输入编译结果"
      class="block"
      @input="handleInputChange"
    >
  </template>
</template>

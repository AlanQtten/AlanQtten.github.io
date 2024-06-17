<script setup lang="ts">
import type { Ref } from 'vue'
import { inject, onMounted, ref } from 'vue'
import { disabledSymbol, onChangeSymbol, updateAnswerSymbol, valueSymbol } from './quiz'

const { answer } = defineProps<{
  answer: string
}>()

type OnChange = (v: string) => void

const updateAnswer = inject<OnChange>(updateAnswerSymbol, () => {})
const defaultValue = ref<string>('')
const value = inject<Ref<string>>(valueSymbol, defaultValue)
const onChange = inject<OnChange>(onChangeSymbol, () => {})
const disabled = inject<boolean>(disabledSymbol)

function handleChange(e: Event) {
  onChange((e.target as HTMLInputElement).value)
}

onMounted(() => {
  updateAnswer(answer)
})
</script>

<template>
  <input
    type="text"
    :value="value"
    :disabled="disabled"
    placeholder="请输入答案"
    class="block"
    @input="handleChange"
  >
</template>

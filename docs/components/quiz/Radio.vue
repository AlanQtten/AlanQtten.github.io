<script setup lang="ts">
import type { Ref } from 'vue'
import { inject, onMounted, ref } from 'vue'
import { disabledSymbol, onChangeSymbol, valueSymbol } from './quiz'

const { answer, value } = defineProps<{
  label?: string
  value: string
  answer?: boolean
}>()

const name = inject<string>('name')
const updateAnswer = inject<(v: string) => void>('updateAnswer', () => {})

type OnChange = (v: string) => void

const defaultValue = ref<string>('')
const injectValue = inject<Ref<string>>(valueSymbol, defaultValue)
const onChange = inject<OnChange>(onChangeSymbol, () => {})
const disabled = inject<boolean>(disabledSymbol)

function handleChange(e: Event) {
  onChange((e.target as HTMLInputElement).value)
}

onMounted(() => {
  if (answer) {
    updateAnswer(value)
  }
})
</script>

<template>
  <label class="flex items-center gap-4">
    <input
      type="radio"
      :value="value"
      :disabled="disabled"
      :checked="value === injectValue"
      :name="name"
      @change="handleChange"
    >

    <span v-if="label">{{ label }}</span>

    <div class="flex-1">
      <slot />
    </div>

  </label>
</template>

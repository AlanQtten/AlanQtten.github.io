<script setup lang="ts">
import type { Ref } from 'vue'
import { inject, ref } from 'vue'
import { disabledSymbol, onChangeSymbol, valueSymbol } from './quiz'

defineProps<{
  label?: string
  value: string
}>()

const name = inject<string>('name')

type OnChange = (v: string) => void

const defaultValue = ref<string>('')
const injectValue = inject<Ref<string>>(valueSymbol, defaultValue)
const onChange = inject<OnChange>(onChangeSymbol, () => {})
const disabled = inject<boolean>(disabledSymbol)

function handleChange(e: Event) {
  onChange((e.target as HTMLInputElement).value)
}
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

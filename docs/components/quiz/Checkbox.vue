<script setup lang="ts">
import type { Ref } from 'vue'
import { inject } from 'vue'

defineProps<{
  label: string
  value: string
}>()

const name = inject<string>('name')
const groupValue = inject<Ref<string[]>>('value')
const onChange = inject<Ref<(v: string[]) => void>>('onChange')
const disabled = inject<boolean>('disabled')

function handleCheckboxChange(e) {
  const _groupValue = groupValue.value ?? []

  if (_groupValue.includes(e.target.value)) {
    onChange.value(_groupValue.filter(v => v !== e.target.value))
  }
  else {
    onChange.value([..._groupValue, e.target.value])
  }
}
</script>

<template>
  <label class="flex items-center gap-4">
    <input
      type="checkbox"
      :value="value"
      :checked="groupValue?.includes(value)"
      :name="name"
      :disabled="disabled"
      @change="handleCheckboxChange"
    >

    <span v-if="label">{{ label }}</span>

    <div class="flex-1">
      <slot />
    </div>
  </label>
</template>

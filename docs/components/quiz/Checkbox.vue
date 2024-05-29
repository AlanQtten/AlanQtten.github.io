<template>
  <label :class="$style.wrapper">
    <input 
      type="checkbox" 
      :value="value"
      :checked="groupValue?.includes(value)"
      :name="name"
      :disabled="disabled"
      @change="handleCheckboxChange"
    />

    <span v-if="label">{{ label }}</span>
    <slot></slot>
  
  </label>
</template>

<script setup lang="ts">
import { inject, Ref } from 'vue'

defineProps<{
  label: string,
  value: string
}>()

const name = inject<string>('name')
const groupValue = inject<Ref<string[]>>('value')
const onChange = inject<Ref<(v: string[]) => void>>('onChange')
const disabled = inject<boolean>('disabled')

const handleCheckboxChange = e => {
  const _groupValue = groupValue.value ?? []

  if(_groupValue.includes(e.target.value)) {
    onChange.value(_groupValue.filter(v => v !== e.target.value))
  } else {
    onChange.value([..._groupValue, e.target.value])
  }
}
</script>

<style module>
.wrapper {
  display: flex;
  gap: 16px;
  align-items: center;
}

.wrapper :global(div[class*='language-']) {
  flex: 1;
}
</style>
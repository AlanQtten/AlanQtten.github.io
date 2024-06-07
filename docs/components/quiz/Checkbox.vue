<script setup lang="ts">
import type { Ref } from 'vue'
import { inject, ref } from 'vue'

defineProps<{
  label?: string
  value: string
}>()

const name = inject<string>('name')

type GroupValue = string[]
type OnChange = (v: GroupValue) => void

const defaultGroupValue = ref<GroupValue>([])
const groupValue = inject<Ref<GroupValue>>('value', defaultGroupValue)
const defaultOnChange = ref<OnChange>(() => {})
const onChange = inject<Ref<OnChange>>('onChange', defaultOnChange)
const disabled = inject<boolean>('disabled')

function handleCheckboxChange(e: Event) {
  const _groupValue = groupValue.value ?? []

  const updateValue = (e.target as HTMLInputElement).value

  if (_groupValue.includes(updateValue)) {
    onChange.value(_groupValue.filter(v => v !== updateValue))
  }
  else {
    onChange.value([..._groupValue, updateValue])
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

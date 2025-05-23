<script setup lang="ts">
import type { Ref } from 'vue'
import { inject, onMounted, ref } from 'vue'
import { disabledSymbol, nameSymbol, onChangeSymbol, valueSymbol } from './quiz'

const { value, answer, inputType = 'radio' } = defineProps<{
  label?: string
  value: string
  answer?: boolean
  inputType?: 'radio' | 'checkbox'
}>()

const name = inject<string>(nameSymbol)

type GroupValue = string[]
type OnChange = (v: GroupValue) => void

const updateAnswer = inject<(v: string) => void>('updateAnswer', () => {})
const defaultGroupValue = ref<GroupValue>([])
const groupValue = inject<Ref<GroupValue>>(valueSymbol, defaultGroupValue)
const onChange = inject<OnChange>(onChangeSymbol, () => {})
const disabled = inject<boolean>(disabledSymbol)

function handleChange(e: Event) {
  const _groupValue = groupValue.value ?? []

  const updateValue = (e.target as HTMLInputElement).value

  if (_groupValue.includes(updateValue)) {
    onChange(_groupValue.filter(v => v !== updateValue))
  }
  else {
    onChange([..._groupValue, updateValue])
  }
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
      :type="inputType"
      :value="value"
      :checked="groupValue?.includes(value)"
      :name="name"
      :disabled="disabled"
      @change="handleChange"
    >

    <span v-if="label">{{ label }}</span>

    <div class="flex-1">
      <slot />
    </div>
  </label>
</template>

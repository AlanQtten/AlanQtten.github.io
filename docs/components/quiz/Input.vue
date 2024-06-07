<script setup lang="ts">
const props = defineProps<{
  value: any
  onChange: (value: string) => void
  disabled?: boolean
}>()

function handleChange(e: Event) {
  props.onChange((e.target as HTMLInputElement).value)
}
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

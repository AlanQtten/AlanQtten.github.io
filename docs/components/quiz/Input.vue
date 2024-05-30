<template>
  <input 
    type="text" 
    :value="value" 
    @input="handleChange"
    :disabled="disabled"
    placeholder="请输入答案"
    class="block"
  />
</template>

<script setup lang="ts">
const props = defineProps<{
  value: any,
  onChange: (value: string) => void,
  disabled: boolean
}>()

const handleChange = e => {
  props.onChange(e.target.value)
}
</script>
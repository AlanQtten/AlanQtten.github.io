<script setup lang="ts">
import { onMounted, ref } from 'vue'

const props = defineProps<{
  options: { key: string | number, message: string }[]
  value: string | number
  onChange: (e: Event) => void
  disabled: boolean
}>()

const uniqueId = ref()

onMounted(() => {
  uniqueId.value = new Date().getTime()
})

function handleChange(e) {
  props.onChange(e.target.value)
}
</script>

<template>
  <div class="flex flex-col">
    <label v-for="option in options" :key="option.key" class="flex items-center">
      <input
        type="radio"
        :value="option.key"
        :disabled="disabled"
        :checked="value === option.key"
        :name="`radio-${uniqueId}`"
        class="m-0 mr-2"
        @change="handleChange"
      >

      <span>{{ option.key }}. {{ option.message }}</span>
    </label>
  </div>
</template>

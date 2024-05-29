<template>
  <div :class="$style.optionHolder">
    <label v-for="option in options" :key="option.key" :class="$style.option">
      <input
        type="radio" 
        :value="option.key" 
        :disabled="disabled"
        :checked="value === option.key"
        :name="`radio-${uniqueId}`"
        @change="handleChange"
      />
      
      <span>{{ option.key }}. {{ option.message }}</span>
    </label>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

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

const handleChange = e => {
  props.onChange(e.target.value)
}

</script>

<style module>
.optionHolder {
  display: flex;
  flex-direction: column; 
}

.option {
  display: flex;
  align-items: center;
}

.option input[type='radio'] {
  margin: 0;
  margin-right: 8px;
}
</style>
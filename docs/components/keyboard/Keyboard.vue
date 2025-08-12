<script setup lang="ts">
import { computed, defineProps, toRefs } from 'vue'

const props = defineProps<{
  value: string | string[]
}>()

const { value: rawValue } = toRefs(props)

const internalValue = computed(() => {
  return Array.isArray(rawValue.value) ? rawValue.value : [rawValue.value]
})
</script>

<template>
  <span
    class="inline-flex gap-2 whitespace-nowrap relative mx-2"
    :class="$style.wrapper"
  >
    <span v-for="(key, index) in internalValue" :key="index" class="border border-aq rounded px-1 relative">
      {{ key }}
    </span>
  </span>
</template>

<style module>
.wrapper span:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  left: calc(100% + 1px);
  height: 1px;
  background-color: var(--aq);
  @apply w-2;
}
</style>

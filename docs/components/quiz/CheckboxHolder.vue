<script setup lang="ts">
import { provide, toRefs } from 'vue'

const props = defineProps<{
  value: string[]
  onChange: (v: string[]) => void
  disabled: boolean
  name: string
}>()

const { value, onChange, disabled, name } = toRefs(props)

provide('value', value)
provide('onChange', onChange)
provide('disabled', disabled)
provide('name', name)
</script>

<template>
  <slot />
</template>

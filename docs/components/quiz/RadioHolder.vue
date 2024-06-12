<script setup lang="ts">
import { provide, toRefs } from 'vue'

const props = defineProps<{
  name: string
}>()

const { name } = toRefs(props)

provide('name', name)
</script>

<template>
  <slot />
</template>

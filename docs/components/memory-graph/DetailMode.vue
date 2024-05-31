<script setup lang="ts">
import { provide, ref } from 'vue'

const props = defineProps<{
  defaultDetailMode: boolean
}>()

const detailMode = ref(props.defaultDetailMode)
provide('detailMode', detailMode)

function toggleDetailMode() {
  detailMode.value = !detailMode.value
}
</script>

<template>
  <div class="relative">
    <button class="absolute right-4 top-4" @click="toggleDetailMode">
      🔬
    </button>

    <slot />
  </div>
</template>

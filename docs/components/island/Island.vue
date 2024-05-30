<template>
<div class="pt-4">

  <button class="mb-4" @click="reload">click me to refresh or resize screen to refresh</button>

  <div class="mb-4">There are <span class="text-aq.error-900">{{ islandCount }}</span> islands here.</div>

  <div class="flex flex-wrap" ref="el">
    <div 
      v-for="(point, index) in map" 
      :key="index" 
      :style="{ backgroundColor: point === 1 ? '#8B7355' : '#1E88E5' }"
      class="w-[50px] h-[50px]"
    >
    </div>
  </div>
</div>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue'
import { useResizeObserver } from '@vueuse/core'

import { countOfIsland } from './utils'

const el = ref(null)
const x = ref(0)
const y = ref(0)
const map = ref([])

const reload = () => {
  map.value = Array(x.value * y.value)
    .fill(0)
    .map(() => {
      return Math.random() - 0.5 < 0 ? 1 : 0
    })
}

const islandCount = computed(() => {
  return countOfIsland(
    map.value,
    x.value,
    y.value
  )
})

watchEffect(reload)

useResizeObserver(el, entries => {
  const { width } = entries[0].contentRect

  const _x = Math.floor(width / 50)

  x.value = _x
  y.value = Math.floor(_x * (2 / 3))
})

</script>
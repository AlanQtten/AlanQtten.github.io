<script setup lang="ts">
import { useResizeObserver } from '@vueuse/core'
import { computed, ref, watchEffect } from 'vue'

import { countOfIsland } from './utils'

const el = ref(null)
const x = ref(0)
const y = ref(0)
const map = ref<number[]>([])

function reload() {
  map.value = Array.from({
    length: x.value * y.value,
  }, () => {
    return Math.random() - 0.5 < 0 ? 1 : 0
  })
}

const islandCount = computed(() => {
  return countOfIsland(
    map.value,
    x.value,
    y.value,
  )
})

watchEffect(reload)

useResizeObserver(el, (entries) => {
  const { width } = entries[0].contentRect

  const _x = Math.floor(width / 50)

  x.value = _x
  y.value = Math.floor(_x * (2 / 3))
})
</script>

<template>
  <div class="pt-4">
    <button class="mb-4" @click="reload">
      click me to refresh or resize screen to refresh
    </button>

    <div class="mb-4">
      There are <span class="text-aq.error-900">{{ islandCount }}</span> islands here.
    </div>

    <div ref="el" class="flex flex-wrap">
      <div
        v-for="(point, index) in map"
        :key="index"
        :style="{ backgroundColor: point === 1 ? '#8B7355' : '#1E88E5' }"
        class="w-[50px] h-[50px]"
      />
    </div>
  </div>
</template>

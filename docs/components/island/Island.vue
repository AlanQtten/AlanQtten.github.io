<template>
<div class="wrapper">

  <button class="mb-16 btn" @click="reload">click me to refresh or resize screen to refresh</button>

  <div class="mb-16">There are <span class="island-count">{{ islandCount }}</span> islands here.</div>

  <div class="map" ref="el">
    <div 
      v-for="(point, index) in map" 
      :key="index" 
      :style="{ backgroundColor: point === 1 ? '#8B7355' : '#1E88E5' }"
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

<style scoped>
  .wrapper {
    padding: 16px 0;
  }

  .mb-16 {
    margin-bottom: 16px;
  }

  .map {
    display: flex;
    flex-wrap: wrap;
  }

  .map div {
    width: 50px;
    height: 50px;
  }

  .island-count {
    color: #ff0000;
  }
</style>
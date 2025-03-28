<script setup lang="ts">
import type { CSSProperties } from 'vue'
import { computed } from 'vue'

const { colors } = defineProps<{
  colors: [string, string]
}>()

const rootStyle = computed<CSSProperties>(() => {
  return {
    height: '80px',
    backgroundImage: `linear-gradient(90deg, ${colors[0]} 0%, ${colors[1]} 100%)`,
    position: 'relative',
  }
})

const leftStyle: CSSProperties = {
  position: 'absolute',
  left: '16px',
  top: '50%',
  transform: 'translateY(-50%)',
}
const rightStyle: CSSProperties = {
  position: 'absolute',
  right: '16px',
  top: '50%',
  transform: 'translateY(-50%)',
}
</script>

<template>
  <div :style="rootStyle" :class="$style.color">
    <span
      :style="{ color: colors[1], ...leftStyle }"
    >
      {{ colors[0] }}
    </span>

    <span
      :style="{ color: colors[0], ...rightStyle }"
    >
      {{ colors[1] }}
    </span>
  </div>
</template>

<style module>
.color {
  cursor: pointer;
  border-radius: 18px;
  transition: all 0.3s;
  font-size: 18px;
  font-weight: 100;
}

.color span {
  transition: transform 0.2s;
  transform-origin: left center;
}

.color span:last-child {
  transform-origin: right center;
}

.color:hover {
  border-radius: 40px;
  font-weight: 900;
}

.color:hover span {
  transform: translateY(-50%) scale(2)!important;
}
</style>

<script setup lang="ts">
import type { CSSProperties } from 'vue'
import { computed } from 'vue'

const { colors } = defineProps<{
  colors: [string, string]
}>()

const style = computed<CSSProperties>(() => {
  return {
    height: '80px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 16px',
    fontWeight: 'bold',
    backgroundImage: `linear-gradient(90deg, ${colors[0]} 0%, ${colors[1]} 100%)`,
  }
})
</script>

<template>
  <div :style="style" :class="$style.color">
    <span
      :style="{ color: colors[1] }"
    >
      {{ colors[0] }}
    </span>

    <span
      :style="{ color: colors[0] }"
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
  border: 2px solid var(--aq);
  font-size: 24px;
}

.color:hover {
  border-radius: 40px;
  border: 4px solid var(--aq);
  font-size: 30px;
}
</style>

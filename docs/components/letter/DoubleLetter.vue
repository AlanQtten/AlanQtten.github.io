<script lang="ts">
import { provide, ref } from 'vue'
import type { LetterProps } from './Letter.vue'
import { F, O, R, W } from './defineLetter'

export default {
  components: {
    R,
    W,
    O,
    F,
  },
}
</script>

<script setup lang="ts">
type L = 'R' | 'W' | 'O' | 'F'

type InternalLetterProps = Omit<LetterProps, 'themeColor'>

withDefaults(defineProps<{
  letterA: L
  letterB: L
  letterAProps?: InternalLetterProps
  letterBProps?: InternalLetterProps
  collapse?: boolean
}>(), {
  letterAProps: () => ({}),
  letterBProps: () => ({}),
})

const hovering = ref(false)

provide('hovering', hovering)

function handleMouseEnter() {
  hovering.value = true
}

function handleMouseLeave() {
  hovering.value = false
}
</script>

<template>
  <div
    class="inline-flex flex-col leading-1 mx-1 -translate-y-[4px]"
    :class="$style.wrapper"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <component
      :is="letterA"
      :plus="letterAProps.plus"
      :minus="letterAProps.minus"
      :slash="letterAProps.slash"
      :empty="letterAProps.empty"
      :missing="letterAProps.missing"
      :class="letterAProps.class"
      :collapse="collapse"
    />

    <component
      :is="letterB"
      :plus="letterBProps.plus"
      :minus="letterBProps.minus"
      :slash="letterBProps.slash"
      :empty="letterBProps.empty"
      :missing="letterBProps.missing"
      :class="letterBProps.class"
      :collapse="collapse"
    />
  </div>
</template>

<style module>
.wrapper>span{
  height: 12px!important;
}
</style>

<script setup lang="ts">
import { computed, inject, ref, toRefs, useCssModule } from 'vue'

export interface LetterProps {
  themeColor: string
  slash?: boolean
  plus?: boolean
  minus?: boolean
  empty?: boolean
  missing?: boolean
  collapse?: boolean
  class?: string
}

const props = defineProps<LetterProps>()

const $style = useCssModule()

const { slash, plus, minus, missing, collapse, themeColor } = toRefs(props)

const hovering = ref(false)
const providedHovering = inject('hovering', ref(false))

const wrapperStyle = computed(() => {
  return `color: ${themeColor.value}!important;--letter-theme: ${themeColor.value}`
})

const classes = computed(() => {
  const basicClass = ['font-bold']

  if (plus.value) {
    basicClass.push('before:content-["+"]', 'before:text-aq')
  }

  if (minus.value) {
    basicClass.push('before:content-["-"]', 'before:text-aq')
  }

  if (slash.value) {
    basicClass.push(
      'relative',
      'before:content-[""]',
      'before:border-l',
      'before:border-aq',
      'before:border-solid',
      'before:absolute',
      'before:h-2/3',
      'before:top-1/2',
      'before:left-1/2',
      'before:-translate-x-1/2',
      'before:-translate-y-1/2',
      'before:rotate-45',
    )
  }

  if (missing.value) {
    basicClass.push($style.missing)
  }

  if (collapse.value) {
    basicClass.push($style.wrapper)
  }

  if (hovering.value || providedHovering.value) {
    basicClass.push($style.hover)
  }

  return basicClass
})

function handleMouseEnter() {
  hovering.value = true
}

function handleMouseLeave() {
  hovering.value = false
}
</script>

<template>
  <span
    :class="classes"
    :style="wrapperStyle"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <template v-if="empty">-</template>
    <span v-else><slot /></span>
  </span>
</template>

<style module>
.wrapper {
  position: relative;
  width: 16px;
  height: 22px;
  display: inline-block;
  cursor: pointer;
  vertical-align: middle;
}

.wrapper span {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0.01);
  transition: transform .3s;
}

.hover span {
  transform: translate(-50%, -50%) scale(1);
}

.wrapper::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--letter-theme);
  border: 1px solid var(--letter-theme);
  transition: transform .3s;
}

.hover::after {
  transform: translate(-50%, -50%) scale(0.01);
}

.missing::after {
  background-color: transparent;
}

.missing span{
  color: transparent!important;
  -webkit-text-stroke: 1px var(--letter-theme);
}
</style>

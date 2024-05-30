<script setup lang="ts">
import type { CSSProperties } from 'vue'
import { ref, watchEffect } from 'vue'

const $props = defineProps<{
  title: string
  titleError: string
  memory: {
    scopeName: string
    stack: {
      key: string
      value: string | string[]
      pointTo: string
      moved: boolean
    }[]
  }[]
  heap: { id: '0', value: string[] | string }[]
}>()

const {
  memory,
} = $props

const wrapper = ref()
const pointer = ref({})
const heapBlock = ref()

function joinPointer(el, scope, frameIndex) {
  if (!pointer.value[scope.scopeName]) {
    pointer.value[scope.scopeName] = []
  }
  pointer.value[scope.scopeName][frameIndex] = el
}

const PX = str => `${str}px`
const validPointTo = pt => pt && pt !== 'null' && pt !== 'null_error'

const linkers = ref([])
watchEffect(() => {
  if (Object.keys(pointer.value).length && heapBlock.value?.length && wrapper.value) {
    const _linkers = []

    // let frameIndex = 0
    memory.forEach((_mm) => {
      _mm.stack.forEach((frame, frameIndex) => {
        if (validPointTo(frame.pointTo)) {
          const start = pointer.value[_mm.scopeName][frameIndex]
          const end = heapBlock.value[frame.pointTo] // TODO: search by id
          const memoryWrapper = wrapper.value

          const startRect = start.getBoundingClientRect()
          const endRect = end.getBoundingClientRect()
          const wrapperRect = memoryWrapper.getBoundingClientRect()

          const style: CSSProperties = {}

          style.position = 'absolute'

          const _width = endRect.left - startRect.left
          const _height = startRect.top - endRect.top + startRect.height

          style.width = PX(_width)
          style.height = PX(_height)
          style.left = PX(startRect.left - wrapperRect.left)
          style.top = PX(endRect.top - wrapperRect.top)

          const svgStyle = { width: _width, height: _height }
          const svgPath = {
            d: `
              M ${startRect.width / 2} ${_height - startRect.height / 2}  
              Q ${Math.floor(_width * 0.5)} ${Math.floor(_height * 0.75)} ${_width / 2} ${_height / 2}
              T ${_width} ${endRect.height / 2} 
            `,
          }
          const svgPolygon = {
            transform: `translate(${_width - 8} ${endRect.height / 2})`,
          }

          _linkers.push({
            style,
            svg: {
              style: svgStyle,
              path: svgPath,
              polygon: svgPolygon,
            },
          })
        }
      })
    })

    linkers.value = _linkers
  }
})
</script>

<template>
  <section>
    <div class="flex gap-2 mb-2">
      <span
        class="border border-aq border-solid px-2 rounded inline-block"
        :class="titleError && 'bg-aq.error-800'"
      >
        {{ title }}
      </span>

      <span v-if="titleError" class="text-aq.error-800">{{ titleError }}</span>
    </div>

    <div ref="wrapper" class="flex items-start gap-16 relative">
      <div class="p-2 border border-aq border-solid ml-2">
        <h6>Stack</h6>

        <div v-for="scope in memory" :key="scope.scopeName">
          <span>{{ scope.scopeName }}</span>

          <table :class="$style.table">
            <tbody>
              <tr v-for="(stack, frameIndex) in scope.stack" :key="stack.key" :class="stack.moved && $style.moved">
                <td>{{ stack.key }}</td>
                <td v-if="stack.pointTo && stack.pointTo.startsWith('null')">
                  <div :class="[$style.pointToNullValue, stack.pointTo === 'null_error' && $style.pointToNullValueError]">
                    <div />
                  </div>
                </td>
                <td
                  v-else-if="stack.pointTo"
                  :ref="el => joinPointer(el, scope, frameIndex)"
                  :class="$style.pointer"
                />
                <td v-else-if="Array.isArray(stack.value)" :class="$style.arrayValue">
                  <span v-for="(value, index) in stack.value" :key="index">{{ value }}</span>
                </td>
                <td v-else>
                  {{ stack.value }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="heap?.length" class="p-2 border border-aq border-solid ml-2">
        <h6>Heap</h6>

        <table :class="$style.table">
          <tbody>
            <tr v-for="(heap, index) in heap" :key="index">
              <td v-if="Array.isArray(heap.value)" ref="heapBlock" :class="$style.arrayValue">
                <span v-for="(value, index) in heap.value" :key="index">{{ value }}</span>
              </td>
              <td v-else ref="heapBlock">
                {{ heap.value }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-for="(linker, index) in linkers" :key="index" :style="linker.style">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          :width="linker.svg.style.width"
          :height="linker.svg.style.height"
        >
          <path
            :d="linker.svg.path.d"
            stroke="var(--aq)"
            stroke-width="1"
            fill="none"
          />

          <polygon
            points="-8,-5 8,0 -8,5 -5,0"
            fill="var(--aq)"
            :transform="linker.svg.polygon.transform"
          />
        </svg>
      </div>
    </div>
  </section>
</template>

<style module>
.pointer {
  position: relative;
  padding: 0 16px!important;
}

.moved {
  opacity: 0.3;
  background: repeating-linear-gradient(
    45deg,
    var(--aq),
    var(--aq) 1px,
    transparent 1px,
    transparent 10px
  );
}

.pointToNullValue {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  position: relative;
  &>div {
    width: 50%;
    height: 50%;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    border: 2px solid var(--aq);
    border-radius: 50%;
  }

  &::before, &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 2px;
    height: 65%;
    background-color: var(--aq);
  }

  &::before { transform: translate(-50%, -50%) rotate(45deg); }
  &::after { transform: translate(-50%, -50%) rotate(-45deg); }
}

.pointToNullValueError {
  border: 2px dashed var(--aq-error);
  &>div {
    border: 2px solid var(--aq-error);
  }

  &::before, &::after {
    background-color: var(--aq-error);
  }
}

.pointer::before {
  content: "";
  width: 8px;
  height: 8px;
  background-color: var(--aq);
  border-radius: 50%;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

.arrayValue span:not(:last-child)::after {
  content: '|';
  display: inline-block;
}

.table {
  margin: 0 0 4px 0 !important;
  width: 100%;
}

.table td {
  padding: 2px 8px;
  border: 1px solid var(--aq);
}
</style>

<template>
<section>
  <div :class="$style.titleWrapper">
    <span :class="[$style.title, titleError && $style.titleError]">{{ title }}</span>

    <span :class="$style.titleErrorMessage" v-if="titleError">{{ titleError }}</span>
  </div>

  <div :class="$style.memoryWrapper" ref="wrapper">
    <div :class="$style.scopeWrapper">
      <h6>Stack</h6>

      <div v-for="scope in memory" :key="scope.scopeName" :class="$style.stackScope">
        <span>{{ scope.scopeName }}</span>

        <table :class="$style.table">
          <tbody>
            <tr v-for="(stack, frameIndex) in scope.stack" :key="stack.key" :class="stack.moved && $style.moved">
              <td>{{ stack.key }}</td>
              <td v-if="stack.pointTo && stack.pointTo.startsWith('null')">
                <div :class="[$style.pointToNullValue, stack.pointTo === 'null_error' && $style.pointToNullValueError]">
                  <div></div>
                </div>
              </td>
              <td 
                v-else-if="stack.pointTo" 
                :class="$style.pointer" 
                :ref="el => joinPointer(el, scope, frameIndex)"
              ></td>
              <td v-else-if="Array.isArray(stack.value)" :class="$style.arrayValue">
                <span v-for="(value, index) in stack.value" :key="index">{{ value }}</span>
              </td>
              <td v-else>{{ stack.value }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>


    <div :class="$style.scopeWrapper" v-if="heap?.length">
      <h6>Heap</h6>

      <table :class="$style.table">
        <tbody>
          <tr v-for="(heap, index) in heap" :key="index">
            <td v-if="Array.isArray(heap.value)" :class="$style.arrayValue" ref="heapBlock">
              <span v-for="(value, index) in heap.value" :key="index">{{ value }}</span>
            </td>
            <td v-else ref="heapBlock">{{ heap.value }}</td>
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
          stroke="var(--vp-c-text-1)"
          stroke-width="1"
          fill="none"
        />

        <polygon
          points="-8,-5 8,0 -8,5 -5,0" 
          fill="var(--vp-c-text-1)"
          :transform="linker.svg.polygon.transform"
        />
      </svg>
    </div>
  </div>
</section>
</template>

<script setup lang="ts">
import { ref, watchEffect, CSSProperties } from 'vue'

const $props = defineProps<{
  title: string
  titleError: string
  memory: { 
    scopeName: string, 
    stack: { 
      key: string, 
      value: string | string[],
      pointTo: string,
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

const joinPointer = (el, scope, frameIndex) => {
  if(!pointer.value[scope.scopeName]) {
    pointer.value[scope.scopeName] = []
  }
  pointer.value[scope.scopeName][frameIndex] = el
}

const PX = (str) => `${str}px`
const validPointTo = (pt) => pt && pt !== 'null' && pt !== 'null_error'

const linkers = ref([])
watchEffect(() => {
  if(Object.keys(pointer.value).length && heapBlock.value?.length && wrapper.value) {
    let _linkers = []

    // let frameIndex = 0
    memory.forEach(_mm => {
      _mm.stack.forEach((frame, frameIndex) => {
        if(validPointTo(frame.pointTo)) {
          const start = pointer.value[_mm.scopeName][frameIndex]
          const end = heapBlock.value[frame.pointTo] // TODO: search by id
          const memoryWrapper = wrapper.value

          const startRect = start.getBoundingClientRect()
          const endRect = end.getBoundingClientRect()
          const wrapperRect = memoryWrapper.getBoundingClientRect()

          const style: CSSProperties = {}

          style.position = 'absolute'; 

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
            transform: `translate(${_width - 8} ${endRect.height / 2})`
          }
          
          _linkers.push({ 
            style, 
            svg: {
              style: svgStyle,
              path: svgPath,
              polygon: svgPolygon
            }
          })
        }
      })
    })
    
    linkers.value = _linkers
  }
})
</script>

<style module>
.memoryWrapper {
  width: auto;
  display: flex;
  align-items: flex-start;
  gap: 64px;
  position: relative;
}

.titleWrapper {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.title {
  border: 1px solid var(--vp-c-text-1);
  border-radius: 2px;
  padding: 0 8px;
  display: inline-block;
}

.titleError {
  background-color: var(--aq-error);
}

.titleErrorMessage {
  color: var(--aq-error);
}

.scopeWrapper {
  padding: 8px;
  border: 1px dashed var(--vp-c-text-1);
  margin-left: 8px;
}

.stackScope {
  display: flex;
  flex-direction: column;
}

.pointer {
  position: relative;
  padding: 0 16px!important;
}

.moved {
  opacity: 0.3;
  background: repeating-linear-gradient(
    45deg, 
    var(--vp-c-text-1), 
    var(--vp-c-text-1) 1px, 
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
    border: 2px solid var(--vp-c-text-1);
    border-radius: 50%;
  }

  &::before, &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 2px;
    height: 65%;
    background-color: var(--vp-c-text-1);
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
  background-color: var(--vp-c-text-1);
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
  border: 1px solid var(--vp-c-text-1);
}
</style>
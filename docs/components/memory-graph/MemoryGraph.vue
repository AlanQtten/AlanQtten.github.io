<script setup lang="ts">
import type { CSSProperties, Ref } from 'vue'
import { inject, ref, watchEffect } from 'vue'
import findElementAndIndex from '../../utils/findElementAndIndex'
import type { Detail } from './UnwrapPointer.vue'
import UnwrapPointer from './UnwrapPointer.vue'

export type Point2 = 'null' | 'null_error' | number | string
interface Linker {
  style: CSSProperties
  svg: {
    style: CSSProperties
    path: {
      d: string
      style?: CSSProperties
    }
    polygon: {
      transform: string
      style?: CSSProperties
    }
  }

}
interface Frame {
  name: string
  body: Array<{
    key: string
    value: string | string[]
    point2: Point2
    svgCurve?: {
      x1?: number
      y1?: number
      x2?: number
      y2?: number
    }
    moved: boolean
    detail: Detail
  }>
}

const $props = defineProps<{
  title: string
  errorMessage?: string
  wrapperStyle?: CSSProperties
  memory: {
    stack: Array<Frame>
    heap: Array<{ id: number, value: string | string[], point2?: Point2 }>
  }
}>()

const {
  memory,
} = $props

const wrapper = ref()
const pointer = ref<Record<string, HTMLElement[]>>({})
const heapBlock = ref()
const linkers = ref<Linker[]>([])

const detailMode = inject<Ref<boolean>>('detailMode', ref(false))

function joinPointer(el: HTMLElement, frameName: string, frameIndex: number) {
  if (!pointer.value[frameName]) {
    pointer.value[frameName] = []
  }
  pointer.value[frameName][frameIndex] = el
}

const PX = (num: number) => `${num}px`
const validPointTo = (pt: Point2) => pt !== undefined && pt !== null && pt !== 'null' && pt !== 'null_error'

watchEffect(() => {
  if (Object.keys(pointer.value).length && heapBlock.value?.length && wrapper.value) {
    const _linkers: Linker[] = []
    const { left: wl, top: wt } = wrapper.value.getBoundingClientRect()

    memory.stack.forEach((frame) => {
      frame.body.forEach((ele, frameIndex) => {
        if (validPointTo(ele.point2)) {
          const start = pointer.value[frame.name][frameIndex]

          const { width: sw, height: sh, left: sl, top: st } = start.getBoundingClientRect()

          const style: CSSProperties = {
            position: 'absolute',
          }

          if (typeof ele.point2 === 'number') {
            const end = heapBlock.value[ele.point2] // TODO: search by id
            const {
              height: eh,
              left: el,
              top: et,
            } = end.getBoundingClientRect()

            const _width = el - sl
            const _height = st - et + sh

            style.width = PX(_width)
            style.height = PX(_height)
            style.left = PX(sl - wl)
            style.top = PX(et - wt)

            const svgStyle = { width: _width, height: _height }

            const x1 = ele.svgCurve?.x1 ?? 0.5
            const y1 = ele.svgCurve?.y1 ?? 0.75
            const x2 = ele.svgCurve?.x2 ?? 0.5
            const y2 = ele.svgCurve?.y2 ?? 0.5

            const commonStyle = ele.moved ? { opacity: 0.3 } : {}

            const svgPath = {
              d: `
                M ${sw / 2} ${_height - sh / 2}  
                Q ${Math.floor(_width * x1)} ${Math.floor(_height * y1)} ${_width * x2} ${_height * y2}
                T ${_width} ${eh / 2} 
              `,
              style: commonStyle,
            }
            const svgPolygon = {
              transform: `translate(${_width - 8} ${eh / 2})`,
              style: commonStyle,
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
          else if (/^\d+\./.test(ele.point2)) {
            const [targetHeap, targetHeapIndex] = ele.point2.split('.').map(Number)

            const end = heapBlock.value[targetHeap].children[targetHeapIndex - 1] // TODO: search by id
            const {
              width: ew,
              height: eh,
              left: el,
              top: et,
            } = end.getBoundingClientRect()

            const _width = el - sl + ew
            const _height = st - et + sh

            style.width = PX(_width)
            style.height = PX(_height)
            style.left = PX(sl - wl)
            style.top = PX(et - wt)

            const svgStyle = { width: _width, height: _height }
            const gapX = el - sl - sw

            const commonStyle = ele.moved ? { opacity: 0.3 } : {}

            const svgPath = {
              d: `
                M ${sw / 2} ${_height - sh / 2}  
                Q ${sw + gapX * 0.25} ${_height} ${sw + gapX * 0.65} ${_height * 0.8}
                T ${_width - ew / 2} ${eh} 
              `,
              style: commonStyle,
            }
            const svgPolygon = {
              transform: `translate(${_width - ew / 2} ${eh + 4}) rotate(-90)`,
              style: commonStyle,
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
          else if (ele.point2.includes('.')) {
            const [targetScopeName, targetFrameKey] = ele.point2.split('.')

            const targetScopeIndex = memory.stack.findIndex(frame => frame.name === targetScopeName)
            const [targetFrame, targetFrameIndex] = findElementAndIndex(memory.stack[targetScopeIndex].body, variable => variable.key === targetFrameKey)!

            const end = pointer.value[targetScopeName][targetFrameIndex]
            const endRect = end.getBoundingClientRect()

            const _width = Math.max(sw, endRect.width) + 64 + 8 // TODO: 4rem + 0.5rem
            const _height = st - endRect.top + sh

            style.width = PX(_width)
            style.height = PX(_height)
            style.left = PX(Math.min(sl, endRect.left) - wl)
            style.top = PX(endRect.top - wt)

            const svgStyle = { width: _width, height: _height }

            const gapY = _height - sh - endRect.height

            const fixL = Math.max(endRect.left - sl, 0)
            const fixYPercent = validPointTo(targetFrame.point2) ? 0.75 : 0.5

            const svgPath = {
              d: `
                M ${sw / 2} ${_height - sh / 2}  
                C ${_width * 0.75} ${gapY + endRect.height}, 
                  ${_width * 1.5} ${gapY * -0.2 + endRect.height}, 
                  ${endRect.width + fixL} ${endRect.height * fixYPercent} 
              `,
            }
            const svgPolygon = {
              transform: `translate(${endRect.width + 8 + fixL}, ${endRect.height * fixYPercent}) rotate(180)`,
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
        }
      })
    });

    (memory.heap ?? []).forEach((hp, _hpIndex) => {
      if (typeof hp.point2 === 'string') {
        const [targetScopeName, targetFrameKey] = hp.point2.split('.')

        const targetScopeIndex = memory.stack.findIndex(frame => frame.name === targetScopeName)
        const [targetFrame, targetFrameIndex] = findElementAndIndex(memory.stack[targetScopeIndex].body, variable => variable.key === targetFrameKey)!

        const start = pointer.value[targetScopeName][targetFrameIndex]
        const end = heapBlock.value[_hpIndex]
        const { width: sw, height: sh, top: st, left: sl } = start.getBoundingClientRect()
        const { width: ew, height: eh, top: et, left: el } = end.getBoundingClientRect()

        const gapX = el - sl - sw
        const gapY = Math.abs(et - st)

        const w = Math.abs(sl - el) + ew
        const h = gapY + (st > et ? sh : eh) + 64

        const style: CSSProperties = {
          position: 'absolute',
        }

        style.width = PX(w)
        style.height = PX(h)
        style.left = PX(sl - wl)
        style.top = PX(Math.min(st, et) - wt)

        const svgStyle = { width: w, height: h }

        const fixRT = et > st ? gapY : 0
        const fixLT = et > st ? 0 : gapY
        const fixStartPercent = memory.stack.some(frame => frame.body.some(variable => variable.point2 === hp.id))
          ? 0.75
          : 0.5
        const fixEndPercent = validPointTo(targetFrame.point2) ? 0.75 : 0.5

        const svgPath = {
          d: `
            M ${w - eh} ${eh * fixStartPercent + fixRT}  
            C ${sw + gapX * 0.5} ${eh * fixStartPercent + fixRT}, 
              ${sw + gapX * 0.9} ${h}, 
              ${sw + gapX / 2} ${h - 1}
            C ${sw + gapX * 0.1} ${h - 1},
              ${sw + gapX * 0.75} ${sh * fixEndPercent + fixLT},
              ${sw} ${sh * fixEndPercent + fixLT}
          `,
        }
        const svgPolygon = {
          transform: `translate(${sw + 8}, ${sh * fixEndPercent + fixLT}) rotate(180)`,
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

    linkers.value = _linkers
  }
})
</script>

<template>
  <section :style="wrapperStyle">
    <div class="flex gap-2 mb-2">
      <span
        class="border border-aq border-solid px-2 rounded inline-block"
        :class="errorMessage && 'bg-aq.error-800'"
      >
        {{ title }}
      </span>

      <span v-if="errorMessage" class="text-aq.error-800">{{ errorMessage }}</span>
    </div>

    <div ref="wrapper" class="flex items-start gap-16 relative">
      <div class="p-2 border border-aq border-solid ml-2">
        <h6>Stack</h6>

        <div v-for="frame in memory.stack" :key="frame.name">
          <span>{{ frame.name }}</span>

          <table :class="$style.table">
            <tbody>
              <tr v-for="(ele, frameIndex) in frame.body" :key="ele.key" :class="ele.moved && $style.moved">
                <td>{{ ele.key }}</td>

                <!-- null -->
                <td v-if="ele.point2 === 'null'">
                  <div :class="$style.pointToNullValue">
                    <div />
                  </div>
                </td>

                <!-- null_error -->
                <td v-else-if="ele.point2 === 'null_error'">
                  <div :class="[$style.pointToNullValue, $style.pointToNullValueError]">
                    <div />
                  </div>
                </td>

                <!-- pointer with detail -->
                <td v-else-if="detailMode && ele.detail">
                  <UnwrapPointer
                    :resolve-ref="el => joinPointer(el, frame.name, frameIndex)"
                    :detail="ele.detail"
                  />
                </td>

                <!-- normal pointer -->
                <td
                  v-else-if="ele.point2 || ele.point2 === 0"
                  :ref="el => joinPointer((el as HTMLElement), frame.name, frameIndex)"
                  :class="$style.pointer"
                />

                <!-- array value -->
                <td v-else-if="Array.isArray(ele.value)" :class="$style.arrayValue">
                  <span v-for="(value, index) in ele.value" :key="index">{{ value }}</span>
                </td>

                <!-- normal value -->
                <td v-else :ref="el => joinPointer((el as HTMLElement), frame.name, frameIndex)">
                  {{ ele.value }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="memory.heap?.length" class="p-2 border border-aq border-solid">
        <h6>Heap</h6>

        <table :class="$style.table">
          <tbody>
            <tr v-for="(hp, index) in memory.heap" :key="index">
              <!-- pointer to stack -->
              <td
                v-if="hp.point2"
                ref="heapBlock"
                :class="$style.pointer"
              />

              <!-- array value -->
              <td v-else-if="Array.isArray(hp.value)" ref="heapBlock" :class="$style.arrayValue">
                <span v-for="(value, j) in hp.value" :key="j">{{ value }}</span>
              </td>

              <!-- normal value -->
              <td v-else ref="heapBlock">
                {{ hp.value }}
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
            :style="linker.svg.path.style"
            class="stroke-aq.fill"
            stroke-width="1"
            fill="none"
          />

          <polygon
            points="-8,-5 8,0 -8,5 -5,0"
            class="fill-aq.fill"
            :transform="linker.svg.polygon.transform"
            :style="linker.svg.polygon.style"
          />
        </svg>
      </div>
    </div>
  </section>
</template>

<style module>
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

.pointer {
  position: relative;
  padding: 16px!important;
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

.arrayValue {
  text-align: left!important;
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
  text-align: center;
}
</style>

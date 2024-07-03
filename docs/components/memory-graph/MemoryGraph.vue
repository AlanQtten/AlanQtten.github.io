<script setup lang="ts">
import type { CSSProperties, Ref } from 'vue'
import { inject, ref, watch } from 'vue'
import findElementAndIndex from '../../utils/findElementAndIndex'
import type { Detail } from './UnwrapPointer.vue'
import UnwrapPointer from './UnwrapPointer.vue'
import type { Options } from './line'
import { LineType, line } from './line'

export type Point2 = 'null' | 'null_error' | number | string | number[] | [string, number][]
interface Linker {
  style: CSSProperties
  path: {
    d: string
    style?: CSSProperties
  }
  polygon: {
    transform: string
    style?: CSSProperties
  }
  extraPolygon?: {
    points: string
    transform?: string
    style?: CSSProperties
  }
}
interface Frame {
  name: string
  body: Array<{
    key: string
    value: string | string[]
    point2: Point2
    modifier?: Options['modifier']
    moved: boolean
    detail: Detail
    forceShowDetail?: boolean
    forceAsRef?: boolean
    pointerWrap?: [string, string]
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

const validPointTo = (pt?: Point2) => pt !== undefined && pt !== null && pt !== 'null' && pt !== 'null_error'

watch(
  [pointer, heapBlock, wrapper, detailMode],
  ([pointerValue, heapEl, wrapperEl]) => {
    if (!Object.keys(pointerValue).length || !wrapperEl) {
      return
    }

    const _linkers: Linker[] = []

    try {
      memory.stack.forEach((frame) => {
        frame.body.forEach((ele, frameIndex) => {
          if (validPointTo(ele.point2) && typeof ele.point2 === 'string' && !/^\d+\./.test(ele.point2) && ele.point2.includes('.')) {
            const start = pointerValue[frame.name][frameIndex]
            // stack ---> stack by scope.key
            const [targetScopeName, targetFrameKey] = ele.point2.split('.')

            const targetScopeIndex = memory.stack.findIndex(frame => frame.name === targetScopeName)
            const [targetFrame, targetFrameIndex] = findElementAndIndex(memory.stack[targetScopeIndex].body, variable => variable.key === targetFrameKey)!

            const end = pointer.value[targetScopeName][targetFrameIndex]

            const [svg] = line(start, end, LineType.right2right, {
              wrapper: wrapper.value,
              pointTo: 'edge',
              modifier: {
                pointStart(p, pkg) {
                  if (validPointTo(targetFrame.point2)) {
                    return [p[0], p[1] + pkg.endHeight * 0.25]
                  }
                  return p
                },
              },
            })

            _linkers.push({
              style: svg.style,
              path: {
                d: svg.path.d,
              },
              polygon: {
                transform: svg.polygon.transform,
              },
            })
          }
        })
      })

      if (heapEl?.length) {
        memory.stack.forEach((frame) => {
          frame.body.forEach((ele, frameIndex) => {
            if (validPointTo(ele.point2)) {
              const start = pointerValue[frame.name][frameIndex]

              if (Array.isArray(ele.point2)) {
                (ele.point2 as [string, number][]).forEach(([elClassName, p2]) => {
                  const start = wrapper.value.querySelector(`.${elClassName}`) as HTMLElement

                  // stack ---> heap by id
                  const end = heapBlock.value[memory.heap.findIndex(hp => hp.id === p2)]
                  const [svg] = line(start, end, LineType.right2left, { wrapper: wrapper.value, pointTo: 'edge' })
                  const commonStyle: CSSProperties = ele.moved ? { opacity: 0.3 } : {}

                  _linkers.push({
                    style: svg.style,
                    path: {
                      d: svg.path.d,
                      style: commonStyle,
                    },
                    polygon: {
                      transform: svg.polygon.transform,
                      style: commonStyle,
                    },
                  })
                })
              }
              else if (typeof ele.point2 === 'number') {
                // stack ---> heap by id
                let holdStart = start
                if (ele.pointerWrap) {
                  holdStart = start.children[0].children[0] as HTMLElement
                }
                const end = heapBlock.value[memory.heap.findIndex(hp => hp.id === ele.point2)]
                const [svg] = line(holdStart, end, LineType.right2left, { wrapper: wrapper.value, pointTo: 'edge' })
                const commonStyle: CSSProperties = ele.moved ? { opacity: 0.3 } : {}

                _linkers.push({
                  style: svg.style,
                  path: {
                    d: svg.path.d,
                    style: commonStyle,
                  },
                  polygon: {
                    transform: svg.polygon.transform,
                    style: commonStyle,
                  },
                })
              }
              else if (/^\d+\./.test(ele.point2)) {
                const [targetHeapId, targetHeapIndexOrRange] = ele.point2.split('.')

                if (targetHeapIndexOrRange.includes('-')) {
                  // stack ---> heap by collection slice
                  const _targetHeapId = +targetHeapId
                  const [targetHeapIndexStart, targetHeapIndexEnd] = targetHeapIndexOrRange.split('-').map(Number)

                  const end = heapBlock.value[memory.heap.findIndex(hp => hp.id === _targetHeapId)]
                  const endList = end.children as HTMLElement[]
                  const recGroup = Array.from(endList).map((node: HTMLElement) => {
                    const styleBlock = getComputedStyle(node)
                    const rect = node.getBoundingClientRect()

                    return {
                      width: rect.width,
                      height: rect.height,
                      marginRight: Number.parseInt(styleBlock.marginRight),
                    }
                  })

                  const extraPolygonWidth = recGroup
                    .slice(targetHeapIndexStart, targetHeapIndexEnd)
                    .reduce((acc, cur) => acc + cur.width + cur.marginRight, 0)
                  const offsetX = recGroup
                    .slice(0, targetHeapIndexStart)
                    .reduce((acc, cur) => acc + cur.width + cur.marginRight, 0)

                  const [svg] = line(start, endList[0], {
                    lineType: LineType.right2bottom,
                    options: {
                      offsetX: offsetX + extraPolygonWidth,
                    },
                  }, {
                    wrapper: wrapper.value,
                    pointTo: 'edge',
                    modifier: {
                      pointEnd(p) {
                        return [
                          p[0]
                          - recGroup[0].width / 2
                          + offsetX + extraPolygonWidth / 2,
                          p[1] + 3,
                        ]
                      },
                      ...ele.modifier,
                    },
                  })

                  const commonStyle = ele.moved ? { opacity: 0.3 } : {}

                  _linkers.push({
                    style: svg.style,
                    path: {
                      d: svg.path.d,
                      style: commonStyle,
                    },
                    polygon: {
                      transform: svg.polygon.transform,
                      style: commonStyle,
                    },
                    extraPolygon: {
                      points: `0,0 ${extraPolygonWidth},0 ${extraPolygonWidth},3 0,3`,
                      transform: `translate(${Number.parseInt(svg.style.width as string) - extraPolygonWidth - 9}, ${recGroup[0].height})`,
                    },
                  })
                }
                else {
                  // stack ---> heap by collection
                  const _targetHeapId = +targetHeapId
                  const targetHeapIndex = +targetHeapIndexOrRange

                  const end = heapBlock.value[memory.heap.findIndex(hp => hp.id === _targetHeapId)].children[targetHeapIndex - 1]
                  const [svg] = line(start, end, LineType.right2bottom, { wrapper: wrapper.value, pointTo: 'edge' })

                  const commonStyle = ele.moved ? { opacity: 0.3 } : {}

                  _linkers.push({
                    style: svg.style,
                    path: {
                      d: svg.path.d,
                      style: commonStyle,
                    },
                    polygon: {
                      transform: svg.polygon.transform,
                      style: commonStyle,
                    },
                  })
                }
              }
            }
          })
        });

        (memory.heap ?? []).forEach((hp, _hpIndex) => {
          if (!validPointTo(hp.point2)) {
            return
          }
          if (typeof hp.point2 === 'string') {
            // heap ---> stack by scope.key
            const [targetScopeName, targetFrameKey] = hp.point2.split('.')

            const targetScopeIndex = memory.stack.findIndex(frame => frame.name === targetScopeName)
            const [targetFrame, targetFrameIndex] = findElementAndIndex(memory.stack[targetScopeIndex].body, variable => variable.key === targetFrameKey)!

            const start = pointer.value[targetScopeName][targetFrameIndex]
            const end = heapBlock.value[_hpIndex]

            const isTargetFrameValidPointer = validPointTo(targetFrame.point2)
            const isCurrentHeapBeingPointAt = memory.stack.some(frame => frame.body.some(variable => variable.point2 === hp.id))

            const [svg] = line(start, end, LineType.right2bottom2left, {
              wrapper: wrapper.value,
              reverse: true,
              pointTo: 'edge',
              startFrom: 'edge',
              modifier: {
                pointStart(p, pkg) {
                  if (isTargetFrameValidPointer) {
                    return [p[0], p[1] + pkg.startHeight * 0.25]
                  }
                  return p
                },
                pointEnd(p, pkg) {
                  if (isCurrentHeapBeingPointAt) {
                    return [p[0], p[1] + pkg.endHeight * 0.25]
                  }
                  return p
                },
              },
            })

            _linkers.push({
              style: svg.style,
              path: {
                d: svg.path.d,
              },
              polygon: {
                transform: svg.polygon.transform,
              },
            })
          }
          else if (typeof hp.point2 === 'number') {
            // heap ---> heap by id
            const start = heapBlock.value[_hpIndex]
            const end = heapBlock.value[memory.heap.findIndex(_hp => _hp.id === hp.point2)]

            const [svg] = line(start, end, LineType.right2right, {
              wrapper: wrapper.value,
              pointTo: 'edge',
            })

            _linkers.push({
              style: svg.style,
              path: {
                d: svg.path.d,
              },
              polygon: {
                transform: svg.polygon.transform,
              },
            })
          }
          else if (Array.isArray(hp.point2)) {
            // heap ---> multi heap by id
            const start = heapBlock.value[_hpIndex]

            let offsetX = 60
            let offsetY = 60
            hp.point2.forEach((targetHeapId, i) => {
              const end = heapBlock.value[memory.heap.findIndex(_hp => _hp.id === targetHeapId)]

              const [svg] = line(start.children[i], end, {
                lineType: LineType.bottom2right,
                options: {
                  offsetX,
                  offsetY,
                },
              }, {
                wrapper: wrapper.value,
                pointTo: 'edge',
              })

              offsetX += 30
              offsetY += 30

              _linkers.push({
                style: svg.style,
                path: {
                  d: svg.path.d,
                },
                polygon: {
                  transform: svg.polygon.transform,
                },
              })
            })
          }
        })
      }

      if (_linkers.length) {
        linkers.value = _linkers
      }
    }
    catch (e) {
      console.error(e)
    }
  },
  {
    immediate: true,
    flush: 'post',
  },
)
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

    <div ref="wrapper" class="flex items-start = relative" :class="!detailMode && 'gap-16'">
      <div class="p-2 border border-aq border-dashed ml-2">
        <h6>Stack</h6>

        <div v-for="frame in memory.stack" :key="frame.name">
          <span>{{ frame.name }}</span>

          <table :class="$style.table">
            <tbody>
              <tr v-for="(ele, frameIndex) in frame.body" :key="ele.key" :class="ele.moved && $style.moved">
                <td>{{ ele.key }}</td>

                <!-- null -->
                <td v-if="ele.point2 === 'null'" :ref="el => joinPointer((el as HTMLElement), frame.name, frameIndex)">
                  <div :class="$style.pointToNullValue">
                    <div />
                  </div>
                </td>

                <!-- null_error -->
                <td v-else-if="ele.point2 === 'null_error'" :ref="el => joinPointer((el as HTMLElement), frame.name, frameIndex)">
                  <div :class="[$style.pointToNullValue, $style.pointToNullValueError]">
                    <div />
                  </div>
                </td>

                <!-- pointer with detail -->
                <td
                  v-else-if="(detailMode && ele.detail) || ele.forceShowDetail"
                  :ref="el => {
                    ele.forceAsRef && joinPointer(el as HTMLElement, frame.name, frameIndex)
                  }"
                >
                  <UnwrapPointer
                    :resolve-ref="el => joinPointer(el, frame.name, frameIndex)"
                    :detail="ele.detail"
                  />
                </td>

                <!-- normal pointer -->
                <td
                  v-else-if="ele.point2 || ele.point2 === 0"
                  :ref="el => joinPointer((el as HTMLElement), frame.name, frameIndex)"
                >
                  <span :class="$style.stackPointer">
                    <span />
                    <span v-if="ele.pointerWrap && ele.pointerWrap[0]">{{ ele.pointerWrap[0] }}</span>
                    <span v-if="ele.pointerWrap && ele.pointerWrap[1]">{{ ele.pointerWrap[1] }}</span>
                  </span>
                </td>

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

      <div v-if="memory.heap?.length" class="p-2 border border-aq border-dashed">
        <h6>Heap</h6>

        <table :class="$style.table">
          <tbody>
            <tr v-for="(hp, index) in memory.heap" :key="index">
              <!-- null -->
              <td v-if="hp.point2 === 'null'" ref="heapBlock">
                <div :class="$style.pointToNullValue">
                  <div />
                </div>
              </td>

              <!-- null_error -->
              <td v-else-if="hp.point2 === 'null_error'" ref="heapBlock">
                <div :class="[$style.pointToNullValue, $style.pointToNullValueError]">
                  <div />
                </div>
              </td>

              <!-- multi pointer in one block -->
              <td
                v-else-if="Array.isArray(hp.point2)"
                ref="heapBlock"
                :class="$style.arrayValue"
              >
                <span v-for="p in hp.point2 as number[]" :key="p" :class="$style.pointer" class="!px-2" />
              </td>

              <!-- pointer to stack -->
              <td
                v-else-if="hp.point2 || hp.point2 === 0"
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

      <svg
        v-for="(linker, index) in linkers"
        :key="index"
        class="pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
        :style="linker.style"
      >
        <path
          :d="linker.path.d"
          :style="linker.path.style"
          class="stroke-aq.fill"
          stroke-width="1"
          fill="none"
        />

        <polygon
          points="-8,-5 8,0 -8,5 -5,0"
          class="fill-aq.fill"
          :transform="linker.polygon.transform"
          :style="linker.polygon.style"
        />

        <polygon
          v-if="linker.extraPolygon"
          class="fill-aq.fill"
          :points="linker.extraPolygon.points"
          :transform="linker.extraPolygon.transform"
          :style="linker.extraPolygon.style"
        />
      </svg>
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

td.pointer.pointer {
  position: relative;
  padding: 16px;
}

.pointer::before {
  content: "";
  width: 8px;
  height: 8px;
  background-color: var(--aq-fill);
  border-radius: 50%;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

.stackPointer {
  display: flex;
  align-items: center;
  justify-content: center;
}

.stackPointer span:nth-child(1) {
  display: block;
  width: 8px;
  height: 8px;
  background-color: var(--aq-fill);
  border-radius: 50%;
  order: 2;
}
.stackPointer span:nth-child(2) {
  order: 1;
}
.stackPointer span:nth-child(3) {
  order: 3;
}

.arrayValue {
  text-align: left!important;
  white-space: nowrap;
}

.arrayValue span {
  position: relative;
  margin-right: 9px;
}

.arrayValue span:not(:last-child)::after {
  content: "";
  position: absolute;
  top: 1px;
  bottom: 1px;
  width: 1px;
  background-color: var(--aq);
  right: -5px;
  /* content: '|';
  display: inline-block; */
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

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { O, R, W } from './index'

type PermissionHandle =
  'p' // plus
  | 'm' // minus
  | 's' // slash
  | 'e' // empty

type Operation =
  'g' // gain
  | 'l' // loose
  | 'b' // borrow
  | 'r' // regain

const props = defineProps<{
  defaultGraphCollapse?: boolean
  perms: Array<
    {
      var: string
      operation: Operation
      P: PermissionHandle | [PermissionHandle, PermissionHandle, PermissionHandle]
      collapse?: boolean
    }
  >
}>()

const table = ref()
const line = ref()
const lineRect = ref({ left: 0, right: 0 })
const tableRect = ref({ top: 0 })

function renderLine() {
  const parent = line.value.parentElement // this is code line wrapper

  const { left: parentLeft, height: parentHeight } = parent.getBoundingClientRect()
  const { width: tableWidth } = table.value?.getBoundingClientRect() ?? {}

  const lastUnrelatedEle = Array.from(parent.children)
    .findLast(ele => ele !== table.value && ele !== line.value) as HTMLTableCellElement

  const { left: eleLeft, width: eleWidth } = lastUnrelatedEle.getBoundingClientRect()

  lineRect.value = {
    left: eleLeft - parentLeft + eleWidth,
    right: tableWidth,
  }
  tableRect.value = {
    top: parentHeight,
  }
}

onMounted(() => {
  renderLine()
})

const internalLetterChart = computed(() => {
  let startCollapseIndex = Infinity
  return props.perms.map((per, eleIndex) => {
    if (per.collapse) {
      startCollapseIndex = eleIndex
    }

    return {
      ...per,
      P: typeof per.P === 'string' ? Array(3).fill(per.P) : per.P,
      collapsable: eleIndex > startCollapseIndex,
    }
  })
})

const showCollapseIndex = computed(() => {
  return internalLetterChart.value.findIndex(ele => ele.collapse)
})

const collapsing = ref(true)
const tableCollapse = ref(props.defaultGraphCollapse)

function toggleCollapsing() {
  collapsing.value = !collapsing.value
}

function toggleTableCollapse() {
  tableCollapse.value = !tableCollapse.value
}

watch([collapsing, tableCollapse], () => {
  nextTick(() => {
    renderLine()
  })
})
</script>

<template>
  <table v-if="!tableCollapse" ref="table" :class="$style.table" :style="{ top: `${tableRect.top / 2}px` }">
    <tbody>
      <template v-for="(letter, letterIndex) in internalLetterChart" :key="letter.var">
        <tr v-if="!collapsing || letter.collapsable === false">
          <td>{{ letter.var }}</td>

          <td v-if="letter.operation === 'g'">
            <div class="[transform:rotateX(180deg)] i-material-symbols:subdirectory-arrow-right" />
          </td>
          <td v-else-if="letter.operation === 'l'">
            <div class="i-material-symbols:subdirectory-arrow-right" />
          </td>
          <td v-else-if="letter.operation === 'b'">
            <div class="i-material-symbols:arrow-forward-rounded" />
          </td>
          <td v-else-if="letter.operation === 'r'">
            <div class="i-material-symbols:refresh" />
          </td>

          <td>
            <R
              :plus="letter.P[0] === 'p'"
              :minus="letter.P[0] === 'm'"
              :slash="letter.P[0] === 's'"
              :empty="letter.P[0] === 'e'"
            />
          </td>
          <td>
            <W
              :plus="letter.P[1] === 'p'"
              :minus="letter.P[1] === 'm'"
              :slash="letter.P[1] === 's'"
              :empty="letter.P[1] === 'e'"
            />
          </td>
          <td>
            <O
              :plus="letter.P[2] === 'p'"
              :minus="letter.P[2] === 'm'"
              :slash="letter.P[2] === 's'"
              :empty="letter.P[2] === 'e'"
            />
          </td>
        </tr>

        <tr v-if="showCollapseIndex === letterIndex" class="cursor-pointer" @click="toggleCollapsing">
          <td colspan="5">
            <div class="text-center">
              ...
            </div>
          </td>
        </tr>
      </template>
    </tbody>
  </table>

  <div
    ref="line"
    class="absolute scale-y-50"
    :class="[$style.line, !tableCollapse && 'border-t border-aq.fill border-dashed']"
    :style="{
      left: `${lineRect.left}px`,
      right: `${lineRect.right}px`,
    }"
  >
    <div :class="[$style.arrow, tableCollapse && $style.arrowRotate]" @click="toggleTableCollapse" />
  </div>
</template>

<style module>
.table {
  margin: 0 0 2rem 0!important;
  float: right;
  position: relative;
  z-index: 1;
}
.table td {
  padding: 0px 8px;
  text-align: center;
}
.table td:nth-child(1) {
  text-align: left;
}

.arrow {
  cursor: pointer;
  position: absolute;
  top: 0;
  left: -16px;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-left-width: 8px;
  border-right-width: 8px;
  border-top-width: 6px;
  border-bottom-width: 6px;
  border-style: solid;
  border-color: transparent;
  border-right-color: var(--aq-fill);
}

.arrowRotate {
  transform: translateY(-50%) rotateY(180deg);
}
</style>

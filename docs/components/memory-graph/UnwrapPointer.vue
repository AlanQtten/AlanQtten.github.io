<script setup lang="ts">
import { ref } from 'vue'
import type { Point2 } from './MemoryGraph.vue'

export interface Detail {
  title: string
  body: Array<{ name: string, value: Detail, point2?: Point2 }>
}

const props = defineProps<{
  detail: Detail
  resolveRef: (ref: any) => void
}>()

const pointer = ref(null)

defineExpose({
  el: pointer,
})

function wrapResolveRef(_ref: HTMLElement) {
  props.resolveRef(_ref)
}
</script>

<template>
  <div class="flex flex-col">
    <span>{{ detail.title }}</span>

    <template v-if="detail.body?.length">
      <table class="!m-0">
        <tr v-for="item in detail.body" :key="item.name" class="bg-transparent!">
          <td v-if="item.name">
            {{ item.name }}
          </td>
          <td v-if="item.point2 || item.point2 === 0" :ref="el => resolveRef(el)" :class="[$style.pointer, item.class]" />
          <!-- array value -->
          <td v-else-if="Array.isArray(item.value)" :class="$style.arrayValue">
            <span v-for="(value, j) in item.value" :key="j">{{ value }}</span>
          </td>
          <td v-else>
            <UnwrapPointer v-if="typeof item.value === 'object'" :resolve-ref="wrapResolveRef" :detail="item.value" />
            <template v-else>
              {{ item.value }}
            </template>
          </td>
        </tr>
      </table>
    </template>
  </div>
</template>

<style module>
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
</style>

<template>
<section :class="$style.section">
  <span :class="$style.title">{{ $props.title }}</span>

  <div :class="$style.stackWrapper">
    <h6>Stack</h6>

    <div v-for="scope in $props.memory" :key="scope.scopeName" :class="$style.stackScope">
      <span>{{ scope.scopeName }}</span>

      <table :class="$style.table">
        <tbody>
          <tr v-for="stack in scope.stack" :key="stack.key">
            <td>{{ stack.key }}</td>
            <td v-if="Array.isArray(stack.value)" :class="$style.stackArrayValue">
              <span v-for="(value, index) in stack.value" :key="index">{{ value }}</span>
            </td>
            <td v-else>{{ stack.value }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</section>
</template>

<script setup lang="ts">
const $props = defineProps<{
  title: string,
  memory: { scopeName: string, stack: { key: string, value: string }[] }[]
}>()
</script>

<style module>
.section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: auto;
  gap: 8px;
}

.title {
  border: 1px solid var(--vp-c-text-1);
  border-radius: 2px;
  padding: 0 8px;
}

.stackWrapper {
  padding: 8px;
  border: 1px dashed var(--vp-c-text-1);
  margin-left: 8px;
}

.stackScope {
  display: flex;
  flex-direction: column;
}

.stackArrayValue span:not(:last-child)::after {
  content: '|';
  display: inline-block;
}

.table {
  margin: 0;
  width: 100%;
  margin-bottom: 4px;
}

.table td {
  padding: 2px 8px;
  border: 1px solid var(--vp-c-text-1);
}
</style>
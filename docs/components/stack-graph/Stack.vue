<template>
<section>
  <span class="title">{{ $props.title }}</span>

  <div class="stack-wrapper">
    <h6>Stack</h6>

    <div v-for="scope in $props.memory" :key="scope.scopeName" class="stack-scope">
      <span>{{ scope.scopeName }}</span>

      <table>
        <tbody>
          <tr v-for="stack in scope.stack" :key="stack.key">
            <td>{{ stack.key }}</td>
            <td v-if="Array.isArray(stack.value)" class="stack-array-value">
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

<style scoped>
section {
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

.stack-wrapper {
  padding: 8px;
  border: 1px dashed var(--vp-c-text-1);
  margin-left: 8px;
}

.stack-scope {
  display: flex;
  flex-direction: column;
}

.stack-array-value {
  display: flex;
  gap: 1px;
}

.stack-array-value span:not(:last-child)::after {
  content: '|';
  display: inline-block;
}

table {
  margin: 0;
  width: 100%;
  margin-bottom: 4px;
}

table td {
  padding: 2px 8px;
  border: 1px solid var(--vp-c-text-1);
}
</style>
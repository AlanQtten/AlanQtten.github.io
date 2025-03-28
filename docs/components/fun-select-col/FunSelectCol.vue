<script setup lang="ts">
import { ref } from 'vue'

const dataList = ref(Array.from({ length: 10 }, (_, i) => ({ id: i, name: `name${i}`, code: `code${i}` })))
const selectedIds = ref<number[]>([])

function toggleSelectAll(e: any) {
  const selectAll = e.target.checked

  if (selectAll) {
    selectedIds.value = dataList.value.map(item => item.id)
  }
  else {
    selectedIds.value = []
  }
}

function toggleSelect(id: number) {
  if (selectedIds.value.includes(id)) {
    selectedIds.value = selectedIds.value.filter(selectedId => selectedId !== id)
  }
  else {
    selectedIds.value = [...selectedIds.value, id]
  }
}
</script>

<template>
  <table :class="$style.table">
    <thead>
      <tr>
        <th :class="$style.selectedTh">
          <input
            type="checkbox"
            :checked="selectedIds.length === dataList.length"
            :indeterminate="selectedIds.length > 0 && selectedIds.length < dataList.length"
            @change="toggleSelectAll"
          >
        </th>
        <th>id</th>
        <th>name</th>
        <th>code</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(item, index) in dataList" :key="item.id">
        <td :class="$style.selectedCol">
          <span>{{ index }}</span>
          <input
            type="checkbox"
            :checked="selectedIds.includes(item.id)"
            @change="toggleSelect(item.id)"
          >
        </td>
        <td>{{ item.id }}</td>
        <td>{{ item.name }}</td>
        <td>{{ item.code }}</td>
      </tr>
    </tbody>
  </table>
</template>

<style module>
.table:has(.selectedTh:hover) .selectedCol input {
  display: block;
}

.table:has(.selectedTh:hover) .selectedCol span {
  display: none;
}

.selectedCol input {
  display: none;
}

.selectedCol:hover span {
  display: none;
}

.selectedCol:hover input {
  display: block;
}

.selectedCol:has(input:checked) span {
  display: none;
}

.selectedCol:has(input:checked) input {
  display: block;
}
</style>

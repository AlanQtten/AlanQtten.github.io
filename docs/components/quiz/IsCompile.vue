<script setup lang="ts">
import { onMounted, ref } from 'vue'

interface Value { compiled?: boolean, compiledResult?: string }

const props = withDefaults(defineProps<{
  value: Value
  onChange: (v: Value) => void
  disabled?: boolean
}>(), {
  value: () => ({ compiled: undefined, compiledResult: undefined }),
})

const uniqueId = ref()

onMounted(() => {
  uniqueId.value = new Date().getTime()
})

function handleRadioChange(e: Event) {
  props.onChange((e.target as HTMLInputElement).value === 'true'
    ? { compiled: true, compiledResult: props.value?.compiledResult }
    : { compiled: false },
  )
}

function handleInputChange(e: Event) {
  props.onChange({ compiled: props.value?.compiled, compiledResult: (e.target as HTMLInputElement).value })
}
</script>

<template>
  <div class="my-4">
    这段程序：
    <label class="p-2 border-aq border border-solid rounded">
      <input
        type="radio"
        :name="`radio-${uniqueId}`"
        :value="true"
        :onChange="handleRadioChange"
        :checked="value?.compiled === true"
        :disabled="disabled"
      >

      <span>编译成功</span>
    </label>

    或

    <label class="p-2 border-aq border border-solid rounded">
      <input
        type="radio"
        :name="`radio-${uniqueId}`"
        :value="false"
        :onChange="handleRadioChange"
        :checked="value?.compiled === false"
        :disabled="disabled"
      >

      <span>编译失败</span>
    </label>
  </div>

  <input
    v-if="value?.compiled"
    type="text"
    :value="value?.compiledResult"
    :disabled="disabled"
    placeholder="请输入编译结果"
    class="block"
    @input="handleInputChange"
  >
</template>

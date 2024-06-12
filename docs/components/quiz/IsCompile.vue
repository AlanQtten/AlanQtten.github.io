<script setup lang="ts">
import type { Ref } from 'vue'
import { inject, onMounted, ref } from 'vue'
import { disabledSymbol, onChangeSymbol, valueSymbol } from './quiz'

interface Value { compiled?: boolean, compiledResult?: string }

defineProps<{
  name: string
}>()

type OnChange = (v: Value) => void

const defaultValue = ref<Value>(({ compiled: undefined, compiledResult: undefined }))
const injectValue = inject<Ref<Value>>(valueSymbol, defaultValue)
const onChange = inject<OnChange>(onChangeSymbol, () => {})
const disabled = inject<boolean>(disabledSymbol)

function handleRadioChange(e: Event) {
  onChange((e.target as HTMLInputElement).value === 'true'
    ? { compiled: true, compiledResult: injectValue.value?.compiledResult }
    : { compiled: false },
  )
}

function handleInputChange(e: Event) {
  onChange({ compiled: injectValue.value?.compiled, compiledResult: (e.target as HTMLInputElement).value })
}
</script>

<template>
  <div class="my-4">
    这段程序：
    <label class="p-2 border-aq border border-solid rounded">
      <input
        type="radio"
        :name="name"
        :value="true"
        :onChange="handleRadioChange"
        :checked="injectValue?.compiled === true"
        :disabled="disabled"
      >

      <span>编译成功</span>
    </label>

    或

    <label class="p-2 border-aq border border-solid rounded">
      <input
        type="radio"
        :name="name"
        :value="false"
        :onChange="handleRadioChange"
        :checked="injectValue?.compiled === false"
        :disabled="disabled"
      >

      <span>编译失败</span>
    </label>
  </div>

  <input
    v-if="injectValue?.compiled"
    type="text"
    :value="injectValue?.compiledResult"
    :disabled="disabled"
    placeholder="请输入编译结果"
    class="block"
    @input="handleInputChange"
  >
</template>

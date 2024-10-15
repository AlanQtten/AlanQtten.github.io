<script setup lang="ts">
import { calculate, preCheck } from 'simple-calculate'
import { defineModel, ref, watch } from 'vue'

const input = defineModel<string>()
const result = ref()
const replaceTextList = [
  ['x', '*'],
  ['÷', '/'],
  ['（', '('],
  ['）', ')'],
  [' ', ''],
]

watch(input, () => {
  // 替换特殊字符
  let _inputValue = input.value

  if (!_inputValue) {
    result.value = ''
    return
  }

  _inputValue = replaceTextList.reduce<string>((_str, [searchValue, replaceValue]) => {
    return _str.replaceAll(searchValue, replaceValue)
  }, _inputValue)

  if (!preCheck(_inputValue)) {
    result.value = '请勿输入特殊字符'
    return
  }

  try {
    result.value = calculate(_inputValue)
  }
  catch (error) {
    result.value = ''
    console.error(error)
  }
})
</script>

<template>
  <div class="pt-8">
    <input
      v-model="input"
      class="w-full text-3xl"
      placeholder="输入算式"
    >

    <hr>

    <span>结果: {{ result }}</span>
  </div>
</template>

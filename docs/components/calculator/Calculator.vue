<template>
<div class="pt-8">
  <input 
    class="w-full text-3xl"
    placeholder="输入算式"
    v-model="input"
  />

  <hr />

  <span>结果: {{ result }}</span>
</div> 
</template>

<script setup lang="ts">
import { defineModel, watch, ref } from 'vue'
import { calculate, preCheck } from 'simple-calculate'

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

  if(!_inputValue) {
    result.value = ''
    return
  }
  
  _inputValue = replaceTextList.reduce<string>((_str, [searchValue, replaceValue]) => {
    return _str.replaceAll(searchValue, replaceValue)
  }, _inputValue)

  if(!preCheck(_inputValue)) {
    result.value = '请勿输入特殊字符'
    return
  }

  try {
    result.value = calculate(_inputValue)
  }catch(error) {
    result.value = ''
  }
})


</script>
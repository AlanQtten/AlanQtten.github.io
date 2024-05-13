<template>
<div class="wrapper">
  <input 
    class="input"
    placeholder="输入算式"
    v-model="input"
  />

  <hr />

  <h6>结果:</h6>
  <span class="result">{{ result }}</span>
</div>
</template>

<script setup lang="ts">
import { defineModel, watch, ref } from 'vue'
import calc from './calc'

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

  if(!/^[\.()*/+\-\d]+$/.test(_inputValue)) {
    result.value = '请勿输入特殊字符'
    return
  }

  try {
    result.value = calc(_inputValue)
  }catch(error) {
    result.value = ''
  }
})


</script>

<style scoped>
  .wrapper {
    padding: 16px 0;
  }

  .input {
    width: 100%;
    font-size: 32px;
  }

  .result {
    height: 24px;
    display: flex;
    align-items: center;
  }
</style>
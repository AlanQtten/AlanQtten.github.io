<template>
  <div :class="$style.paragraph">
    这段程序：
    <label :class="$style.option">
      <input
        type="radio"
        :name="`radio-${uniqueId}`"
        :value="true"
        :onChange="handleRadioChange"
        :checked="value?.compiled === true"
        :disabled="disabled"
      />

      <span>编译成功</span>
    </label>
    
    或

    <label :class="$style.option">
      <input
        type="radio"
        :name="`radio-${uniqueId}`"
        :value="false"
        :onChange="handleRadioChange"
        :checked="value?.compiled === false"
        :disabled="disabled"
      />

      <span>编译失败</span>
    </label>
  </div>

  <input 
    type="text" 
    :value="value?.compiledResult"
    @input="handleInputChange"
    :disabled="disabled"
    placeholder="请输入编译结果"
    style="display: block;"
    v-if="value?.compiled"
  />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

type Value = { compiled: boolean, compiledResult?: string }

const props = defineProps<{
  value: Value,
  onChange: (v: Value) => void,
  disabled: boolean
}>()

const uniqueId = ref()

onMounted(() => {
  uniqueId.value = new Date().getTime()
})

const handleRadioChange = (e) => {
  props.onChange(e.target.value === 'true' 
    ? { compiled: true, compiledResult: props.value?.compiledResult } 
    : { compiled: false, }
  )
}

const handleInputChange = (e) => {
  props.onChange({ compiled: props.value?.compiled, compiledResult: e.target.value })
}
</script>

<style module>
.paragraph {
  margin: 16px 0;
}

.option {
  padding: 8px;
  border: 1px solid var(--vp-c-text-1);
  border-radius: 4px;
}
</style>
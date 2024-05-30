<script setup lang="ts">
import { computed, ref } from 'vue'
import objectEqual from '../../utils/object-equal'
import arrayEqual from '../../utils/array-equal'

const { answer } = withDefaults(defineProps<{
  questionMark: number
  question: string
  answer: string | number | object
  showingAnswer?: string
  description: string
}>(), {
  questionMark: 1,
})

const inputAnswer = ref()
const freezeAnswer = ref()
function handleAnswer() {
  if (!inputAnswer.value)
    return

  freezeAnswer.value = true
}

function onChange(v) {
  inputAnswer.value = v
}

const isCorrect = computed(() => {
  if (!freezeAnswer.value) {
    return false
  }

  if (Array.isArray(answer)) {
    return arrayEqual(inputAnswer.value, answer)
  }

  const type = typeof answer
  switch (type) {
    case 'string':
    case 'number':
      return inputAnswer.value === answer
    case 'object':
      return objectEqual(inputAnswer.value, answer)
    default:
      return false
  }
})
</script>

<template>
  <h6>问题{{ questionMark }}</h6>

  <p>{{ question }}</p>

  <slot
    name="quiz"
    :value="inputAnswer"
    :on-change="onChange"
    :disabled="freezeAnswer"
  />

  <button class="mt-2" @click="handleAnswer">
    提交
  </button>

  <fragment v-if="freezeAnswer === true">
    <div v-if="isCorrect">
      <span>回答正确</span>
    </div>

    <div v-else>
      <span>回答错误，正确答案：{{ showingAnswer ?? answer }}</span>
    </div>

    <template v-if="$slots.description">
      <slot name="description" />
    </template>

    <p v-else>
      {{ description }}
    </p>
  </fragment>
</template>

<script setup lang="ts">
import { computed, onMounted, provide, ref } from 'vue'
import arrayEqual from '../../utils/array-equal'
import objectEqual from '../../utils/object-equal'
import {
  disabledSymbol,
  nameSymbol,
  onChangeSymbol,
  updateAnswerSymbol,
  updateShowingAnswerSymbol,
  valueSymbol,
} from './quiz'
import { getQuizName } from './utils'

type Answer = string | number | object

defineProps<{
  questionMark?: number | string
}>()

const formItemName = ref('')
onMounted(() => {
  formItemName.value = getQuizName()
})
provide(nameSymbol, formItemName)

const answer = ref<any>(null)
const showingAnswer = ref('')

function internalUpdateAnswer(_answer: any) {
  answer.value = _answer
}

function internalUpdateShowingAnswer(_showingAnswer: string) {
  showingAnswer.value = _showingAnswer
}

const inputAnswer = ref<Answer>('')
const freezeAnswer = ref()
function handleAnswer() {
  if (!inputAnswer.value)
    return

  freezeAnswer.value = true
}

function onChange(v: Answer) {
  inputAnswer.value = v
}

const isCorrect = computed(() => {
  if (!freezeAnswer.value) {
    return false
  }

  if (Array.isArray(answer)) {
    return arrayEqual(inputAnswer.value, answer)
  }

  const type = typeof answer.value
  switch (type) {
    case 'string':
    case 'number':
      return inputAnswer.value === answer.value
    case 'object':
      return objectEqual(inputAnswer.value, answer.value)
    default:
      return false
  }
})

provide(valueSymbol, inputAnswer)
provide(onChangeSymbol, onChange)
provide(disabledSymbol, freezeAnswer)
provide(updateAnswerSymbol, internalUpdateAnswer)
provide(updateShowingAnswerSymbol, internalUpdateShowingAnswer)
</script>

<template>
  <h6>问题{{ questionMark }}</h6>

  <slot name="quiz" />

  <button class="mt-2" @click="handleAnswer">
    提交
  </button>

  <template v-if="freezeAnswer === true">
    <div v-if="isCorrect">
      <span>回答正确</span>
    </div>

    <div v-else>
      <span>回答错误，正确答案：{{ showingAnswer || answer }}</span>
    </div>

    <slot name="description" />
  </template>
</template>

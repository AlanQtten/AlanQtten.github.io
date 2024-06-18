const quizNamePre = 'quiz-pre-'
let quizNameId = 0
export function getQuizName() {
  return `${quizNamePre}${quizNameId++}`
}

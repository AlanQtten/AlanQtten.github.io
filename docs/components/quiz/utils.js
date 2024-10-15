"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getQuizName = getQuizName;
var quizNamePre = 'quiz-pre-';
var quizNameId = 0;
function getQuizName() {
    return "".concat(quizNamePre).concat(quizNameId++);
}

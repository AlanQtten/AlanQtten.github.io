"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lr = void 0;
var vue_1 = require("vue");
var LetterTable_vue_1 = require("../components/letter/LetterTable.vue");
function createRenderer(comp) {
    return function (props) {
        return (0, vue_1.h)(comp, props);
    };
}
exports.lr = createRenderer(LetterTable_vue_1.default);

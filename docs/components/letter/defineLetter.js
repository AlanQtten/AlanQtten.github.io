"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.W = exports.R = exports.O = exports.F = void 0;
var vue_1 = require("vue");
var Letter_vue_1 = require("./Letter.vue");
function defineLetter(letter, themeColor) {
    return (0, vue_1.defineComponent)({
        render: function () {
            return (0, vue_1.h)(Letter_vue_1.default, { themeColor: themeColor }, {
                default: function () { return letter; },
            });
        },
    });
}
var R = defineLetter('R', '#ff9500');
exports.R = R;
var W = defineLetter('W', '#399cf2');
exports.W = W;
var O = defineLetter('O', 'var(--aq-error)');
exports.O = O;
var F = defineLetter('F', '#5ed100');
exports.F = F;

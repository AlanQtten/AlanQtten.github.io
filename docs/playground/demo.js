"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vue_1 = require("vue");
exports.default = (0, vue_1.defineComponent)({
    setup: function () {
        return function () {
            return (0, vue_1.h)('span', {}, 'Hello World!');
        };
    },
});

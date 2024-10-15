"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vue_1 = require("vue");
var quiz_1 = require("./quiz");
exports.default = (0, vue_1.defineComponent)({
    setup: function (props, _a) {
        var slots = _a.slots;
        var updateAnswer = (0, vue_1.inject)(quiz_1.updateAnswerSymbol, function () { });
        function internalUpdateAnswer(payload) {
            updateAnswer(payload);
        }
        (0, vue_1.provide)('updateAnswer', internalUpdateAnswer);
        return function () {
            var _a;
            var nodes = (_a = slots.default) === null || _a === void 0 ? void 0 : _a.call(slots);
            return nodes === null || nodes === void 0 ? void 0 : nodes.map(function (node, i) {
                return (0, vue_1.cloneVNode)(node, { value: String.fromCharCode(65 + i) });
            });
        };
    },
});

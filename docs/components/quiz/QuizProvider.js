"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vue_1 = require("vue");
exports.default = (0, vue_1.defineComponent)({
    setup: function (props, _a) {
        var slots = _a.slots;
        return function () {
            var _a;
            // eslint-disable-next-line ts/no-non-null-asserted-optional-chain
            var nodes = (_a = slots.default) === null || _a === void 0 ? void 0 : _a.call(slots);
            var _nodes = [];
            var l = nodes.length;
            for (var i = 0; i < l; i++) {
                _nodes.push((0, vue_1.cloneVNode)(nodes[i], { questionMark: i + 1 }));
                if (i < l - 1) {
                    _nodes.push((0, vue_1.h)('hr', {
                        class: '!border-t !border-aq',
                    }));
                }
            }
            return _nodes;
        };
    },
});

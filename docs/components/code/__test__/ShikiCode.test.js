"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var ShikiCode_vue_1 = require("../ShikiCode.vue");
(0, vitest_1.describe)('shikiCode tool', function () {
    (0, vitest_1.it)('should work', function () {
        (0, vitest_1.expect)((0, ShikiCode_vue_1.pushInMiddle)([1, 2, 3], function () { return false; }))
            .toStrictEqual([1, 2, 3]);
        // push to start
        (0, vitest_1.expect)((0, ShikiCode_vue_1.pushInMiddle)([1, 2, 3], function (_a) {
            var before = _a.before;
            return !before && 5;
        }))
            .toStrictEqual([5, 1, 2, 3]);
        // push to end
        (0, vitest_1.expect)((0, ShikiCode_vue_1.pushInMiddle)([1, 2, 3], function (_a) {
            var after = _a.after;
            return !after && 5;
        }))
            .toStrictEqual([1, 2, 3, 5]);
        // push to middle
        (0, vitest_1.expect)((0, ShikiCode_vue_1.pushInMiddle)([1, 2, 3], function (_a) {
            var before = _a.before;
            return before === 2 && 5;
        }))
            .toStrictEqual([1, 2, 5, 3]);
        // push multiple times
        (0, vitest_1.expect)((0, ShikiCode_vue_1.pushInMiddle)([1, 2, 3], function (_a) {
            var before = _a.before, after = _a.after;
            return before && after && 5;
        }))
            .toStrictEqual([1, 5, 2, 5, 3]);
    });
    (0, vitest_1.it)('should work with multiple insert', function () {
        var f = vitest_1.vi.fn();
        (0, ShikiCode_vue_1.pushInMiddle)([1, 2, 3], f);
        (0, vitest_1.expect)(f).toBeCalledTimes(4);
    });
});

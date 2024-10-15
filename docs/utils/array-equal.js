"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function arrayEqual(a, b) {
    if (a === b)
        return true;
    if (a == null || b == null)
        return true;
    if (a.length !== b.length)
        return false;
    var l = a.length;
    for (var i = 0; i < l; i++) {
        if (!b.includes(a[i]))
            return false;
    }
    return true;
}
exports.default = arrayEqual;

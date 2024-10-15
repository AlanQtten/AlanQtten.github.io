"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var sorter = function (a, b) { return a - b; };
function objectEqual(a, b) {
    if (a === b)
        return true;
    if (a == null || b == null)
        return true;
    if (typeof a !== 'object' || typeof b !== 'object')
        return false;
    var keysA = Object.keys(a).sort(sorter);
    var keysB = Object.keys(b).sort(sorter);
    if (keysA.length !== keysB.length)
        return false;
    var l = keysA.length;
    for (var i = 0; i < l; i++) {
        var key = keysA[i];
        if (typeof a[key] === 'object') {
            if (!objectEqual(a[key], b[key]))
                return false;
        }
        else if (a[key] !== b[key]) {
            return false;
        }
    }
    return true;
}
exports.default = objectEqual;

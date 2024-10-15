"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function findElementAndIndex(arr, callback) {
    for (var i = 0; i < arr.length; i++) {
        if (callback(arr[i], i, arr)) {
            return [arr[i], i];
        }
    }
    return undefined;
}
exports.default = findElementAndIndex;

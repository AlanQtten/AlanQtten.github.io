"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.countOfIsland = countOfIsland;
function countOfIsland(map, x, y) {
    var grid = Array.from({ length: y }, function (zero, index) {
        return map.slice(index * x, index * x + x);
    });
    var spread = function (_x, _y) {
        if (_x < 0
            || _y < 0
            || _x > x - 1
            || _y > y - 1
            || grid[_y][_x] === 0) {
            return;
        }
        grid[_y][_x] = 0;
        spread(_x - 1, _y);
        spread(_x + 1, _y);
        spread(_x, _y + 1);
        spread(_x, _y - 1);
    };
    var count = 0;
    for (var i = 0; i < y; i++) {
        for (var j = 0; j < x; j++) {
            if (grid[i][j] === 1) {
                count++;
                spread(j, i);
            }
        }
    }
    return count;
}

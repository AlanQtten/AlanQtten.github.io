export function countOfIsland(map: number[], x: number, y: number) {
  const grid = Array.from({ length: y }, (zero, index) => {
    return map.slice(index * x, index * x + x)
  })

  const spread = (_x: number, _y: number) => {
    if (
      _x < 0
      || _y < 0
      || _x > x - 1
      || _y > y - 1
      || grid[_y][_x] === 0
    ) {
      return
    }
    grid[_y][_x] = 0

    spread(_x - 1, _y)
    spread(_x + 1, _y)
    spread(_x, _y + 1)
    spread(_x, _y - 1)
  }

  let count = 0
  for (let i = 0; i < y; i++) {
    for (let j = 0; j < x; j++) {
      if (grid[i][j] === 1) {
        count++
        spread(j, i)
      }
    }
  }

  return count
}

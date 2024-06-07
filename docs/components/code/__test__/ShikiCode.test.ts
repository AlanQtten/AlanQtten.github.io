import { describe, expect, it, vi } from 'vitest'
import { pushInMiddle } from '../ShikiCode.vue'

describe('shikiCode tool', () => {
  it('should work', () => {
    expect(pushInMiddle([1, 2, 3], () => false))
      .toStrictEqual([1, 2, 3])
    // push to start
    expect(pushInMiddle([1, 2, 3], ({ before }) => !before && 5))
      .toStrictEqual([5, 1, 2, 3])
    // push to end
    expect(pushInMiddle([1, 2, 3], ({ after }) => !after && 5))
      .toStrictEqual([1, 2, 3, 5])
    // push to middle
    expect(pushInMiddle([1, 2, 3], ({ before }) => before === 2 && 5))
      .toStrictEqual([1, 2, 5, 3])
    // push multiple times
    expect(pushInMiddle([1, 2, 3], ({ before, after }) => before && after && 5))
      .toStrictEqual([1, 5, 2, 5, 3])
  })

  it('should work with multiple insert', () => {
    const f = vi.fn()
    pushInMiddle([1, 2, 3], f)
    expect(f).toBeCalledTimes(4)
  })
})

import { describe, expect, it } from 'vitest'
import { getHorizontalSwipe } from './swipe'

describe('getHorizontalSwipe', () => {
  it('maps left and right gestures to calendar navigation', () => {
    expect(getHorizontalSwipe({ x: 260, y: 100 }, { x: 150, y: 108 })).toBe('next')
    expect(getHorizontalSwipe({ x: 120, y: 100 }, { x: 220, y: 95 })).toBe('previous')
  })

  it('ignores short and primarily vertical gestures', () => {
    expect(getHorizontalSwipe({ x: 100, y: 100 }, { x: 130, y: 104 })).toBeNull()
    expect(getHorizontalSwipe({ x: 100, y: 100 }, { x: 170, y: 220 })).toBeNull()
  })
})

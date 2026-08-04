export type SwipeDirection = 'previous' | 'next' | null

export function getHorizontalSwipe(
  start: { x: number; y: number },
  end: { x: number; y: number },
  threshold = 56,
): SwipeDirection {
  const deltaX = end.x - start.x
  const deltaY = end.y - start.y
  if (Math.abs(deltaX) < threshold || Math.abs(deltaX) < Math.abs(deltaY) * 1.25) return null
  return deltaX > 0 ? 'previous' : 'next'
}

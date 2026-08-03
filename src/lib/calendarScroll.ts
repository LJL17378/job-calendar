export function getCalendarScrollMinutes(
  rangeStart: Date,
  rangeEnd: Date,
  viewType: string,
  now = new Date(),
) {
  if (!viewType.startsWith('timeGrid')) return null
  const showsToday = now >= rangeStart && now < rangeEnd
  if (!showsToday) return 8 * 60
  return Math.max(0, now.getHours() * 60 + now.getMinutes() - 60)
}

import { describe, expect, it } from 'vitest'
import { getCalendarScrollMinutes } from './calendarScroll'

describe('getCalendarScrollMinutes', () => {
  it('positions a time-grid containing today one hour before the current time', () => {
    const now = new Date('2026-08-04T15:42:00+08:00')
    expect(getCalendarScrollMinutes(new Date('2026-08-04T00:00:00+08:00'), new Date('2026-08-05T00:00:00+08:00'), 'timeGridDay', now)).toBe(14 * 60 + 42)
  })

  it('uses the morning default outside today and ignores non-time-grid views', () => {
    const now = new Date('2026-08-04T15:42:00+08:00')
    expect(getCalendarScrollMinutes(new Date('2026-08-05T00:00:00+08:00'), new Date('2026-08-06T00:00:00+08:00'), 'timeGridDay', now)).toBe(8 * 60)
    expect(getCalendarScrollMinutes(new Date('2026-08-01'), new Date('2026-09-01'), 'dayGridMonth', now)).toBeNull()
  })
})

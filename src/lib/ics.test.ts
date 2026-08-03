import { describe, expect, it } from 'vitest'
import { parseIcs } from './ics'

describe('parseIcs', () => {
  it('parses timed, all-day, and recurring events', () => {
    const source = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nUID:interview-1\r\nDTSTART:20260803T013000Z\r\nDTEND:20260803T030000Z\r\nSUMMARY:Interview\r\nRRULE:FREQ=WEEKLY\r\nEND:VEVENT\r\nBEGIN:VEVENT\r\nUID:deadline-1\r\nDTSTART;VALUE=DATE:20260810\r\nDTEND;VALUE=DATE:20260811\r\nSUMMARY:Deadline\r\nEND:VEVENT\r\nEND:VCALENDAR`
    const result = parseIcs(source, 'calendar-1')
    expect(result.errors).toEqual([])
    expect(result.events).toHaveLength(2)
    expect(result.events[0]).toMatchObject({ title: 'Interview', allDay: false, recurrenceRule: 'FREQ=WEEKLY' })
    expect(result.events[0].start).toBe('2026-08-03T01:30:00.000Z')
    expect(result.events[1]).toMatchObject({ title: 'Deadline', allDay: true, importedUid: 'deadline-1' })
  })

  it('returns a useful error for invalid calendar data', () => {
    expect(parseIcs('not an ics file', 'calendar-1').errors.length).toBeGreaterThan(0)
  })
})

import { describe, expect, it } from 'vitest'
import { mergeImportedEvents } from './importMerge'
import type { CalendarEvent } from '../types/domain'

const event = (id: string, title: string): CalendarEvent => ({ id, calendarId: 'calendar', title, description: '', location: '', start: '2026-08-03T09:00:00.000Z', end: '2026-08-03T10:00:00.000Z', allDay: false, timeZone: 'Asia/Shanghai', recurrenceRule: null, applicationId: null, stageId: null, importedUid: 'same-uid', recurrenceId: null })

describe('mergeImportedEvents', () => {
  it('updates matching UID and recurrence id without creating duplicates', () => {
    const merged = mergeImportedEvents([event('original-id', 'Old title')], [event('new-id', 'New title')])
    expect(merged.events).toHaveLength(1)
    expect(merged.events[0]).toMatchObject({ id: 'original-id', title: 'New title' })
    expect(merged.result).toMatchObject({ created: 0, updated: 1 })
  })
})

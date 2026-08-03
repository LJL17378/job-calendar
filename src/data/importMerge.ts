import type { CalendarEvent, CalendarImportResult } from '../types/domain'

export function mergeImportedEvents(existing: CalendarEvent[], incoming: CalendarEvent[]): { events: CalendarEvent[]; result: CalendarImportResult } {
  const events = [...existing]
  const result: CalendarImportResult = { total: incoming.length, created: 0, updated: 0, skipped: 0, errors: [] }
  incoming.forEach((event) => {
    const index = events.findIndex((item) => item.importedUid === event.importedUid && item.recurrenceId === event.recurrenceId)
    if (index >= 0) { events[index] = { ...event, id: events[index].id }; result.updated += 1 }
    else { events.push(event); result.created += 1 }
  })
  return { events, result }
}

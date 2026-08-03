import ICAL from 'ical.js'
import { DEFAULT_TIME_ZONE } from './date'
import { createId } from './id'
import type { CalendarEvent } from '../types/domain'

export interface IcsPreview {
  events: CalendarEvent[]
  errors: string[]
}

export function parseIcs(content: string, calendarId: string): IcsPreview {
  const events: CalendarEvent[] = []
  const errors: string[] = []
  try {
    const root = new ICAL.Component(ICAL.parse(content))
    root.getAllSubcomponents('vevent').forEach((component, index) => {
      try {
        const source = new ICAL.Event(component)
        if (!source.uid || !source.startDate) throw new Error('缺少 UID 或 DTSTART')
        const recurrence = component.getFirstPropertyValue('rrule')
        const recurrenceId = component.getFirstPropertyValue('recurrence-id')
        events.push({
          id: createId('event'), calendarId, title: source.summary || '未命名日程', description: source.description || '', location: source.location || '',
          start: source.startDate.toJSDate().toISOString(), end: (source.endDate ?? source.startDate).toJSDate().toISOString(), allDay: source.startDate.isDate,
          timeZone: source.startDate.zone?.tzid || DEFAULT_TIME_ZONE, recurrenceRule: recurrence ? recurrence.toString() : null,
          applicationId: null, stageId: null, importedUid: source.uid, recurrenceId: recurrenceId ? String(recurrenceId) : null,
        })
      } catch (error) { errors.push(`第 ${index + 1} 条日程：${error instanceof Error ? error.message : '解析失败'}`) }
    })
  } catch (error) { errors.push(error instanceof Error ? error.message : '无法解析该 ICS 文件') }
  return { events, errors }
}

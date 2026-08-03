import type { EventInput } from '@fullcalendar/core'
import chineseDays from 'chinese-days'

export function holidayInputs(year: number): EventInput[] {
  const start = new Date(year, 0, 1)
  const result: EventInput[] = []
  for (let index = 0; index < 366 && start.getFullYear() === year; index += 1) {
    const date = new Date(year, 0, 1 + index)
    const key = `${year}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    const detail = chineseDays.getDayDetail(key)
    if (!detail.name.includes(',')) continue
    const [, chineseName] = detail.name.split(',')
    result.push({
      id: `holiday-${key}`,
      title: detail.work ? `补班 · ${chineseName}` : chineseName,
      start: key,
      allDay: true,
      display: 'block',
      backgroundColor: detail.work ? '#f5c76a' : '#2a9d8f',
      textColor: detail.work ? '#765000' : '#12665e',
      className: detail.work ? 'holiday-workday' : 'holiday-day',
    })
  }
  return result
}

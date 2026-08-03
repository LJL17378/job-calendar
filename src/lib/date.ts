export const DEFAULT_TIME_ZONE = 'Asia/Shanghai'

export function toLocalInputValue(iso: string): string {
  const date = new Date(iso)
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

export function fromLocalInputValue(value: string): string {
  return new Date(value).toISOString()
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return '尚未安排'
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'short', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(iso))
}

export function isoAtDayOffset(dayOffset: number, hour: number, minute = 0): string {
  const date = new Date()
  date.setHours(hour, minute, 0, 0)
  date.setDate(date.getDate() + dayOffset)
  return date.toISOString()
}

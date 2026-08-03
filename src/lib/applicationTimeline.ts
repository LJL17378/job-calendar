import type { Application, CalendarEvent } from '../types/domain'

const day = 86_400_000

export interface ApplicationSpan {
  start: string
  end: string
  durationDays: number
}

export function getApplicationSpan(application: Application, events: CalendarEvent[], now = new Date()): ApplicationSpan {
  const linked = events.filter((event) => event.applicationId === application.id)
  const initial = new Date(application.appliedAt ?? application.createdAt).getTime()
  const earliestEvent = linked.length ? Math.min(...linked.map((event) => new Date(event.start).getTime())) : initial
  const latestEvent = linked.length ? Math.max(...linked.map((event) => new Date(event.end).getTime())) : initial
  const start = Math.min(initial, earliestEvent)
  const end = application.status === 'active'
    ? Math.max(now.getTime(), latestEvent, start + day)
    : Math.max(latestEvent, start + day)

  return {
    start: new Date(start).toISOString(),
    end: new Date(end).toISOString(),
    durationDays: Math.max(1, Math.ceil((end - start) / day)),
  }
}

export const applicationStatusLabels: Record<Application['status'], string> = {
  active: '进行中',
  offer: 'Offer',
  rejected: '已拒绝',
  withdrawn: '已撤回',
  archived: '已归档',
}

export function safeTimelineColor(color: string | undefined): string {
  return color && /^#[0-9a-f]{6}$/i.test(color) ? color : '#5b6ee1'
}

const companyPalette = ['#5b6ee1', '#d86f45', '#248d7e', '#8b5cf6', '#c24f72', '#3979a8']

export function getCompanyTimelineColor(name: string, storedColor?: string): string {
  const safeStored = safeTimelineColor(storedColor)
  if (safeStored.toLowerCase() !== '#5b6ee1') return safeStored
  const hash = [...name].reduce((total, character) => ((total * 31) + character.charCodeAt(0)) >>> 0, 0)
  return companyPalette[hash % companyPalette.length]
}

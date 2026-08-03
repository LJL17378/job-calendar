import { describe, expect, it } from 'vitest'
import type { Application, CalendarEvent } from '../types/domain'
import { getApplicationSpan, getCompanyTimelineColor, safeTimelineColor } from './applicationTimeline'

const application: Application = {
  id: 'application', companyId: 'company', role: 'Engineer', jobUrl: '', location: '', workMode: 'hybrid', salary: '', source: '', appliedAt: '2026-08-01T00:00:00.000Z', contact: '', tags: [], notes: '', status: 'active', currentStageId: null, createdAt: '2026-07-31T00:00:00.000Z',
}
const event: CalendarEvent = {
  id: 'event', calendarId: 'calendar', title: 'Interview', description: '', location: '', start: '2026-08-08T09:00:00.000Z', end: '2026-08-08T10:00:00.000Z', allDay: false, timeZone: 'Asia/Shanghai', recurrenceRule: null, applicationId: application.id, stageId: null, importedUid: null, recurrenceId: null,
}

describe('getApplicationSpan', () => {
  it('extends an active application from application time through future nodes', () => {
    expect(getApplicationSpan(application, [event], new Date('2026-08-04T00:00:00.000Z'))).toMatchObject({
      start: '2026-08-01T00:00:00.000Z',
      end: '2026-08-08T10:00:00.000Z',
      durationDays: 8,
    })
  })

  it('accepts only safe hex colors for inline timeline variables', () => {
    expect(safeTimelineColor('#4f6bed')).toBe('#4f6bed')
    expect(safeTimelineColor('red; display:none')).toBe('#5b6ee1')
    expect(getCompanyTimelineColor('Apple', '#5b6ee1')).toMatch(/^#[0-9a-f]{6}$/i)
  })
})

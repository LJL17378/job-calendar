import { supabase } from '../lib/supabase'
import type { AppData, Application, CalendarEvent, Company, PipelineStage, StageTransition } from '../types/domain'

function report(error: unknown) { if (error) console.error('[Job Calendar / Supabase]', error) }

export async function loadCloudData(): Promise<AppData> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error: workspaceError } = await supabase.rpc('ensure_user_workspace')
  if (workspaceError) throw workspaceError
  const [calendars, events, exceptions, companies, applications, stages, transitions, subscriptions] = await Promise.all([
    supabase.from('calendars').select('*').order('created_at'),
    supabase.from('calendar_events').select('*').order('starts_at'),
    supabase.from('calendar_event_exceptions').select('*').order('occurrence_start'),
    supabase.from('companies').select('*').order('name'),
    supabase.from('applications').select('*').order('created_at', { ascending: false }),
    supabase.from('application_stages').select('*').order('position'),
    supabase.from('stage_transitions').select('*').order('occurred_at', { ascending: false }),
    supabase.from('calendar_subscriptions').select('*').eq('provider', 'china-holidays').maybeSingle(),
  ])
  ;[calendars, events, exceptions, companies, applications, stages, transitions, subscriptions].forEach(({ error }) => report(error))
  return {
    calendars: (calendars.data ?? []).map((row) => ({ id: row.id, name: row.name, color: row.color, kind: row.kind, readOnly: row.read_only, visible: row.visible })),
    events: (events.data ?? []).map((row) => ({ id: row.id, calendarId: row.calendar_id, title: row.title, description: row.description, location: row.location, start: row.starts_at, end: row.ends_at, allDay: row.all_day, timeZone: row.time_zone, recurrenceRule: row.recurrence_rule, applicationId: row.application_id, stageId: row.stage_id, importedUid: row.imported_uid, recurrenceId: row.recurrence_id, color: row.color })),
    exceptions: (exceptions.data ?? []).map((row) => ({ id: row.id, eventId: row.event_id, occurrenceStart: row.occurrence_start, cancelled: row.cancelled, override: row.override })),
    companies: (companies.data ?? []).map((row) => ({ id: row.id, name: row.name, website: row.website, color: row.color })),
    applications: (applications.data ?? []).map((row) => ({ id: row.id, companyId: row.company_id, role: row.role, jobUrl: row.job_url, location: row.location, workMode: row.work_mode, salary: row.salary, source: row.source, appliedAt: row.applied_at, contact: row.contact, tags: row.tags, notes: row.notes, status: row.status, currentStageId: row.current_stage_id, createdAt: row.created_at })),
    stages: (stages.data ?? []).map((row) => ({ id: row.id, applicationId: row.application_id, name: row.name, position: row.position, status: row.status, plannedAt: row.planned_at, completedAt: row.completed_at, color: row.color })),
    transitions: (transitions.data ?? []).map((row) => ({ id: row.id, applicationId: row.application_id, fromStageId: row.from_stage_id, toStageId: row.to_stage_id, action: row.action, occurredAt: row.occurred_at, note: row.note })),
    holidayEnabled: subscriptions.data?.enabled ?? true,
  }
}

const nullableUuid = (value: string | null | undefined) => value || null
const eventRow = (userId: string, event: CalendarEvent) => ({ id: event.id, user_id: userId, calendar_id: event.calendarId, title: event.title, description: event.description, location: event.location, starts_at: event.start, ends_at: event.end, all_day: event.allDay, time_zone: event.timeZone, recurrence_rule: event.recurrenceRule, application_id: nullableUuid(event.applicationId), stage_id: nullableUuid(event.stageId), imported_uid: event.importedUid, recurrence_id: event.recurrenceId, color: event.color ?? null })
const applicationRow = (userId: string, item: Application, includeStage = true) => ({ id: item.id, user_id: userId, company_id: item.companyId, role: item.role, job_url: item.jobUrl, location: item.location, work_mode: item.workMode, salary: item.salary, source: item.source, applied_at: item.appliedAt, contact: item.contact, tags: item.tags, notes: item.notes, status: item.status, ...(includeStage ? { current_stage_id: nullableUuid(item.currentStageId) } : {}) })
const stageRow = (userId: string, stage: PipelineStage) => ({ id: stage.id, user_id: userId, application_id: stage.applicationId, name: stage.name, position: stage.position, status: stage.status, planned_at: stage.plannedAt, completed_at: stage.completedAt, color: stage.color })

export async function cloudSaveEvent(userId: string, event: CalendarEvent) { if (supabase) report((await supabase.from('calendar_events').upsert(eventRow(userId, event))).error) }
export async function cloudDeleteEvent(id: string) { if (supabase) report((await supabase.from('calendar_events').delete().eq('id', id)).error) }
export async function cloudSaveException(userId: string, exception: import('../types/domain').CalendarEventException) { if (supabase) report((await supabase.from('calendar_event_exceptions').upsert({ id: exception.id, user_id: userId, event_id: exception.eventId, occurrence_start: exception.occurrenceStart, cancelled: exception.cancelled, override: exception.override })).error) }
export async function cloudAddApplication(userId: string, company: Company, application: Application, stages: PipelineStage[]) {
  if (!supabase) return
  report((await supabase.from('companies').upsert({ id: company.id, user_id: userId, name: company.name, website: company.website, color: company.color })).error)
  report((await supabase.from('applications').upsert(applicationRow(userId, application, false))).error)
  if (stages.length) report((await supabase.from('application_stages').upsert(stages.map((stage) => stageRow(userId, stage)))).error)
  report((await supabase.from('applications').update({ current_stage_id: application.currentStageId }).eq('id', application.id)).error)
}
export async function cloudUpdateApplication(userId: string, application: Application) { if (supabase) report((await supabase.from('applications').upsert(applicationRow(userId, application))).error) }
export async function cloudSaveStage(userId: string, stage: PipelineStage) { if (supabase) report((await supabase.from('application_stages').upsert(stageRow(userId, stage))).error) }
export async function cloudMoveStage(userId: string, application: Application, stages: PipelineStage[], transition: StageTransition) {
  if (!supabase) return
  await Promise.all([cloudUpdateApplication(userId, application), supabase.from('application_stages').upsert(stages.map((stage) => stageRow(userId, stage))), supabase.from('stage_transitions').insert({ id: transition.id, user_id: userId, application_id: transition.applicationId, from_stage_id: transition.fromStageId, to_stage_id: transition.toStageId, action: transition.action, occurred_at: transition.occurredAt, note: transition.note })]).then((results) => results.forEach((result) => { if (result && 'error' in result) report(result.error) }))
}
export async function cloudImportEvents(userId: string, events: CalendarEvent[]) { if (supabase) report((await supabase.from('calendar_events').upsert(events.map((event) => eventRow(userId, event)))).error) }
export async function cloudToggleCalendar(id: string, visible: boolean) { if (supabase) report((await supabase.from('calendars').update({ visible }).eq('id', id)).error) }
export async function cloudToggleHoliday(userId: string, enabled: boolean) { if (supabase) report((await supabase.from('calendar_subscriptions').upsert({ user_id: userId, provider: 'china-holidays', name: '中国节假日', enabled, config: { region: 'CN' } }, { onConflict: 'user_id,provider' })).error) }

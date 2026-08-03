export type CalendarKind = 'personal' | 'job' | 'holiday' | 'imported'
export type ApplicationStatus = 'active' | 'offer' | 'rejected' | 'withdrawn' | 'archived'
export type StageStatus = 'pending' | 'active' | 'completed' | 'skipped'
export type TransitionAction = 'advance' | 'jump' | 'back' | 'skip' | 'edit'

export interface CalendarSource {
  id: string
  name: string
  color: string
  kind: CalendarKind
  readOnly: boolean
  visible: boolean
}

export interface CalendarEvent {
  id: string
  calendarId: string
  title: string
  description: string
  location: string
  start: string
  end: string
  allDay: boolean
  timeZone: string
  recurrenceRule: string | null
  applicationId: string | null
  stageId: string | null
  importedUid: string | null
  recurrenceId: string | null
  color?: string | null
}

export interface CalendarEventException {
  id: string
  eventId: string
  occurrenceStart: string
  cancelled: boolean
  override: Partial<Pick<CalendarEvent, 'title' | 'description' | 'location' | 'start' | 'end' | 'allDay' | 'color'>>
}

export interface Company {
  id: string
  name: string
  website: string
  color: string
}

export interface Application {
  id: string
  companyId: string
  role: string
  jobUrl: string
  location: string
  workMode: 'onsite' | 'hybrid' | 'remote'
  salary: string
  source: string
  appliedAt: string | null
  contact: string
  tags: string[]
  notes: string
  status: ApplicationStatus
  currentStageId: string | null
  createdAt: string
}

export interface PipelineStage {
  id: string
  applicationId: string
  name: string
  position: number
  status: StageStatus
  plannedAt: string | null
  completedAt: string | null
  color: string
}

export interface StageTransition {
  id: string
  applicationId: string
  fromStageId: string | null
  toStageId: string | null
  action: TransitionAction
  occurredAt: string
  note: string
}

export interface CalendarImportResult {
  total: number
  created: number
  updated: number
  skipped: number
  errors: string[]
}

export interface AppData {
  calendars: CalendarSource[]
  events: CalendarEvent[]
  exceptions: CalendarEventException[]
  companies: Company[]
  applications: Application[]
  stages: PipelineStage[]
  transitions: StageTransition[]
  holidayEnabled: boolean
}

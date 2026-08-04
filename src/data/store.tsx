import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { createId } from '../lib/id'
import type { AppData, Application, CalendarEvent, CalendarEventException, CalendarImportResult, Company, PipelineStage, StageTransition } from '../types/domain'
import { createSeedData } from './seed'
import { mergeImportedEvents } from './importMerge'
import { cloudAddApplication, cloudDeleteEvent, cloudImportEvents, cloudMoveStage, cloudSaveEvent, cloudSaveException, cloudSaveStage, cloudToggleCalendar, cloudToggleHoliday, cloudUpdateApplication, cloudUpdateCompany, loadCloudData } from './supabaseRepository'

const STORAGE_KEY = 'job-calendar:data:v1'

interface StoreApi extends AppData {
  cloudLoading: boolean
  saveEvent: (event: CalendarEvent) => void
  deleteEvent: (id: string) => void
  saveException: (exception: CalendarEventException) => void
  addApplication: (company: Company, application: Application, stages: PipelineStage[]) => void
  updateApplication: (application: Application, company?: Company) => void
  moveStage: (applicationId: string, targetStageId: string) => void
  saveStage: (stage: PipelineStage) => void
  importEvents: (events: CalendarEvent[]) => CalendarImportResult
  toggleCalendar: (id: string) => void
  toggleHoliday: () => void
  resetDemo: () => void
}

const StoreContext = createContext<StoreApi | null>(null)

function loadData(): AppData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return createSeedData()
    const parsed = JSON.parse(stored) as Partial<AppData>
    return { ...createSeedData(), ...parsed, exceptions: parsed.exceptions ?? [] }
  } catch {
    return createSeedData()
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const { session, demoMode } = useAuth()
  const [data, setData] = useState<AppData>(() => demoMode ? loadData() : {
    calendars: [], events: [], exceptions: [], companies: [], applications: [], stages: [], transitions: [], holidayEnabled: true,
  })
  const [cloudLoading, setCloudLoading] = useState(!demoMode)
  const commit = useCallback((updater: (current: AppData) => AppData) => {
    setData((current) => {
      const next = updater(current)
      if (demoMode) localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [demoMode])

  useEffect(() => {
    if (demoMode) { setCloudLoading(false); return }
    if (!session?.user.id) return
    setCloudLoading(true)
    void loadCloudData()
      .then(setData)
      .catch((error: unknown) => console.error('[Job Calendar / load]', error))
      .finally(() => setCloudLoading(false))
  }, [demoMode, session?.user.id])

  const api = useMemo<StoreApi>(() => ({
    ...data,
    cloudLoading,
    saveEvent: (event) => { commit((current) => ({ ...current, events: current.events.some((item) => item.id === event.id) ? current.events.map((item) => item.id === event.id ? event : item) : [...current.events, event] })); if (session) void cloudSaveEvent(session.user.id, event) },
    deleteEvent: (id) => { commit((current) => ({ ...current, events: current.events.filter((event) => event.id !== id), exceptions: current.exceptions.filter((exception) => exception.eventId !== id) })); if (session) void cloudDeleteEvent(id) },
    saveException: (exception) => {
      const existing = data.exceptions.find((item) => item.id === exception.id || (item.eventId === exception.eventId && item.occurrenceStart === exception.occurrenceStart))
      const normalized = { ...exception, id: existing?.id ?? exception.id }
      commit((current) => ({
        ...current,
        exceptions: current.exceptions.some((item) => item.id === normalized.id)
          ? current.exceptions.map((item) => item.id === normalized.id ? normalized : item)
          : [...current.exceptions, normalized],
      }))
      if (session) void cloudSaveException(session.user.id, normalized)
    },
    addApplication: (company, application, stages) => { commit((current) => ({ ...current, companies: current.companies.some((item) => item.id === company.id) ? current.companies : [...current.companies, company], applications: [...current.applications, application], stages: [...current.stages, ...stages] })); if (session) void cloudAddApplication(session.user.id, company, application, stages) },
    updateApplication: (application, company) => {
      commit((current) => ({
        ...current,
        applications: current.applications.map((item) => item.id === application.id ? application : item),
        companies: company ? current.companies.map((item) => item.id === company.id ? company : item) : current.companies,
      }))
      if (session) {
        void cloudUpdateApplication(session.user.id, application)
        if (company) void cloudUpdateCompany(session.user.id, company)
      }
    },
    moveStage: (applicationId, targetStageId) => commit((current) => {
      const application = current.applications.find((item) => item.id === applicationId)
      const target = current.stages.find((stage) => stage.id === targetStageId)
      if (!application || !target) return current
      const previous = application.currentStageId
      const action: StageTransition['action'] = !previous ? 'jump' : target.position > (current.stages.find((stage) => stage.id === previous)?.position ?? -1) ? 'advance' : 'back'
      const occurredAt = new Date().toISOString()
      const nextApplication = { ...application, currentStageId: targetStageId }
      const nextStages = current.stages.map((stage) => stage.applicationId !== applicationId ? stage : {
        ...stage,
        status: stage.position < target.position ? 'completed' as const : stage.id === targetStageId ? 'active' as const : 'pending' as const,
        completedAt: stage.position < target.position ? stage.completedAt ?? occurredAt : null,
      })
      const transition: StageTransition = { id: createId('transition'), applicationId, fromStageId: previous, toStageId: targetStageId, action, occurredAt, note: '' }
      if (session) void cloudMoveStage(session.user.id, nextApplication, nextStages.filter((stage) => stage.applicationId === applicationId), transition)
      return {
        ...current,
        applications: current.applications.map((item) => item.id === applicationId ? nextApplication : item),
        stages: nextStages,
        transitions: [...current.transitions, transition],
      }
    }),
    saveStage: (stage) => { commit((current) => ({ ...current, stages: current.stages.map((item) => item.id === stage.id ? stage : item) })); if (session) void cloudSaveStage(session.user.id, stage) },
    importEvents: (incoming) => {
      const merged = mergeImportedEvents(data.events, incoming)
      commit((current) => ({ ...current, events: mergeImportedEvents(current.events, incoming).events }))
      if (session) {
        const importKeys = new Set(incoming.map((event) => `${event.importedUid ?? ''}\u0000${event.recurrenceId ?? ''}`))
        const normalized = merged.events.filter((event) => importKeys.has(`${event.importedUid ?? ''}\u0000${event.recurrenceId ?? ''}`))
        void cloudImportEvents(session.user.id, normalized)
      }
      return merged.result
    },
    toggleCalendar: (id) => commit((current) => { const next = current.calendars.map((calendar) => calendar.id === id ? { ...calendar, visible: !calendar.visible } : calendar); const changed = next.find((calendar) => calendar.id === id); if (changed && session) void cloudToggleCalendar(id, changed.visible); return { ...current, calendars: next } }),
    toggleHoliday: () => commit((current) => { const enabled = !current.holidayEnabled; if (session) void cloudToggleHoliday(session.user.id, enabled); return { ...current, holidayEnabled: enabled } }),
    resetDemo: () => commit(() => createSeedData()),
  }), [cloudLoading, commit, data, session])

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>
}

export function useStore(): StoreApi {
  const value = useContext(StoreContext)
  if (!value) throw new Error('useStore must be used inside StoreProvider')
  return value
}

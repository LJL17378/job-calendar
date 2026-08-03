import { CalendarClock, Link2, MapPin, Repeat2, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useStore } from '../data/store'
import { DEFAULT_TIME_ZONE, fromLocalInputValue, toLocalInputValue } from '../lib/date'
import { createId } from '../lib/id'
import type { CalendarEvent } from '../types/domain'

export interface EventDraft { start: string; end: string; allDay: boolean }

export function EventEditor({ event, draft, occurrence, onClose }: { event: CalendarEvent | null; draft: EventDraft | null; occurrence?: EventDraft | null; onClose: () => void }) {
  const { calendars, applications, companies, stages, saveEvent, deleteEvent, saveException } = useStore()
  const fallbackStart = occurrence?.start ?? draft?.start ?? new Date().toISOString()
  const fallbackEnd = occurrence?.end ?? draft?.end ?? new Date(Date.now() + 3_600_000).toISOString()
  const [title, setTitle] = useState(event?.title ?? '')
  const [description, setDescription] = useState(event?.description ?? '')
  const [location, setLocation] = useState(event?.location ?? '')
  const [calendarId, setCalendarId] = useState(event?.calendarId ?? calendars.find((calendar) => calendar.kind === 'job')?.id ?? calendars[0]?.id ?? '')
  const [start, setStart] = useState(toLocalInputValue(occurrence?.start ?? event?.start ?? fallbackStart))
  const [end, setEnd] = useState(toLocalInputValue(occurrence?.end ?? event?.end ?? fallbackEnd))
  const [allDay, setAllDay] = useState(event?.allDay ?? draft?.allDay ?? false)
  const [recurrence, setRecurrence] = useState(event?.recurrenceRule?.replace('FREQ=', '').toLowerCase() ?? 'none')
  const [applicationId, setApplicationId] = useState(event?.applicationId ?? '')
  const [stageId, setStageId] = useState(event?.stageId ?? '')
  const [dirty, setDirty] = useState(false)
  const [editScope, setEditScope] = useState<'single' | 'series'>(event?.recurrenceRule && occurrence ? 'single' : 'series')
  const availableStages = useMemo(() => stages.filter((stage) => stage.applicationId === applicationId), [applicationId, stages])

  useEffect(() => {
    const guard = (beforeUnloadEvent: BeforeUnloadEvent) => { if (dirty) beforeUnloadEvent.preventDefault() }
    window.addEventListener('beforeunload', guard)
    return () => window.removeEventListener('beforeunload', guard)
  }, [dirty])

  function close() {
    if (!dirty || window.confirm('有尚未保存的修改，确定离开吗？')) onClose()
  }
  function submit(formEvent: FormEvent) {
    formEvent.preventDefault()
    const next: CalendarEvent = {
      id: event?.id ?? createId('event'), calendarId, title: title.trim(), description: description.trim(), location: location.trim(),
      start: fromLocalInputValue(start), end: fromLocalInputValue(end), allDay, timeZone: DEFAULT_TIME_ZONE,
      recurrenceRule: recurrence === 'none' ? null : `FREQ=${recurrence.toUpperCase()}`,
      applicationId: applicationId || null, stageId: stageId || null,
      importedUid: event?.importedUid ?? null, recurrenceId: event?.recurrenceId ?? null,
    }
    if (event?.recurrenceRule && occurrence && editScope === 'single') {
      saveException({ id: createId('exception'), eventId: event.id, occurrenceStart: occurrence.start, cancelled: false, override: { title: next.title, description: next.description, location: next.location, start: next.start, end: next.end, allDay: next.allDay } })
    } else saveEvent(next)
    setDirty(false); onClose()
  }
  const mark = <T,>(setter: (value: T) => void) => (value: T) => { setDirty(true); setter(value) }

  return <div className="editor-backdrop" onMouseDown={(mouseEvent) => { if (mouseEvent.target === mouseEvent.currentTarget) close() }}>
    <aside className="event-editor" aria-label="日程编辑器">
      <header><h2>{event ? event.title : '新建日程'}</h2><button className="icon-button" onClick={close} aria-label="关闭"><X size={20}/></button></header>
      <form onSubmit={submit} onChange={() => setDirty(true)}>
        <label className="field"><span>标题</span><input autoFocus required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例如：字节跳动 · 一面"/></label>
        {event?.recurrenceRule && occurrence && <label className="field"><span>编辑范围</span><select value={editScope} onChange={(e) => setEditScope(e.target.value as 'single' | 'series')}><option value="single">仅本次日程</option><option value="series">整个重复系列</option></select></label>}
        <div className="field-grid">
          <label className="field"><span>开始</span><div className="input-icon"><CalendarClock size={17}/><input type="datetime-local" required value={start} onChange={(e) => setStart(e.target.value)}/></div></label>
          <label className="field"><span>结束</span><div className="input-icon"><CalendarClock size={17}/><input type="datetime-local" required min={start} value={end} onChange={(e) => setEnd(e.target.value)}/></div></label>
        </div>
        <label className="toggle-row"><input type="checkbox" checked={allDay} onChange={(e) => mark(setAllDay)(e.target.checked)}/><span>全天日程</span></label>
        <div className="field-grid">
          <label className="field"><span>日历</span><select value={calendarId} onChange={(e) => setCalendarId(e.target.value)}>{calendars.filter((calendar) => !calendar.readOnly).map((calendar) => <option value={calendar.id} key={calendar.id}>{calendar.name}</option>)}</select></label>
          <label className="field"><span>重复</span><div className="input-icon"><Repeat2 size={17}/><select value={recurrence} onChange={(e) => setRecurrence(e.target.value)}><option value="none">不重复</option><option value="daily">每天</option><option value="weekly">每周</option><option value="monthly">每月</option><option value="yearly">每年</option></select></div></label>
        </div>
        <label className="field"><span>地点 / 会议链接</span><div className="input-icon"><MapPin size={17}/><input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="会议室或视频会议链接"/></div></label>
        <label className="field"><span>关联岗位</span><div className="input-icon"><Link2 size={17}/><select value={applicationId} onChange={(e) => { setApplicationId(e.target.value); setStageId('') }}><option value="">不关联岗位</option>{applications.map((application) => <option value={application.id} key={application.id}>{companies.find((company) => company.id === application.companyId)?.name} · {application.role}</option>)}</select></div></label>
        {applicationId && <label className="field"><span>关联阶段</span><select value={stageId} onChange={(e) => setStageId(e.target.value)}><option value="">仅关联岗位</option>{availableStages.map((stage) => <option value={stage.id} key={stage.id}>{stage.name}</option>)}</select></label>}
        <label className="field"><span>备注</span><textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="准备事项、联系人或需要携带的材料" rows={4}/></label>
        <footer>{event ? <button type="button" className="danger-button" onClick={() => { if (window.confirm(editScope === 'single' ? '确定取消本次日程吗？' : '确定删除整个日程系列吗？')) { if (event.recurrenceRule && occurrence && editScope === 'single') saveException({ id: createId('exception'), eventId: event.id, occurrenceStart: occurrence.start, cancelled: true, override: {} }); else deleteEvent(event.id); onClose() } }}><Trash2 size={17}/>{editScope === 'single' ? '取消本次' : '删除'}</button> : <span/>}<div><button type="button" className="secondary-button" onClick={close}>取消</button><button className="primary-button" type="submit">保存日程</button></div></footer>
      </form>
    </aside>
  </div>
}

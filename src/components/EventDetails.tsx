import { AlignLeft, BriefcaseBusiness, CalendarDays, Clock3, MapPin, Pencil, Repeat2, X } from 'lucide-react'
import { useStore } from '../data/store'
import type { CalendarEvent } from '../types/domain'
import type { EventDraft } from './EventEditor'
import { LinkedText } from './LinkedText'

function formatDateTime(value: string, allDay: boolean) {
  return new Intl.DateTimeFormat('zh-CN', allDay ? {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
  } : {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(value))
}

export function EventDetails({ event, occurrence, onEdit, onClose }: { event: CalendarEvent; occurrence?: EventDraft | null; onEdit: () => void; onClose: () => void }) {
  const { calendars, applications, companies } = useStore()
  const calendar = calendars.find((item) => item.id === event.calendarId)
  const application = applications.find((item) => item.id === event.applicationId)
  const company = companies.find((item) => item.id === application?.companyId)
  const start = occurrence?.start ?? event.start
  const end = occurrence?.end ?? event.end

  return <div className="editor-backdrop" onMouseDown={(mouseEvent) => { if (mouseEvent.target === mouseEvent.currentTarget) onClose() }}>
    <aside className="event-details" aria-label="日程详情">
      <header><div className="event-detail-calendar"><i style={{ background: event.color ?? calendar?.color }} /><span>{calendar?.name}</span></div><button className="icon-button" onClick={onClose} aria-label="关闭"><X size={20}/></button></header>
      <div className="event-detail-body">
        <h2>{event.title}</h2>
        <dl>
          <div><dt><Clock3 size={17}/></dt><dd><strong>{formatDateTime(start, event.allDay)}</strong>{!event.allDay && <span>至 {formatDateTime(end, false)}</span>}</dd></div>
          {event.recurrenceRule && <div><dt><Repeat2 size={17}/></dt><dd>重复日程</dd></div>}
          {event.location && <div><dt><MapPin size={17}/></dt><dd><LinkedText>{event.location}</LinkedText></dd></div>}
          {application && <div><dt><BriefcaseBusiness size={17}/></dt><dd>{company?.name} · {application.role}</dd></div>}
          {event.description && <div className="event-detail-description"><dt><AlignLeft size={17}/></dt><dd><LinkedText>{event.description}</LinkedText></dd></div>}
        </dl>
      </div>
      <footer><span><CalendarDays size={15}/>{event.timeZone}</span><button className="primary-button" onClick={onEdit}><Pencil size={16}/>编辑</button></footer>
    </aside>
  </div>
}

import { ArrowLeft, CalendarPlus, Clock3, MapPin, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { EventEditor, type EventDraft } from '../components/EventEditor'
import { PageHeader } from '../components/PageHeader'
import { useStore } from '../data/store'
import { formatDateTime } from '../lib/date'
import type { CalendarEvent } from '../types/domain'

function newEventDraft(): EventDraft {
  const start = new Date()
  start.setSeconds(0, 0)
  start.setMinutes(Math.ceil(start.getMinutes() / 15) * 15)
  return { start: start.toISOString(), end: new Date(start.getTime() + 60 * 60 * 1000).toISOString(), allDay: false }
}

export default function ApplicationDetailPage() {
  const { id } = useParams()
  const store = useStore()
  const [draft, setDraft] = useState<EventDraft | null>(null)
  const [selected, setSelected] = useState<CalendarEvent | null>(null)
  const application = store.applications.find((item) => item.id === id)
  const events = useMemo(
    () => store.events.filter((event) => event.applicationId === id).sort((a, b) => a.start.localeCompare(b.start)),
    [id, store.events],
  )
  if (!application) return <Navigate to="/applications" replace />
  const company = store.companies.find((item) => item.id === application.companyId)
  const closeEditor = () => { setDraft(null); setSelected(null) }
  const addNode = () => setDraft(newEventDraft())

  return (
    <section className="page detail-page">
      <Link className="back-link" to="/applications"><ArrowLeft size={17} />返回岗位</Link>
      <PageHeader
        title={application.role}
        meta={[company?.name, application.location, application.source, application.workMode].filter(Boolean).join(' · ')}
        actions={<button className="primary-button" onClick={addNode}><Plus size={17} />新增节点</button>}
      />
      <div className="detail-main">
        <section className="content-card">
          <header>
            <div><h2>日程节点</h2><p>每个节点都是一条与此岗位绑定的日程。</p></div>
            <button className="secondary-button compact" onClick={addNode}><CalendarPlus size={16} />添加</button>
          </header>
          {events.length === 0 ? (
            <button className="node-empty" onClick={addNode}><CalendarPlus size={22} /><strong>添加第一个节点</strong><span>记录投递、笔试、面试、截止日期或跟进安排</span></button>
          ) : (
            <div className="node-list">
              {events.map((event) => (
                <button key={event.id} className="node-row" onClick={() => setSelected(event)}>
                  <i style={{ background: store.calendars.find((calendar) => calendar.id === event.calendarId)?.color }} />
                  <div><strong>{event.title}</strong><span><Clock3 size={13} />{formatDateTime(event.start)} – {new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(event.end))}</span></div>
                  <span className="node-location">{event.location && <><MapPin size={13} />{event.location}</>}</span>
                </button>
              ))}
            </div>
          )}
        </section>
        <section className="content-card">
          <header><h2>岗位笔记</h2></header>
          <p className="notes-content">{application.notes || '还没有记录笔记。'}</p>
        </section>
      </div>
      {(draft || selected) && <EventEditor event={selected} draft={draft} initialApplicationId={application.id} onClose={closeEditor} />}
    </section>
  )
}

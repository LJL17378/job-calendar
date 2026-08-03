import { DataSet } from 'vis-data'
import { Timeline } from 'vis-timeline/standalone'
import 'vis-timeline/styles/vis-timeline-graph2d.min.css'
import { useEffect, useMemo, useRef } from 'react'
import { PageHeader } from '../components/PageHeader'
import { useStore } from '../data/store'
import { formatDateTime } from '../lib/date'

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]!)
}

export default function TimelinePage() {
  const container = useRef<HTMLDivElement>(null)
  const store = useStore()
  const applications = useMemo(() => store.applications.filter((application) => application.status === 'active'), [store.applications])
  const linkedEvents = useMemo(() => store.events.filter((event) => event.applicationId && applications.some((application) => application.id === event.applicationId)), [applications, store.events])

  useEffect(() => {
    if (!container.current || window.matchMedia('(max-width: 720px)').matches) return
    const groups = new DataSet(applications.map((application) => ({
      id: application.id,
      content: `<div class="timeline-group"><strong>${escapeHtml(store.companies.find((company) => company.id === application.companyId)?.name ?? '')}</strong><span>${escapeHtml(application.role)}</span></div>`,
    })))
    const now = Date.now()
    const items = new DataSet(linkedEvents.map((event) => {
      const duration = new Date(event.end).getTime() - new Date(event.start).getTime()
      const isRange = duration >= 86400000
      return {
        id: event.id,
        group: event.applicationId!,
        content: escapeHtml(event.title),
        start: event.start,
        ...(isRange ? { end: event.end } : {}),
        type: isRange ? 'range' : 'box',
        className: new Date(event.end).getTime() < now ? 'timeline-completed' : new Date(event.start).getTime() <= now ? 'timeline-active' : 'timeline-planned',
        editable: true,
      }
    }))
    const timeline = new Timeline(container.current, items, groups, {
      autoResize: true,
      height: Math.max(360, applications.length * 92 + 100),
      stack: false,
      showCurrentTime: true,
      zoomMin: 86400000 * 3,
      zoomMax: 86400000 * 365,
      start: new Date(Date.now() - 86400000 * 10),
      end: new Date(Date.now() + 86400000 * 28),
      margin: { item: 12, axis: 16 },
      orientation: 'top',
      format: {
        minorLabels: { day: 'D日', weekday: 'D日', month: 'M月' },
        majorLabels: { day: 'YYYY年M月', weekday: 'YYYY年M月', month: 'YYYY年' },
      },
      editable: { updateTime: true, updateGroup: false, add: false, remove: false },
      onMove(item, callback) {
        const event = store.events.find((entry) => entry.id === item.id)
        if (event) {
          const start = new Date(item.start as Date)
          const duration = new Date(event.end).getTime() - new Date(event.start).getTime()
          store.saveEvent({ ...event, start: start.toISOString(), end: new Date(start.getTime() + duration).toISOString() })
        }
        callback(item)
      },
    })
    return () => timeline.destroy()
  }, [applications, linkedEvents, store])

  return (
    <section className="page timeline-page">
      <PageHeader title="招聘时间线" />
      <div className="timeline-card">
        <div className="timeline-legend"><span><i className="active" />进行中</span><span><i className="completed" />已结束</span><span><i className="planned" />即将进行</span></div>
        <div ref={container} className="desktop-timeline" />
        <div className="mobile-timeline">
          {applications.map((application) => {
            const events = linkedEvents.filter((event) => event.applicationId === application.id).sort((a, b) => a.start.localeCompare(b.start))
            const company = store.companies.find((item) => item.id === application.companyId)
            return <article key={application.id}>
              <header><span className="company-avatar" style={{ background: company?.color }}>{company?.name.slice(0, 1)}</span><div><strong>{company?.name}</strong><span>{application.role}</span></div></header>
              {events.length === 0 ? <p className="timeline-empty">尚未添加日程节点</p> : <ol>{events.map((event) => <li className={new Date(event.end) < new Date() ? 'completed' : 'active'} key={event.id}><i /><div><strong>{event.title}</strong><span>{formatDateTime(event.start)}</span></div></li>)}</ol>}
            </article>
          })}
        </div>
      </div>
    </section>
  )
}

import { DataSet } from 'vis-data'
import { Timeline } from 'vis-timeline/standalone'
import 'vis-timeline/styles/vis-timeline-graph2d.min.css'
import { useEffect, useMemo, useRef } from 'react'
import { PageHeader } from '../components/PageHeader'
import { useStore } from '../data/store'
import { applicationStatusLabels, getApplicationSpan, getCompanyTimelineColor } from '../lib/applicationTimeline'
import { formatDateTime } from '../lib/date'

const day = 86_400_000

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]!)
}

export default function TimelinePage() {
  const container = useRef<HTMLDivElement>(null)
  const store = useStore()
  const applications = useMemo(() => store.applications.filter((application) => application.status !== 'archived'), [store.applications])
  const rows = useMemo(() => applications.map((application) => {
    const company = store.companies.find((item) => item.id === application.companyId)
    const events = store.events.filter((event) => event.applicationId === application.id).sort((a, b) => a.start.localeCompare(b.start))
    return { application, company, events, span: getApplicationSpan(application, events), color: getCompanyTimelineColor(company?.name ?? application.role, company?.color) }
  }), [applications, store.companies, store.events])

  useEffect(() => {
    if (!container.current || window.matchMedia('(max-width: 720px)').matches) return
    const groups = new DataSet(rows.map(({ application, company, color }) => ({
      id: application.id,
      content: `<div class="timeline-group"><i style="background:${color}"></i><div><strong>${escapeHtml(company?.name ?? '')}</strong><span>${escapeHtml(application.role)}</span></div><em class="status-${application.status}">${applicationStatusLabels[application.status]}</em></div>`,
    })))
    const now = Date.now()
    const items = new DataSet(rows.flatMap(({ application, events, span, color }) => [
      {
        id: `application:${application.id}`,
        group: application.id,
        content: `${span.durationDays} 天 · ${applicationStatusLabels[application.status]}`,
        start: span.start,
        end: span.end,
        type: 'range',
        className: `timeline-application-span status-${application.status}`,
        style: `--timeline-color:${color}`,
        editable: false,
      },
      ...events.map((event) => ({
        id: `event:${event.id}`,
        group: application.id,
        content: escapeHtml(event.title),
        start: event.start,
        type: 'box',
        className: `timeline-node ${new Date(event.end).getTime() < now ? 'past' : 'upcoming'}`,
        style: `--timeline-color:${color}`,
        editable: true,
      })),
    ]))
    const allStarts = rows.flatMap((row) => [new Date(row.span.start).getTime(), ...row.events.map((event) => new Date(event.start).getTime())])
    const allEnds = rows.flatMap((row) => [new Date(row.span.end).getTime(), ...row.events.map((event) => new Date(event.end).getTime())])
    const windowStart = allStarts.length ? Math.min(...allStarts) - day * 3 : Date.now() - day * 10
    const windowEnd = allEnds.length ? Math.max(...allEnds) + day * 3 : Date.now() + day * 28
    const timeline = new Timeline(container.current, items, groups, {
      autoResize: true,
      height: Math.max(390, rows.length * 112 + 100),
      stack: true,
      showCurrentTime: true,
      zoomMin: day * 3,
      zoomMax: day * 365,
      start: new Date(windowStart),
      end: new Date(Math.max(windowEnd, windowStart + day * 14)),
      margin: { item: { horizontal: 4, vertical: 8 }, axis: 16 },
      orientation: 'top',
      format: {
        minorLabels: { day: 'D日', weekday: 'D日', month: 'M月' },
        majorLabels: { day: 'YYYY年M月', weekday: 'YYYY年M月', month: 'YYYY年' },
      },
      editable: { updateTime: true, updateGroup: false, add: false, remove: false },
      onMove(item, callback) {
        const id = String(item.id)
        if (!id.startsWith('event:')) return callback(null)
        const event = store.events.find((entry) => entry.id === id.slice(6))
        if (event) {
          const start = new Date(item.start as Date)
          const duration = new Date(event.end).getTime() - new Date(event.start).getTime()
          store.saveEvent({ ...event, start: start.toISOString(), end: new Date(start.getTime() + duration).toISOString() })
        }
        callback(item)
      },
    })
    return () => timeline.destroy()
  }, [rows, store])

  return (
    <section className="page timeline-page">
      <PageHeader title="招聘时间线" />
      <div className="timeline-card">
        <div className="timeline-legend"><span><i className="duration" />岗位持续时间</span><span><i className="milestone" />日程节点</span><span><i className="today" />今天</span></div>
        <div ref={container} className="desktop-timeline" />
        <div className="mobile-timeline">
          {rows.map(({ application, company, events, span, color }) => (
            <article key={application.id} style={{ '--timeline-color': color } as React.CSSProperties}>
              <header><span className="company-avatar" style={{ background: color }}>{company?.name.slice(0, 1)}</span><div><strong>{company?.name}</strong><span>{application.role}</span></div><em className={`mobile-status status-${application.status}`}>{applicationStatusLabels[application.status]}</em></header>
              <div className="mobile-duration"><i /><div><strong>{span.durationDays} 天</strong><span>{formatDateTime(span.start)} → {application.status === 'active' ? '至今' : formatDateTime(span.end)}</span></div></div>
              {events.length === 0 ? <p className="timeline-empty">持续跟踪中，尚未添加日程节点</p> : <ol>{events.map((event) => <li className={new Date(event.end) < new Date() ? 'completed' : 'active'} key={event.id}><i /><div><strong>{event.title}</strong><span>{formatDateTime(event.start)}</span></div></li>)}</ol>}
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

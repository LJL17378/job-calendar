import { DataSet } from "vis-data";
import { Timeline } from "vis-timeline/standalone";
import "vis-timeline/styles/vis-timeline-graph2d.min.css";
import { useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { useStore } from "../data/store";
import {
  applicationStatusLabels,
  getApplicationSpan,
  getCompanyTimelineColor,
} from "../lib/applicationTimeline";
import { formatDateTime } from "../lib/date";

const day = 86_400_000;

function formatSpanDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
  }).format(new Date(value));
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        character
      ]!,
  );
}

export default function TimelinePage() {
  const container = useRef<HTMLDivElement>(null);
  const store = useStore();
  const applications = useMemo(
    () =>
      store.applications.filter(
        (application) => application.status !== "archived",
      ),
    [store.applications],
  );
  const rows = useMemo(
    () =>
      applications.map((application) => {
        const company = store.companies.find(
          (item) => item.id === application.companyId,
        );
        const events = store.events
          .filter((event) => event.applicationId === application.id)
          .sort((a, b) => a.start.localeCompare(b.start));
        return {
          application,
          company,
          events,
          span: getApplicationSpan(application, events),
          color: getCompanyTimelineColor(
            company?.name ?? application.role,
            company?.color,
          ),
        };
      }),
    [applications, store.companies, store.events],
  );

  useEffect(() => {
    if (!container.current || window.matchMedia("(max-width: 920px)").matches)
      return;
    const groups = new DataSet(
      rows.map(({ application, company, color }) => {
        const companyName = company?.name ?? application.role;
        const role = application.role === companyName ? "" : application.role;
        const content = document.createElement("div");
        content.className = "timeline-group";
        content.style.setProperty("--timeline-color", color);
        const copy = document.createElement("div");
        copy.className = "timeline-group-copy";
        const companyLabel = document.createElement("strong");
        companyLabel.textContent = companyName;
        copy.append(companyLabel);
        if (role) {
          const roleLabel = document.createElement("span");
          roleLabel.textContent = role;
          copy.append(roleLabel);
        }
        const status = document.createElement("em");
        status.className = `status-${application.status}`;
        status.textContent = applicationStatusLabels[application.status];
        content.append(copy, status);
        return {
          id: application.id,
          content,
        };
      }),
    );
    const now = Date.now();
    const items = new DataSet(
      rows.flatMap(({ application, events, span, color }) => [
        {
          id: `application:${application.id}`,
          group: application.id,
          content: `${span.durationDays} 天 · ${applicationStatusLabels[application.status]}`,
          start: span.start,
          end: span.end,
          type: "range",
          className: `timeline-application-span status-${application.status}`,
          style: `--timeline-color:${color}`,
          editable: false,
        },
        ...events.map((event) => ({
          id: `event:${event.id}`,
          group: application.id,
          content: escapeHtml(event.title),
          start: event.start,
          type: "box",
          className: `timeline-node ${new Date(event.end).getTime() < now ? "past" : "upcoming"}`,
          style: `--timeline-color:${event.color ?? color}`,
          editable: true,
        })),
      ]),
    );
    const allStarts = rows.flatMap((row) => [
      new Date(row.span.start).getTime(),
      ...row.events.map((event) => new Date(event.start).getTime()),
    ]);
    const allEnds = rows.flatMap((row) => [
      new Date(row.span.end).getTime(),
      ...row.events.map((event) => new Date(event.end).getTime()),
    ]);
    const windowStart = allStarts.length
      ? Math.min(...allStarts) - day
      : Date.now() - day * 3;
    const windowEnd = allEnds.length
      ? Math.max(Math.max(...allEnds) + day, windowStart + day * 7)
      : Date.now() + day * 4;
    const timeline = new Timeline(container.current, items, groups, {
      autoResize: true,
      height: Math.max(180, rows.length * 92 + 76),
      stack: true,
      showCurrentTime: true,
      zoomMin: day * 3,
      zoomMax: day * 365,
      start: new Date(windowStart),
      end: new Date(windowEnd),
      margin: { item: { horizontal: 5, vertical: 7 }, axis: 12 },
      orientation: "top",
      format: {
        minorLabels: { day: "D日", weekday: "D日", month: "M月" },
        majorLabels: {
          day: "YYYY年M月",
          weekday: "YYYY年M月",
          month: "YYYY年",
        },
      },
      editable: {
        updateTime: true,
        updateGroup: false,
        add: false,
        remove: false,
      },
      onMove(item, callback) {
        const id = String(item.id);
        if (!id.startsWith("event:")) return callback(null);
        const event = store.events.find((entry) => entry.id === id.slice(6));
        if (event) {
          const start = new Date(item.start as Date);
          const duration =
            new Date(event.end).getTime() - new Date(event.start).getTime();
          store.saveEvent({
            ...event,
            start: start.toISOString(),
            end: new Date(start.getTime() + duration).toISOString(),
          });
        }
        callback(item);
      },
    });
    return () => timeline.destroy();
  }, [rows, store]);

  return (
    <section className="page timeline-page">
      <PageHeader title="招聘时间线" />
      <div className="timeline-card">
        <div className="timeline-toolbar">
          <div className="timeline-count">
            <strong>{rows.length}</strong>
            <span>个岗位</span>
          </div>
          <div className="timeline-legend">
            <span>
              <i className="duration" />
              持续时间
            </span>
            <span>
              <i className="milestone" />
              日程节点
            </span>
            <span>
              <i className="today" />
              今天
            </span>
          </div>
        </div>
        <div ref={container} className="desktop-timeline" />
        <div className="mobile-timeline">
          {rows.map(({ application, company, events, span, color }) => {
            const companyName = company?.name ?? application.role;
            return (
              <article
                key={application.id}
                style={{ "--timeline-color": color } as React.CSSProperties}
              >
                <header>
                  <i className="mobile-company-color" />
                  <div>
                    <strong>{companyName}</strong>
                    {application.role !== companyName && (
                      <span>{application.role}</span>
                    )}
                  </div>
                  <em className={`mobile-status status-${application.status}`}>
                    {applicationStatusLabels[application.status]}
                  </em>
                </header>
                <div className="mobile-duration">
                  <div>
                    <strong>{span.durationDays} 天</strong>
                    <span>
                      {formatSpanDate(span.start)} —{" "}
                      {application.status === "active"
                        ? "今天"
                        : formatSpanDate(span.end)}
                    </span>
                  </div>
                  <i />
                </div>
                {events.length === 0 ? (
                  <div className="timeline-empty">
                    <span>还没有笔试或面试日程</span>
                    <Link to={`/applications/${application.id}`}>添加节点</Link>
                  </div>
                ) : (
                  <ol>
                    {events.map((event) => (
                      <li
                        className={
                          new Date(event.end) < new Date()
                            ? "completed"
                            : "active"
                        }
                        key={event.id}
                        style={
                          {
                            "--timeline-color": event.color ?? color,
                          } as React.CSSProperties
                        }
                      >
                        <i />
                        <div>
                          <strong>{event.title}</strong>
                          <span>{formatDateTime(event.start)}</span>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

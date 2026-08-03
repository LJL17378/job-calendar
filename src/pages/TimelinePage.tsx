import { DataSet } from "vis-data";
import { Timeline } from "vis-timeline/standalone";
import "vis-timeline/styles/vis-timeline-graph2d.min.css";
import { useEffect, useMemo, useRef } from "react";
import { PageHeader } from "../components/PageHeader";
import { useStore } from "../data/store";
import { formatDateTime } from "../lib/date";

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
        (application) => application.status === "active",
      ),
    [store.applications],
  );
  useEffect(() => {
    if (!container.current || window.matchMedia("(max-width: 720px)").matches)
      return;
    const groups = new DataSet(
      applications.map((application) => ({
        id: application.id,
        content: `<div class="timeline-group"><strong>${escapeHtml(store.companies.find((company) => company.id === application.companyId)?.name ?? "")}</strong><span>${escapeHtml(application.role)}</span></div>`,
      })),
    );
    const items = new DataSet(
      store.stages
        .filter((stage) =>
          applications.some(
            (application) => application.id === stage.applicationId,
          ),
        )
        .flatMap((stage) => {
          const event = store.events.find((item) => item.stageId === stage.id);
          const date = event?.start ?? stage.plannedAt ?? stage.completedAt;
          if (!date) return [];
          return [
            {
              id: stage.id,
              group: stage.applicationId,
              content: stage.name,
              start: date,
              end: event?.end,
              type: event?.end ? "range" : "point",
              className: `timeline-${stage.status}`,
              editable: !event,
            },
          ];
        }),
    );
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
      orientation: "top",
      editable: {
        updateTime: true,
        updateGroup: false,
        add: false,
        remove: false,
      },
      onMove(item, callback) {
        const stage = store.stages.find((entry) => entry.id === item.id);
        if (stage)
          store.saveStage({
            ...stage,
            plannedAt: new Date(item.start as Date).toISOString(),
          });
        callback(item);
      },
    });
    return () => timeline.destroy();
  }, [applications, store]);
  return (
    <section className="page timeline-page">
      <PageHeader title="Timeline" />
      <div className="timeline-card">
        <div className="timeline-legend">
          <span>
            <i className="active" />
            当前阶段
          </span>
          <span>
            <i className="completed" />
            已完成
          </span>
          <span>
            <i className="planned" />
            计划节点
          </span>
        </div>
        <div ref={container} className="desktop-timeline" />
        <div className="mobile-timeline">
          {applications.map((application) => (
            <article key={application.id}>
              <header>
                <span
                  className="company-avatar"
                  style={{
                    background: store.companies.find(
                      (company) => company.id === application.companyId,
                    )?.color,
                  }}
                >
                  {store.companies
                    .find((company) => company.id === application.companyId)
                    ?.name.slice(0, 1)}
                </span>
                <div>
                  <strong>
                    {
                      store.companies.find(
                        (company) => company.id === application.companyId,
                      )?.name
                    }
                  </strong>
                  <span>{application.role}</span>
                </div>
              </header>
              <ol>
                {store.stages
                  .filter((stage) => stage.applicationId === application.id)
                  .map((stage) => {
                    const linked = store.events.find(
                      (event) => event.stageId === stage.id,
                    );
                    return (
                      <li className={stage.status} key={stage.id}>
                        <i />
                        <div>
                          <strong>{stage.name}</strong>
                          <span>
                            {linked
                              ? formatDateTime(linked.start)
                              : formatDateTime(
                                  stage.plannedAt ?? stage.completedAt,
                                )}
                          </span>
                        </div>
                      </li>
                    );
                  })}
              </ol>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

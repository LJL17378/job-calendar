import { BriefcaseBusiness, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ApplicationEditor } from "../components/ApplicationEditor";
import { EmptyState } from "../components/EmptyState";
import { PageHeader } from "../components/PageHeader";
import { useStore } from "../data/store";
import { formatDateTime } from "../lib/date";

export default function ApplicationsPage() {
  const { applications, companies, events } = useStore();
  const [open, setOpen] = useState(false);
  const active = useMemo(
    () => applications.filter((application) => application.status === "active"),
    [applications],
  );
  return (
    <section className="page">
      <PageHeader
        title="岗位"
        actions={
          <button
            className="toolbar-add-button"
            aria-label="添加岗位"
            title="添加岗位"
            onClick={() => setOpen(true)}
          >
            <Plus size={21} />
          </button>
        }
      />
      <div className="stat-strip">
        <div>
          <strong>{applications.length}</strong>
          <span>全部岗位</span>
        </div>
        <div>
          <strong>{active.length}</strong>
          <span>进行中</span>
        </div>
        <div>
          <strong>
            {applications.filter((item) => item.status === "offer").length}
          </strong>
          <span>Offer</span>
        </div>
        <div>
          <strong>
            {applications.filter((item) => item.status === "rejected").length}
          </strong>
          <span>已结束</span>
        </div>
      </div>
      {applications.length === 0 ? (
        <EmptyState
          icon={<BriefcaseBusiness />}
          title="还没有岗位"
          description="添加第一个岗位并开始记录招聘流程。"
        />
      ) : (
        <div className="application-list">
          <div className="application-list-header" aria-hidden="true">
            <span>岗位</span>
            <span>状态</span>
            <span>日程节点</span>
            <span>下个安排</span>
            <span>最近更新</span>
          </div>
          {applications.map((application) => {
            const company = companies.find(
              (item) => item.id === application.companyId,
            );
            const linkedEvents = events
              .filter((event) => event.applicationId === application.id)
              .sort((a, b) => a.start.localeCompare(b.start));
            const nextEvent = linkedEvents.find((event) => new Date(event.end).getTime() >= Date.now());
            return (
              <Link
                className="application-row"
                key={application.id}
                to={`/applications/${application.id}`}
              >
                <div className="application-identity">
                  <i style={{ background: company?.color }} />
                  <div>
                    <strong>{application.role}</strong>
                    <span>
                      {company?.name}
                      {application.location ? ` · ${application.location}` : ""}
                    </span>
                  </div>
                </div>
                <span className={`application-status ${application.status}`}>
                  <i />
                  <span>
                    {application.status === "active"
                      ? "进行中"
                      : application.status}
                  </span>
                </span>
                <div className="application-stage">
                  <strong>{linkedEvents.length} 个节点</strong>
                  <span>{linkedEvents.length ? "已关联日历" : "尚未安排"}</span>
                </div>
                <div className="application-progress">
                  <span>{nextEvent ? formatDateTime(nextEvent.start) : "暂无安排"}</span>
                </div>
                <time>
                  {formatDateTime(
                    linkedEvents.at(-1)?.start ?? application.createdAt,
                  )}
                </time>
              </Link>
            );
          })}
        </div>
      )}
      {open && <ApplicationEditor onClose={() => setOpen(false)} />}
    </section>
  );
}

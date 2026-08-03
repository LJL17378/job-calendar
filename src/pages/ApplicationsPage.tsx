import { ArrowUpRight, BriefcaseBusiness, MapPin, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ApplicationEditor } from "../components/ApplicationEditor";
import { EmptyState } from "../components/EmptyState";
import { PageHeader } from "../components/PageHeader";
import { useStore } from "../data/store";
import { formatDateTime } from "../lib/date";

export default function ApplicationsPage() {
  const { applications, companies, stages } = useStore();
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
          <button className="primary-button" onClick={() => setOpen(true)}>
            <Plus size={18} />
            添加岗位
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
        <div className="application-grid">
          {applications.map((application) => {
            const company = companies.find(
              (item) => item.id === application.companyId,
            );
            const current = stages.find(
              (stage) => stage.id === application.currentStageId,
            );
            const allStages = stages.filter(
              (stage) => stage.applicationId === application.id,
            );
            return (
              <Link
                className="application-card"
                key={application.id}
                to={`/applications/${application.id}`}
              >
                <div className="card-top">
                  <span
                    className="company-avatar"
                    style={{ background: company?.color }}
                  >
                    {company?.name.slice(0, 1)}
                  </span>
                  <span className={`status-pill ${application.status}`}>
                    {application.status === "active"
                      ? "进行中"
                      : application.status}
                  </span>
                </div>
                <div>
                  <span className="company-name">{company?.name}</span>
                  <h2>{application.role}</h2>
                </div>
                <div className="application-meta">
                  <span>
                    <MapPin size={15} />
                    {application.location || "地点待定"}
                  </span>
                  <span>{application.source || "手动添加"}</span>
                </div>
                <div className="stage-progress">
                  <div>
                    <span>当前阶段</span>
                    <strong>{current?.name ?? "未设置"}</strong>
                  </div>
                  <span>
                    {current ? current.position + 1 : 0}/{allStages.length}
                  </span>
                  <div className="progress-track">
                    <i
                      style={{
                        width: `${(((current?.position ?? -1) + 1) / Math.max(allStages.length, 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <footer>
                  <span>
                    更新于{" "}
                    {formatDateTime(
                      current?.completedAt ?? application.createdAt,
                    )}
                  </span>
                  <ArrowUpRight size={18} />
                </footer>
              </Link>
            );
          })}
        </div>
      )}
      {open && <ApplicationEditor onClose={() => setOpen(false)} />}
    </section>
  );
}

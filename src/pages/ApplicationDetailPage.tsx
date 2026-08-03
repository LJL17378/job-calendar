import {
  ArrowLeft,
  CalendarPlus,
  Check,
  ChevronRight,
  Circle,
  RotateCcw,
} from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { useStore } from "../data/store";
import { formatDateTime } from "../lib/date";

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const store = useStore();
  const application = store.applications.find((item) => item.id === id);
  if (!application) return <Navigate to="/applications" replace />;
  const company = store.companies.find(
    (item) => item.id === application.companyId,
  );
  const stages = store.stages
    .filter((stage) => stage.applicationId === application.id)
    .sort((a, b) => a.position - b.position);
  const transitions = store.transitions
    .filter((transition) => transition.applicationId === application.id)
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  return (
    <section className="page detail-page">
      <Link className="back-link" to="/applications">
        <ArrowLeft size={17} />
        返回岗位
      </Link>
      <PageHeader
        title={application.role}
        meta={[
          company?.name,
          application.location,
          application.source,
          application.workMode,
        ]
          .filter(Boolean)
          .join(" · ")}
        actions={
          <Link to="/calendar" className="secondary-button">
            <CalendarPlus size={17} />
            安排日程
          </Link>
        }
      />
      <div className="detail-layout">
        <div className="detail-main">
          <section className="content-card">
            <header>
              <h2>招聘流程</h2>
              <span className="muted">点击节点手动推进</span>
            </header>
            <div className="stage-list">
              {stages.map((stage) => (
                <button
                  key={stage.id}
                  className={`stage-row ${stage.status}`}
                  onClick={() => store.moveStage(application.id, stage.id)}
                >
                  <span className="stage-state">
                    {stage.status === "completed" ? (
                      <Check size={16} />
                    ) : stage.status === "active" ? (
                      <Circle size={16} fill="currentColor" />
                    ) : (
                      <Circle size={16} />
                    )}
                  </span>
                  <div>
                    <strong>{stage.name}</strong>
                    <span>
                      {stage.completedAt
                        ? `完成于 ${formatDateTime(stage.completedAt)}`
                        : stage.plannedAt
                          ? `计划 ${formatDateTime(stage.plannedAt)}`
                          : stage.status === "active"
                            ? "当前阶段"
                            : "尚未开始"}
                    </span>
                  </div>
                  <ChevronRight size={18} />
                </button>
              ))}
            </div>
          </section>
          <section className="content-card">
            <header>
              <h2>岗位笔记</h2>
            </header>
            <p className="notes-content">
              {application.notes || "还没有记录笔记。"}
            </p>
          </section>
        </div>
        <aside className="history-panel">
          <h2>推进记录</h2>
          {transitions.length === 0 ? (
            <div className="history-empty">
              <RotateCcw size={20} />
              <p>推进阶段后，所有历史会保留在这里。</p>
            </div>
          ) : (
            <ol>
              {transitions.map((transition) => (
                <li key={transition.id}>
                  <i />
                  <div>
                    <strong>
                      {stages.find((stage) => stage.id === transition.toStageId)
                        ?.name ?? "状态更新"}
                    </strong>
                    <span>{formatDateTime(transition.occurredAt)}</span>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </aside>
      </div>
    </section>
  );
}

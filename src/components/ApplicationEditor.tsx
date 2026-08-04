import { X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useStore } from "../data/store";
import { createId } from "../lib/id";
import { getCompanyTimelineColor } from "../lib/applicationTimeline";
import type { Application, Company } from "../types/domain";

export function ApplicationEditor({ application, company, onClose }: { application?: Application; company?: Company; onClose: () => void }) {
  const { addApplication, updateApplication } = useStore();
  const [companyName, setCompanyName] = useState(company?.name ?? "");
  const [companyWebsite, setCompanyWebsite] = useState(company?.website ?? "");
  const [role, setRole] = useState(application?.role ?? "");
  const [jobUrl, setJobUrl] = useState(application?.jobUrl ?? "");
  const [location, setLocation] = useState(application?.location ?? "");
  const [workMode, setWorkMode] = useState<Application['workMode']>(application?.workMode ?? "hybrid");
  const [salary, setSalary] = useState(application?.salary ?? "");
  const [source, setSource] = useState(application?.source ?? "");
  const [contact, setContact] = useState(application?.contact ?? "");
  const [tags, setTags] = useState(application?.tags.join(', ') ?? "");
  const [appliedAt, setAppliedAt] = useState(application?.appliedAt?.slice(0, 10) ?? "");
  const [status, setStatus] = useState<Application['status']>(application?.status ?? "active");
  const [notes, setNotes] = useState(application?.notes ?? "");
  function submit(event: FormEvent) {
    event.preventDefault();
    const companyId = company?.id ?? createId("company");
    const applicationId = application?.id ?? createId("application");
    const nextCompany: Company = {
      id: companyId,
      name: companyName.trim(),
      website: companyWebsite.trim(),
      color: company?.color ?? getCompanyTimelineColor(companyName.trim()),
    };
    const nextApplication: Application = {
      ...application,
      id: applicationId,
      companyId,
      role: role.trim(),
      jobUrl: jobUrl.trim(),
      location: location.trim(),
      workMode,
      salary: salary.trim(),
      source: source.trim(),
      appliedAt: appliedAt ? new Date(`${appliedAt}T00:00:00`).toISOString() : null,
      contact: contact.trim(),
      tags: tags.split(/[,，]/).map((tag) => tag.trim()).filter(Boolean),
      notes: notes.trim(),
      status,
      currentStageId: application?.currentStageId ?? null,
      createdAt: application?.createdAt ?? new Date().toISOString(),
    };
    if (application) updateApplication(nextApplication, nextCompany)
    else addApplication(nextCompany, nextApplication, []);
    onClose();
  }
  return (
    <div className="editor-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <aside className="event-editor compact-editor application-editor" aria-label="岗位编辑器">
        <header>
          <h2>{application ? '编辑岗位' : '添加岗位'}</h2>
          <button className="icon-button" onClick={onClose} aria-label="关闭">
            <X size={20} />
          </button>
        </header>
        <form onSubmit={submit}>
          <label className="field">
            <span>公司</span>
            <input
              required
              autoFocus
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="公司名称"
            />
          </label>
          <label className="field"><span>公司网站</span><input type="url" value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)} placeholder="https://company.com" /></label>
          <label className="field">
            <span>岗位</span>
            <input
              required
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="岗位名称"
            />
          </label>
          <label className="field"><span>岗位链接</span><input type="url" value={jobUrl} onChange={(e) => setJobUrl(e.target.value)} placeholder="招聘页面地址" /></label>
          <div className="field-grid">
            <label className="field">
              <span>地点</span>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="上海 / Remote"
              />
            </label>
            <label className="field">
              <span>来源</span>
              <input
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="官网 / 内推"
              />
            </label>
            <label className="field"><span>工作方式</span><select value={workMode} onChange={(e) => setWorkMode(e.target.value as Application['workMode'])}><option value="onsite">现场办公</option><option value="hybrid">混合办公</option><option value="remote">远程办公</option></select></label>
          </div>
          <div className="field-grid">
            <label className="field"><span>薪资</span><input value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="薪资范围" /></label>
            <label className="field"><span>联系人</span><input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="姓名 / 邮箱 / 电话" /></label>
          </div>
          <div className="field-grid">
            <label className="field"><span>投递日期</span><input type="date" value={appliedAt} onChange={(e) => setAppliedAt(e.target.value)} /></label>
            <label className="field"><span>状态</span><select value={status} onChange={(e) => setStatus(e.target.value as Application['status'])}><option value="active">进行中</option><option value="offer">Offer</option><option value="rejected">已拒绝</option><option value="withdrawn">已撤回</option><option value="archived">已归档</option></select></label>
          </div>
          <label className="field"><span>标签</span><input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="校招, 前端, 内推" /></label>
          <label className="field">
            <span>备注</span>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
          <footer>
            <span />
            <div>
              <button
                type="button"
                className="secondary-button"
                onClick={onClose}
              >
                取消
              </button>
              <button className="primary-button" type="submit">
                {application ? '保存修改' : '创建岗位'}
              </button>
            </div>
          </footer>
        </form>
      </aside>
    </div>
  );
}

import { X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useStore } from "../data/store";
import { createId } from "../lib/id";
import { getCompanyTimelineColor } from "../lib/applicationTimeline";
import type { Application, Company } from "../types/domain";

export function ApplicationEditor({ onClose }: { onClose: () => void }) {
  const { addApplication } = useStore();
  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");
  function submit(event: FormEvent) {
    event.preventDefault();
    const companyId = createId("company");
    const applicationId = createId("application");
    const company: Company = {
      id: companyId,
      name: companyName.trim(),
      website: "",
      color: getCompanyTimelineColor(companyName.trim()),
    };
    const application: Application = {
      id: applicationId,
      companyId,
      role: role.trim(),
      jobUrl: "",
      location: location.trim(),
      workMode: "hybrid",
      salary: "",
      source: source.trim(),
      appliedAt: null,
      contact: "",
      tags: [],
      notes: notes.trim(),
      status: "active",
      currentStageId: null,
      createdAt: new Date().toISOString(),
    };
    addApplication(company, application, []);
    onClose();
  }
  return (
    <div className="editor-backdrop">
      <aside className="event-editor compact-editor">
        <header>
          <h2>添加岗位</h2>
          <button className="icon-button" onClick={onClose}>
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
          <label className="field">
            <span>岗位</span>
            <input
              required
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="岗位名称"
            />
          </label>
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
          </div>
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
                创建岗位
              </button>
            </div>
          </footer>
        </form>
      </aside>
    </div>
  );
}

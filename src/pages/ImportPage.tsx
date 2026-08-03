import {
  CalendarCheck,
  CheckCircle2,
  FileUp,
  RefreshCw,
  UploadCloud,
} from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { PageHeader } from "../components/PageHeader";
import { useStore } from "../data/store";
import { formatDateTime } from "../lib/date";
import { parseIcs, type IcsPreview } from "../lib/ics";
import type { CalendarImportResult } from "../types/domain";

export default function ImportPage() {
  const store = useStore();
  const input = useRef<HTMLInputElement>(null);
  const [calendarId, setCalendarId] = useState("cal-personal");
  const [preview, setPreview] = useState<IcsPreview | null>(null);
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<CalendarImportResult | null>(null);
  useEffect(() => {
    if (!store.calendars.some((calendar) => calendar.id === calendarId))
      setCalendarId(
        store.calendars.find((calendar) => calendar.kind === "personal")?.id ??
          store.calendars[0]?.id ??
          "",
      );
  }, [calendarId, store.calendars]);
  async function choose(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    setPreview(parseIcs(await file.text(), calendarId));
  }
  function performImport() {
    if (preview)
      setResult(
        store.importEvents(
          preview.events.map((event) => ({ ...event, calendarId })),
        ),
      );
  }
  return (
    <section className="page">
      <PageHeader title="导入日历" />
      <div className="import-layout">
        <section className="content-card import-card">
          <header>
            <div className="section-icon">
              <UploadCloud size={22} />
            </div>
            <div>
              <h2>ICS 文件</h2>
              <p>
                兼容 Apple Calendar、Google Calendar、Outlook 等导出的 .ics
                文件。
              </p>
            </div>
          </header>
          <div className="drop-zone" onClick={() => input.current?.click()}>
            <FileUp size={30} />
            <strong>{fileName || "选择一个 .ics 文件"}</strong>
            <span>文件只会在你的浏览器中解析</span>
            <input
              ref={input}
              hidden
              type="file"
              accept=".ics,text/calendar"
              onChange={choose}
            />
          </div>
          <label className="field">
            <span>导入到</span>
            <select
              value={calendarId}
              onChange={(event) => setCalendarId(event.target.value)}
            >
              {store.calendars
                .filter((calendar) => !calendar.readOnly)
                .map((calendar) => (
                  <option value={calendar.id} key={calendar.id}>
                    {calendar.name}
                  </option>
                ))}
            </select>
          </label>
          {preview && (
            <div className="import-preview">
              <div>
                <strong>导入预览</strong>
                <span>{preview.events.length} 条有效日程</span>
              </div>
              {preview.events.slice(0, 5).map((event) => (
                <div className="preview-row" key={event.id}>
                  <i />
                  <div>
                    <strong>{event.title}</strong>
                    <span>
                      {event.allDay ? "全天" : formatDateTime(event.start)}
                    </span>
                  </div>
                </div>
              ))}
              {preview.events.length > 5 && (
                <small>还有 {preview.events.length - 5} 条日程</small>
              )}
              {preview.errors.map((error) => (
                <p className="error-text" key={error}>
                  {error}
                </p>
              ))}
              <button
                className="primary-button"
                disabled={preview.events.length === 0}
                onClick={performImport}
              >
                确认导入
              </button>
            </div>
          )}
          {result && (
            <div className="result-banner">
              <CheckCircle2 size={20} />
              <div>
                <strong>导入完成</strong>
                <span>
                  新增 {result.created} 条，更新 {result.updated} 条
                </span>
              </div>
            </div>
          )}
        </section>
        <section className="content-card holiday-card">
          <header>
            <div className="section-icon green">
              <CalendarCheck size={22} />
            </div>
            <div>
              <h2>中国节假日</h2>
              <p>法定节假日和调休补班，独立显示为只读系统日历。</p>
            </div>
          </header>
          <div className="holiday-visual">
            <span>2026</span>
            <strong>中国大陆</strong>
            <div>
              <i />
              节假日 <i />
              补班
            </div>
          </div>
          <div className="holiday-status">
            <div>
              <strong>{store.holidayEnabled ? "已启用" : "未启用"}</strong>
              <span>数据来源：国务院公告整理</span>
            </div>
            <button
              className={
                store.holidayEnabled ? "secondary-button" : "primary-button"
              }
              onClick={store.toggleHoliday}
            >
              {store.holidayEnabled ? (
                <>
                  <RefreshCw size={17} />
                  隐藏日历
                </>
              ) : (
                "一键启用"
              )}
            </button>
          </div>
        </section>
      </div>
    </section>
  );
}

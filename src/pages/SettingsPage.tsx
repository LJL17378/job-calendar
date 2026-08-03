import {
  Bell,
  Database,
  DownloadCloud,
  ExternalLink,
  Globe2,
  Moon,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { useAuth } from "../auth/AuthProvider";
import { useStore } from "../data/store";

export default function SettingsPage() {
  const { demoMode, signOut } = useAuth();
  const { resetDemo } = useStore();
  const [updateAvailable, setUpdateAvailable] = useState(false);
  useEffect(() => {
    const listener = () => setUpdateAvailable(true);
    window.addEventListener("job-calendar:update-available", listener);
    return () =>
      window.removeEventListener("job-calendar:update-available", listener);
  }, []);
  return (
    <section className="page settings-page">
      <PageHeader title="设置" />
      <div className="settings-grid">
        <section className="content-card settings-section">
          <header>
            <div className="section-icon">
              <Globe2 size={21} />
            </div>
            <div>
              <h2>区域与时间</h2>
              <p>所有日程默认使用以下规则。</p>
            </div>
          </header>
          <div className="setting-row">
            <div>
              <strong>时区</strong>
              <span>Asia/Shanghai</span>
            </div>
            <span className="setting-value">GMT+8</span>
          </div>
          <div className="setting-row">
            <div>
              <strong>每周第一天</strong>
              <span>用于周视图和日期计算</span>
            </div>
            <span className="setting-value">星期一</span>
          </div>
          <div className="setting-row">
            <div>
              <strong>时间格式</strong>
              <span>日历时间轴和编辑器</span>
            </div>
            <span className="setting-value">24 小时</span>
          </div>
        </section>
        <section className="content-card settings-section">
          <header>
            <div className="section-icon purple">
              <Bell size={21} />
            </div>
            <div>
              <h2>提醒与外观</h2>
              <p>第一版保存提醒偏好，系统推送稍后提供。</p>
            </div>
          </header>
          <div className="setting-row">
            <div>
              <strong>默认提醒</strong>
              <span>新建面试和笔试时</span>
            </div>
            <span className="setting-value">提前 30 分钟</span>
          </div>
          <div className="setting-row">
            <div>
              <strong>主题</strong>
              <span>可在侧边栏随时切换</span>
            </div>
            <Moon size={19} />
          </div>
        </section>
        <section className="content-card settings-section">
          <header>
            <div className="section-icon green">
              <ShieldCheck size={21} />
            </div>
            <div>
              <h2>账户与数据</h2>
              <p>
                {demoMode
                  ? "当前数据保存在此浏览器。"
                  : "数据由 Supabase RLS 安全隔离。"}
              </p>
            </div>
          </header>
          {demoMode && (
            <button
              className="secondary-button wide"
              onClick={() => {
                if (window.confirm("确定恢复演示数据吗？")) resetDemo();
              }}
            >
              <RotateCcw size={17} />
              恢复演示数据
            </button>
          )}{" "}
          {!demoMode && (
            <button
              className="secondary-button wide"
              onClick={() => void signOut()}
            >
              退出登录
            </button>
          )}
        </section>
        <section className="content-card settings-section">
          <header>
            <div className="section-icon amber">
              <Database size={21} />
            </div>
            <div>
              <h2>外部连接</h2>
              <p>连接器不会阻塞核心日历使用。</p>
            </div>
          </header>
          <div className="integration-row">
            <div className="integration-logo">飞</div>
            <div>
              <strong>飞书日历</strong>
              <span>等待开放平台应用权限</span>
            </div>
            <button className="secondary-button" disabled>
              暂未连接
            </button>
          </div>
          <div className="integration-row">
            <DownloadCloud size={25} />
            <div>
              <strong>CalDAV</strong>
              <span>已列入后续路线图</span>
            </div>
            <ExternalLink size={17} />
          </div>
        </section>
      </div>
      {updateAvailable && (
        <div className="update-toast">
          <DownloadCloud size={19} />
          <div>
            <strong>发现新版本</strong>
            <span>刷新页面即可更新 Job Calendar。</span>
          </div>
          <button
            className="primary-button"
            onClick={() => window.location.reload()}
          >
            立即更新
          </button>
        </div>
      )}
    </section>
  );
}

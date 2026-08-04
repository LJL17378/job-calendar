import { DownloadCloud, ExternalLink, Moon, RotateCcw } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { useAuth } from "../auth/AuthProvider";
import { useStore } from "../data/store";

export default function SettingsPage() {
  const { demoMode, signOut } = useAuth();
  const { resetDemo } = useStore();
  return (
    <section className="page settings-page">
      <PageHeader title="设置" />
      <div className="settings-surface">
        <section className="settings-section">
          <header>
            <h2>日历</h2>
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
        <section className="settings-section">
          <header>
            <h2>提醒与外观</h2>
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
        <section className="settings-section">
          <header>
            <h2>账户与数据</h2>
            <p>
              {demoMode ? "数据保存在此浏览器" : "已通过 Supabase 安全同步"}
            </p>
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
        <section className="settings-section">
          <header>
            <h2>外部连接</h2>
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
    </section>
  );
}

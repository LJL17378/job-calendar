import {
  BriefcaseBusiness,
  CalendarDays,
  Download,
  LayoutDashboard,
  Moon,
  Settings,
  Sun,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Navigate, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { useStore } from "../data/store";
import { probeCloudConnectivity } from "../lib/supabase";

const nav = [
  { to: "/calendar", label: "日历", icon: CalendarDays },
  { to: "/timeline", label: "时间线", icon: LayoutDashboard },
  { to: "/applications", label: "岗位", icon: BriefcaseBusiness },
  { to: "/import", label: "导入", icon: Download },
  { to: "/settings", label: "设置", icon: Settings },
];

export function AppShell() {
  const { demoMode, loading, session } = useAuth();
  const { cloudLoading } = useStore();
  const [dark, setDark] = useState(
    () => localStorage.getItem("job-calendar:theme") === "dark",
  );
  const [online, setOnline] = useState(true);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    localStorage.setItem("job-calendar:theme", dark ? "dark" : "light");
  }, [dark]);
  useEffect(() => {
    let disposed = false;
    let retryTimer: number | undefined;
    let controller: AbortController | undefined;

    const checkConnection = async () => {
      window.clearTimeout(retryTimer);
      controller?.abort();
      controller = new AbortController();
      const timeout = window.setTimeout(() => controller?.abort(), 6000);
      const reachable = await probeCloudConnectivity(fetch, controller.signal);
      window.clearTimeout(timeout);
      if (disposed) return;
      setOnline(reachable);
      if (!reachable) retryTimer = window.setTimeout(checkConnection, 15000);
    };

    const update = () => void checkConnection();
    void checkConnection();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      disposed = true;
      controller?.abort();
      window.clearTimeout(retryTimer);
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  if (loading)
    return (
      <div className="route-loading">
        <span />
      </div>
    );
  if (!demoMode && !session) return <Navigate to="/login" replace />;
  if (cloudLoading)
    return (
      <div className="route-loading">
        <span />
      </div>
    );
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <strong>Job Calendar</strong>
        </div>
        <nav className="primary-nav">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to}>
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          {demoMode && <span className="demo-badge">本地演示模式</span>}
          <button
            className="icon-text-button"
            onClick={() => setDark((value) => !value)}
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
            <span>{dark ? "浅色模式" : "深色模式"}</span>
          </button>
        </div>
      </aside>
      <main className="main-content">
        {!online && (
          <div className="offline-banner">
            暂时无法连接云端，修改目前不会同步。
          </div>
        )}
        <Outlet context={{ online }} />
      </main>
      <nav className="bottom-nav">
        {nav.slice(0, 4).map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to}>
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

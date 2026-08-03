import { BriefcaseBusiness, CalendarDays, Download, LayoutDashboard, Moon, Settings, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Navigate, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

const nav = [
  { to: '/calendar', label: '日历', icon: CalendarDays },
  { to: '/timeline', label: 'Timeline', icon: LayoutDashboard },
  { to: '/applications', label: '岗位', icon: BriefcaseBusiness },
  { to: '/import', label: '导入', icon: Download },
  { to: '/settings', label: '设置', icon: Settings },
]

export function AppShell() {
  const { demoMode, loading, session } = useAuth()
  const [dark, setDark] = useState(() => localStorage.getItem('job-calendar:theme') === 'dark')
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    localStorage.setItem('job-calendar:theme', dark ? 'dark' : 'light')
  }, [dark])
  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update); window.addEventListener('offline', update)
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update) }
  }, [])
  if (loading) return <div className="route-loading"><span/></div>
  if (!demoMode && !session) return <Navigate to="/login" replace />
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">J</span><div><strong>Job Calendar</strong></div></div>
      <nav className="primary-nav">{nav.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to}><Icon size={19}/><span>{label}</span></NavLink>)}</nav>
      <div className="sidebar-footer">
        {demoMode && <span className="demo-badge">本地演示模式</span>}
        <button className="icon-text-button" onClick={() => setDark((value) => !value)}>{dark ? <Sun size={18}/> : <Moon size={18}/>}<span>{dark ? '浅色模式' : '深色模式'}</span></button>
      </div>
    </aside>
    <main className="main-content">
      {!online && <div className="offline-banner">当前离线，查看不受影响，编辑已暂时禁用。</div>}
      <Outlet context={{ online }} />
    </main>
    <nav className="bottom-nav">{nav.slice(0, 4).map(({ to, label, icon: Icon }) => <NavLink key={to} to={to}><Icon size={20}/><span>{label}</span></NavLink>)}</nav>
  </div>
}

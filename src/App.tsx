import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { PwaUpdatePrompt } from './components/PwaUpdatePrompt'
import LoginPage from './pages/LoginPage'

const CalendarPage = lazy(() => import('./pages/CalendarPage'))
const TimelinePage = lazy(() => import('./pages/TimelinePage'))
const ApplicationsPage = lazy(() => import('./pages/ApplicationsPage'))
const ApplicationDetailPage = lazy(() => import('./pages/ApplicationDetailPage'))
const ImportPage = lazy(() => import('./pages/ImportPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))

export default function App() {
  return <><Suspense fallback={<div className="route-loading"><span/></div>}><Routes>
    <Route path="/login" element={<LoginPage/>}/>
    <Route element={<AppShell/>}>
      <Route index element={<Navigate to="/calendar" replace/>}/>
      <Route path="/calendar" element={<CalendarPage/>}/>
      <Route path="/timeline" element={<TimelinePage/>}/>
      <Route path="/applications" element={<ApplicationsPage/>}/>
      <Route path="/applications/:id" element={<ApplicationDetailPage/>}/>
      <Route path="/import" element={<ImportPage/>}/>
      <Route path="/settings" element={<SettingsPage/>}/>
    </Route>
    <Route path="*" element={<Navigate to="/calendar" replace/>}/>
  </Routes></Suspense><PwaUpdatePrompt /></>
}

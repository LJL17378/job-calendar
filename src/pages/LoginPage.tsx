import { CalendarDays } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

export default function LoginPage() {
  const { session, demoMode, signInWithOtp } = useAuth()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  if (demoMode || session) return <Navigate to="/calendar" replace />
  async function submit(event: FormEvent) { event.preventDefault(); const error = await signInWithOtp(email); setMessage(error ?? '登录链接已发送，请检查邮箱。') }
  return <main className="auth-page"><section className="auth-card"><div className="auth-logo"><CalendarDays size={26}/></div><span className="eyebrow">JOB CALENDAR</span><h1>欢迎回来</h1><p>输入邮箱，我们会发送一个安全的登录链接。</p><form onSubmit={submit}><label>邮箱<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com"/></label><button className="primary-button" type="submit">发送验证码</button></form>{message && <div className="form-message">{message}</div>}</section></main>
}

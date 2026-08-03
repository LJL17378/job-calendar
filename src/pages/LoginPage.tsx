import { CalendarDays } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

export default function LoginPage() {
  const { session, demoMode, signInWithOtp, verifyEmailOtp } = useAuth()
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [resendIn, setResendIn] = useState(0)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (resendIn <= 0) return
    const timer = window.setInterval(() => setResendIn((seconds) => Math.max(0, seconds - 1)), 1_000)
    return () => window.clearInterval(timer)
  }, [resendIn])

  if (demoMode || session) return <Navigate to="/calendar" replace />

  async function sendCode() {
    setSubmitting(true)
    setMessage('')
    const error = await signInWithOtp(email.trim())
    setSubmitting(false)
    if (error) return setMessage(error)
    setCodeSent(true)
    setResendIn(60)
    setMessage('验证码已发送，请查看邮箱。邮件中的登录链接也仍然可用。')
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!codeSent) return sendCode()
    setSubmitting(true)
    setMessage('')
    const error = await verifyEmailOtp(email.trim(), token)
    setSubmitting(false)
    setMessage(error ?? '验证成功，正在进入日历…')
  }

  function changeEmail() {
    setCodeSent(false)
    setToken('')
    setResendIn(0)
    setMessage('')
  }

  return <main className="auth-page"><section className="auth-card"><div className="auth-logo"><CalendarDays size={26}/></div><span className="eyebrow">JOB CALENDAR</span><h1>欢迎回来</h1><p>{codeSent ? <>验证码已发送至 <strong>{email}</strong></> : '输入邮箱，我们会发送一个 6 位登录验证码。'}</p><form onSubmit={submit}>{codeSent ? <><label>验证码<input className="otp-input" type="text" inputMode="numeric" autoComplete="one-time-code" required minLength={6} maxLength={6} pattern="[0-9]{6}" value={token} onChange={(event) => setToken(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" autoFocus/></label><button className="primary-button" type="submit" disabled={submitting || token.length !== 6}>{submitting ? '验证中…' : '验证并登录'}</button><div className="auth-secondary-actions"><button type="button" onClick={() => void sendCode()} disabled={submitting || resendIn > 0}>{resendIn > 0 ? `${resendIn} 秒后重新发送` : '重新发送验证码'}</button><button type="button" onClick={changeEmail}>更换邮箱</button></div></> : <><label>邮箱<input type="email" inputMode="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoFocus/></label><button className="primary-button" type="submit" disabled={submitting}>{submitting ? '发送中…' : '发送验证码'}</button></>}</form>{message && <div className="form-message" role="status">{message}</div>}</section></main>
}

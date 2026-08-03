import type { Session } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

interface AuthApi {
  session: Session | null
  loading: boolean
  demoMode: boolean
  signInWithOtp: (email: string) => Promise<string | null>
  verifyEmailOtp: (email: string, token: string) => Promise<string | null>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthApi | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!supabase) return
    void supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false) })
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => data.subscription.unsubscribe()
  }, [])

  const value = useMemo<AuthApi>(() => ({
    session,
    loading,
    demoMode: !isSupabaseConfigured,
    signInWithOtp: async (email) => {
      if (!supabase) return '当前为本地演示模式，无需登录。'
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })
      return error?.message ?? null
    },
    verifyEmailOtp: async (email, token) => {
      if (!supabase) return '当前为本地演示模式，无需登录。'
      const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })
      return error?.message ?? null
    },
    signOut: async () => { if (supabase) await supabase.auth.signOut() },
  }), [loading, session])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthApi {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}

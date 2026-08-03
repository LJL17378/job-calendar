import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

export const isSupabaseConfigured = Boolean(url && publishableKey)
export const supabase = isSupabaseConfigured ? createClient(url!, publishableKey!, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }) : null

type ConnectivityFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

export async function probeCloudConnectivity(
  fetcher: ConnectivityFetch = fetch,
  signal?: AbortSignal,
  endpoint = url,
  apiKey = publishableKey,
): Promise<boolean> {
  if (!endpoint || !apiKey) return true

  try {
    const response = await fetcher(`${endpoint}/auth/v1/settings`, {
      cache: 'no-store',
      headers: { apikey: apiKey },
      signal,
    })
    return response.status < 500
  } catch {
    return false
  }
}

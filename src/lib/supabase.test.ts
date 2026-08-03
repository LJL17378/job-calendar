import { describe, expect, it, vi } from 'vitest'
import { probeCloudConnectivity } from './supabase'

describe('probeCloudConnectivity', () => {
  it('uses a real cloud response instead of navigator.onLine', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 200 }))

    await expect(
      probeCloudConnectivity(fetcher, undefined, 'https://example.supabase.co', 'sb_publishable_test'),
    ).resolves.toBe(true)
  })

  it('reports a failed network request as unavailable', async () => {
    const fetcher = vi.fn().mockRejectedValue(new TypeError('Network request failed'))

    await expect(
      probeCloudConnectivity(fetcher, undefined, 'https://example.supabase.co', 'sb_publishable_test'),
    ).resolves.toBe(false)
  })
})

import { DownloadCloud } from 'lucide-react'
import { useEffect, useState } from 'react'
import { applyPwaUpdate, subscribeToPwaUpdate } from '../lib/pwa'

export function PwaUpdatePrompt() {
  const [available, setAvailable] = useState(false)
  const [updating, setUpdating] = useState(false)

  useEffect(() => subscribeToPwaUpdate(() => setAvailable(true)), [])

  if (!available) return null
  return <div className="update-toast" role="status">
    <DownloadCloud size={19} />
    <div><strong>发现新版本</strong><span>更新后即可使用最新的登录方式。</span></div>
    <button className="primary-button" disabled={updating} onClick={() => {
      setUpdating(true)
      void applyPwaUpdate()
    }}>{updating ? '更新中…' : '立即更新'}</button>
  </div>
}

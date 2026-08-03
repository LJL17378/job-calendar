import { registerSW } from 'virtual:pwa-register'

type UpdateListener = () => void

const listeners = new Set<UpdateListener>()
let updatePending = false

const updateServiceWorker = registerSW({
  immediate: true,
  onNeedRefresh() {
    updatePending = true
    listeners.forEach((listener) => listener())
  },
})

export function subscribeToPwaUpdate(listener: UpdateListener) {
  listeners.add(listener)
  if (updatePending) listener()
  return () => {
    listeners.delete(listener)
  }
}

export async function applyPwaUpdate() {
  await updateServiceWorker(true)
}

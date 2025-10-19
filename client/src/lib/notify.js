import { apiFetch } from './api'

export async function ensurePermission() {
  try {
    if (!('Notification' in window)) return false
    if (Notification.permission === 'granted') return true
    if (Notification.permission === 'denied') return false
    const res = await Notification.requestPermission()
    return res === 'granted'
  } catch { return false }
}

export async function notifyStart(title, seconds) {
  try {
    const body = `Rest started – ${Math.round(seconds/60)} min`
    const reg = await navigator.serviceWorker?.ready
    if (reg && reg.showNotification) {
      await reg.showNotification(title, {
        body,
        tag: 'rest-timer-start',
        timestamp: Date.now(),
        silent: true,
      })
      return
    }
    new Notification(title, { body, silent: true })
  } catch {}
}

export async function scheduleFinish(title, seconds) {
  const when = Date.now() + seconds * 1000
  try {
    const reg = await navigator.serviceWorker?.ready
    // Attempt Notification Triggers if available (not supported on iOS Safari)
    if (reg && 'showNotification' in reg && 'TimestampTrigger' in window) {
      // @ts-ignore
      const trigger = new window.TimestampTrigger(when)
      await reg.showNotification(`${title} – time's up`, {
        tag: 'rest-timer-finish',
        showTrigger: trigger,
        renotify: true,
        body: 'Rest finished',
      })
      return
    }
  } catch {}
  // Try server-scheduled Web Push (works on installed iOS PWA over HTTPS)
  try {
    const subscription = await ensurePushSubscription()
    if (subscription) {
      await apiFetch('/notify/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription,
          delaySec: Math.max(0, Math.round((when - Date.now()) / 1000)),
          title: `${title} – time's up`,
          body: 'Rest finished',
          tag: 'rest-timer-finish'
        })
      })
      return
    }
  } catch {}

  // Fallback: schedule in-page (will not fire reliably if OS suspends timers)
  try {
    setTimeout(() => {
      try {
        const body = 'Rest finished'
        if (navigator.serviceWorker?.ready && Notification.permission === 'granted') {
          navigator.serviceWorker.ready.then(reg => reg.showNotification(`${title} – time's up`, { body, tag: 'rest-timer-finish', renotify: true }))
        } else {
          new Notification(`${title} – time's up`, { body })
        }
      } catch {}
    }, Math.max(0, when - Date.now()))
  } catch {}
}

async function ensurePushSubscription() {
  try {
    const reg = await navigator.serviceWorker?.ready
    if (!reg?.pushManager) return null
    let sub = await reg.pushManager.getSubscription()
    if (!sub) {
      const res = await apiFetch('/notify/vapid')
      const { publicKey } = await res.json()
      if (!publicKey) return null
      const appServerKey = urlBase64ToUint8Array(publicKey)
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: appServerKey })
    }
    return sub.toJSON ? sub.toJSON() : sub
  } catch { return null }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

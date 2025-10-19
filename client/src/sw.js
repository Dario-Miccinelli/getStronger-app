/// <reference lib="WebWorker" />
/* eslint-disable no-restricted-globals */
import { precacheAndRoute } from 'workbox-precaching'
precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('push', (event) => {
  try {
    const data = event.data ? event.data.json() : {}
    const title = data.title || 'Get Stronger'
    const body = data.body || 'Notification'
    const tag = data.tag || 'getstronger'
    event.waitUntil(self.registration.showNotification(title, { body, tag, renotify: true }))
  } catch (e) {
    event.waitUntil(self.registration.showNotification('Get Stronger', { body: 'Notification', tag: 'getstronger' }))
  }
})

// Click handling: focus the app if it’s open
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil((async () => {
    const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true })
    if (allClients && allClients.length > 0) {
      const client = allClients[0]
      client.focus()
    } else {
      clients.openWindow('/')
    }
  })())
})

// Dynamic app icons (manifest + iOS apple-touch-icon) based on selected player
// Works in dev and prod; updates when 'player-change' is fired.

import Foto1 from '../assets/images/Foto1.png'
import Foto2 from '../assets/images/Foto2.png'
import { storage } from './storage'

function pickSrcByPlayer(playerId) {
  // '1' => Dario, '2' => Matteo
  return String(playerId) === '2' ? Foto2 : Foto1
}

function ensureLink(rel, { sizes, type } = {}) {
  let el = document.querySelector(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.rel = rel
    if (sizes) el.sizes = sizes
    if (type) el.type = type
    document.head.appendChild(el)
  }
  return el
}

async function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

async function toPngDataUrl(src, size) {
  const img = await loadImage(src)
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  // cover fit
  const scale = Math.max(size / img.width, size / img.height)
  const w = img.width * scale
  const h = img.height * scale
  const x = (size - w) / 2
  const y = (size - h) / 2
  ctx.drawImage(img, x, y, w, h)
  return canvas.toDataURL('image/png')
}

async function buildDynamicManifest(baseUrl, photoSrc) {
  try {
    const res = await fetch(`${baseUrl}manifest.webmanifest`, { cache: 'no-store' })
    const original = await res.json()
    const icon192 = await toPngDataUrl(photoSrc, 192)
    const icon512 = await toPngDataUrl(photoSrc, 512)
    const manifest = {
      ...original,
      icons: [
        { src: icon192, sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
        { src: icon512, sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      ],
    }
    const blob = new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' })
    return URL.createObjectURL(blob)
  } catch (e) {
    // Fallback: build a minimal manifest on the fly
    try {
      const icon192 = await toPngDataUrl(photoSrc, 192)
      const icon512 = await toPngDataUrl(photoSrc, 512)
      const manifest = {
        name: 'Get Stronger',
        short_name: 'Stronger',
        start_url: '/',
        display: 'standalone',
        background_color: '#0b1020',
        theme_color: '#0b1020',
        icons: [
          { src: icon192, sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: icon512, sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      }
      const blob = new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' })
      return URL.createObjectURL(blob)
    } catch {
      return null
    }
  }
}

async function applyIconsFor(playerId) {
  const photoSrc = pickSrcByPlayer(playerId)
  // iOS home screen icon
  const apple = ensureLink('apple-touch-icon', { sizes: '180x180' })
  try { apple.href = await toPngDataUrl(photoSrc, 180) } catch { apple.href = photoSrc }

  // Manifest icons (Android/Chrome A2HS)
  const baseUrl = (document.baseURI || '/').replace(/[^/]*$/, '')
  const manifestLink = document.querySelector('link[rel="manifest"]') || ensureLink('manifest')
  // Pre-attach a minimal valid manifest to avoid console parse errors
  try {
    const minimal = { name: 'Get Stronger', short_name: 'Stronger', start_url: '/', display: 'standalone', icons: [] }
    const blob = new Blob([JSON.stringify(minimal)], { type: 'application/manifest+json' })
    manifestLink.href = URL.createObjectURL(blob)
  } catch {}
  const dynHref = await buildDynamicManifest(baseUrl, photoSrc)
  if (dynHref) manifestLink.href = dynHref
}

export function setupDynamicIcons() {
  try {
    const current = storage.get() || '1'
    applyIconsFor(current)
  } catch {}
  // Update when player changes
  window.addEventListener('player-change', () => {
    try { applyIconsFor(storage.get() || '1') } catch {}
  })
}

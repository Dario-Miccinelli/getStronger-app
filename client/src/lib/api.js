// Centralized API base and fetch helper
// - In dev (localhost), default base is `/api` to use Vite proxy
// - In prod, default base points to the backend deployment domain
// - Can be overridden via Vite env: VITE_API_BASE

const PROD_API_BASE = 'https://getstrongerbe.vercel.app'

function isLocalhost(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.local')
}

const envBase = import.meta?.env?.VITE_API_BASE
let defaultBase = PROD_API_BASE
try {
  if (typeof window !== 'undefined' && isLocalhost(window.location.hostname)) {
    defaultBase = '/api'
  }
} catch (_) { /* noop for SSR/build */ }

export const API_BASE = envBase || defaultBase

export function apiUrl(path) {
  const p = path.startsWith('/') ? path : '/' + path
  return API_BASE + p
}

export function apiFetch(path, options) {
  return fetch(apiUrl(path), options)
}


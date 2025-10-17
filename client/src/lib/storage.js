// Safe storage helper with cookie fallback for iOS/Safari restrictions.
const KEY = 'playerSelection'

function supportsLocalStorage() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false
    const testKey = '__t__'
    window.localStorage.setItem(testKey, '1')
    window.localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

function setCookie(name, value, days = 180) {
  try {
    const d = new Date(); d.setTime(d.getTime() + days*24*60*60*1000)
    const expires = '; expires=' + d.toUTCString()
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value||'')}${expires}; path=/; SameSite=Lax`
  } catch {}
}

function getCookie(name) {
  try {
    const target = encodeURIComponent(name) + '='
    const parts = document.cookie.split('; ')
    for (const p of parts) {
      if (p.startsWith(target)) return decodeURIComponent(p.substring(target.length))
    }
  } catch {}
  return ''
}

export const storage = {
  get() {
    try {
      if (supportsLocalStorage()) return window.localStorage.getItem(KEY) || ''
    } catch {}
    return getCookie(KEY)
  },
  set(val) {
    try { if (supportsLocalStorage()) window.localStorage.setItem(KEY, String(val)) } catch {}
    setCookie(KEY, String(val))
  },
  clear() {
    try { if (supportsLocalStorage()) window.localStorage.removeItem(KEY) } catch {}
    setCookie(KEY, '', -1)
  }
}


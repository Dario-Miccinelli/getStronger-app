// Simple in-memory cache with TTL and prefix invalidation
const store = new Map()

function now() { return Date.now() }

function get(key) {
  const e = store.get(key)
  if (!e) return undefined
  if (e.expiresAt && e.expiresAt < now()) { store.delete(key); return undefined }
  return e.value
}

function set(key, value, ttlMs) {
  const expiresAt = ttlMs ? now() + ttlMs : undefined
  store.set(key, { value, expiresAt })
}

function del(key) { store.delete(key) }

function clearPrefix(prefix) {
  for (const k of store.keys()) {
    if (k.startsWith(prefix)) store.delete(k)
  }
}

module.exports = { get, set, del, clearPrefix }


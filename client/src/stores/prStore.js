import { defineStore } from 'pinia'

export const usePrStore = defineStore('pr', {
  state: () => ({
    data: {}, // { [playerId]: { [exerciseKey]: [ { ... } ] } }
    fetchedAt: {}, // { [playerId]: { [exerciseKey]: timestamp } }
    latest: {}, // { [playerId]: { [exerciseKey]: entry } }
    latestFetchedAt: {}, // { [playerId]: timestamp }
  }),
  actions: {
    getAll(playerId, exerciseKey) {
      const byPlayer = this.data[playerId] || {}
      const list = byPlayer[exerciseKey] || []
      return list.slice().sort((a, b) => new Date(a.dateISO) - new Date(b.dateISO))
    },
    async fetchAll(playerId, exerciseKey, { force = false } = {}) {
      const ttl = 2 * 60 * 1000
      const now = Date.now()
      if (!force && this.fetchedAt[playerId]?.[exerciseKey] && now - this.fetchedAt[playerId][exerciseKey] < ttl) return
      const res = await fetch(`/api/prs/${playerId}/${exerciseKey}`)
      const json = await res.json()
      if (!json.ok) throw new Error('Failed to load PRs')
      if (!this.data[playerId]) this.data[playerId] = {}
      if (!this.fetchedAt[playerId]) this.fetchedAt[playerId] = {}
      this.data[playerId][exerciseKey] = json.data || []
      this.fetchedAt[playerId][exerciseKey] = now
    },
    async add(playerId, exerciseKey, entry) {
      const res = await fetch('/api/prs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, exerciseKey, ...entry })
      })
      const json = await res.json()
      if (!json.ok) throw new Error('Failed to add PR')
      if (!this.data[playerId]) this.data[playerId] = {}
      if (!this.data[playerId][exerciseKey]) this.data[playerId][exerciseKey] = []
      this.data[playerId][exerciseKey].push(json.data)
      // Invalidate latest cache for this player
      delete this.latest[playerId]
      delete this.latestFetchedAt[playerId]
      if (this.fetchedAt[playerId]) delete this.fetchedAt[playerId][exerciseKey]
    },
    clearAll() {
      this.data = {}
      this.fetchedAt = {}
      this.latest = {}
      this.latestFetchedAt = {}
    },
    async fetchLatest(playerId, { force = false } = {}) {
      const ttl = 2 * 60 * 1000
      const now = Date.now()
      if (!force && this.latestFetchedAt[playerId] && now - this.latestFetchedAt[playerId] < ttl) return
      // Aggregate in one call using list endpoint, server returns newest first
      const res = await fetch(`/api/prs?playerId=${encodeURIComponent(playerId)}&limit=500`)
      const json = await res.json()
      if (!json.ok) throw new Error('Failed to load latest PRs')
      const map = {}
      for (const e of json.data || []) {
        if (!map[e.exerciseKey]) map[e.exerciseKey] = e
      }
      this.latest[playerId] = map
      this.latestFetchedAt[playerId] = now
    },
  },
})

export const EXERCISES = [
  { key: 'deadlift', label: 'Deadlift' },
  { key: 'bench_press', label: 'Bench Press' },
  { key: 'incline_bench', label: 'Incline Bench Press' },
  { key: 'leg_press', label: 'Leg Press' },
  { key: 'lat_pulldown', label: 'Lat Pulldown' },
  { key: 'barbell_ohp', label: 'Barbell Overhead Press' },
]

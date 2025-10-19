import { defineStore } from 'pinia'
import { apiFetch } from '../lib/api'

export interface PrEntry {
  dateISO: string
  weight: number
  reps: number
  rpe: number
  exerciseKey?: string
}

type PrMap = Record<string, Record<string, PrEntry[]>>
type TimeMap = Record<string, Record<string, number>>
type LatestMap = Record<string, Record<string, PrEntry>>

interface State {
  data: PrMap
  fetchedAt: TimeMap
  latest: LatestMap
  latestFetchedAt: Record<string, number>
}

export const usePrStore = defineStore('pr', {
  state: (): State => ({
    data: {},
    fetchedAt: {},
    latest: {},
    latestFetchedAt: {},
  }),
  actions: {
    getAll(playerId: string, exerciseKey: string) {
      const byPlayer = this.data[playerId] || {}
      const list = byPlayer[exerciseKey] || []
      return list.slice().sort((a, b) => new Date(a.dateISO).getTime() - new Date(b.dateISO).getTime())
    },
    async fetchAll(playerId: string, exerciseKey: string, { force = false }: { force?: boolean } = {}) {
      const ttl = 2 * 60 * 1000
      const now = Date.now()
      if (!force && this.fetchedAt[playerId]?.[exerciseKey] && now - this.fetchedAt[playerId][exerciseKey] < ttl) return
      const res = await apiFetch(`/prs/${playerId}/${exerciseKey}`)
      const json = await res.json()
      if (!json.ok) throw new Error('Failed to load PRs')
      if (!this.data[playerId]) this.data[playerId] = {}
      if (!this.fetchedAt[playerId]) this.fetchedAt[playerId] = {}
      this.data[playerId][exerciseKey] = (json.data || []) as PrEntry[]
      this.fetchedAt[playerId][exerciseKey] = now
    },
    async add(playerId: string, exerciseKey: string, entry: Partial<PrEntry>) {
      const res = await apiFetch('/prs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, exerciseKey, ...entry })
      })
      const json = await res.json()
      if (!json.ok) throw new Error('Failed to add PR')
      if (!this.data[playerId]) this.data[playerId] = {}
      if (!this.data[playerId][exerciseKey]) this.data[playerId][exerciseKey] = []
      this.data[playerId][exerciseKey].push(json.data as PrEntry)
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
    async fetchLatest(playerId: string, { force = false }: { force?: boolean } = {}) {
      const ttl = 2 * 60 * 1000
      const now = Date.now()
      if (!force && this.latestFetchedAt[playerId] && now - this.latestFetchedAt[playerId] < ttl) return
      const res = await apiFetch(`/prs?playerId=${encodeURIComponent(playerId)}&limit=500`)
      const json = await res.json()
      if (!json.ok) throw new Error('Failed to load latest PRs')
      const map: Record<string, PrEntry> = {}
      for (const e of (json.data || []) as PrEntry[]) {
        const key = String((e as any).exerciseKey || '')
        if (key && !map[key]) map[key] = e
      }
      this.latest[playerId] = map
      this.latestFetchedAt[playerId] = now
    },
  },
})

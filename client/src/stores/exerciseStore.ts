import { defineStore } from 'pinia'
import { apiFetch } from '../lib/api'

export interface Exercise {
  exerciseKey: string
  label: string
}

interface State {
  items: Exercise[]
  fetchedAt: number
}

export const useExerciseStore = defineStore('exercises', {
  state: (): State => ({
    items: [],
    fetchedAt: 0,
  }),
  actions: {
    async fetchAll({ force = false }: { force?: boolean } = {}) {
      const ttl = 2 * 60 * 1000
      const now = Date.now()
      if (!force && this.fetchedAt && now - this.fetchedAt < ttl && this.items.length) return
      const res = await apiFetch('/exercises')
      const json = await res.json()
      if (!json.ok) throw new Error('Failed to load exercises')
      this.items = (json.data || []) as Exercise[]
      this.fetchedAt = now
    },
    async add(label: string) {
      const res = await apiFetch('/exercises', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label })
      })
      if ((res as any).status === 409) {
        const json: any = await res.json().catch(() => ({}))
        const err: any = new Error(json?.error || 'Exercise already exists')
        err.code = 'already_exists'
        throw err
      }
      const json = await res.json()
      if (!json.ok) throw new Error('Failed to add exercise')
      this.items.push(json.data as Exercise)
      this.fetchedAt = 0
      return json.data as Exercise
    }
  }
})


import { defineStore } from 'pinia'

export const useExerciseStore = defineStore('exercises', {
  state: () => ({
    items: [], // [{ exerciseKey, label }]
    fetchedAt: 0,
  }),
  actions: {
    async fetchAll({ force = false } = {}) {
      const ttl = 2 * 60 * 1000
      const now = Date.now()
      if (!force && this.fetchedAt && now - this.fetchedAt < ttl && this.items.length) return
      const res = await fetch('/api/exercises')
      const json = await res.json()
      if (!json.ok) throw new Error('Failed to load exercises')
      this.items = json.data || []
      this.fetchedAt = now
    },
    async add(label) {
      const res = await fetch('/api/exercises', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label })
      })
      if (res.status === 409) {
        const json = await res.json().catch(() => ({}))
        const err = new Error(json?.error || 'Exercise already exists')
        err.code = 'already_exists'
        throw err
      }
      const json = await res.json()
      if (!json.ok) throw new Error('Failed to add exercise')
      this.items.push(json.data)
      this.fetchedAt = 0 // invalidate cache so next fetch refreshes
      return json.data
    }
  }
})

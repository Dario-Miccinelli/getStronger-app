import { defineStore } from 'pinia'

export interface TimerState {
  running: boolean
  startedAt?: number
  duration?: number
  remaining?: number
}

type TimerMap = Record<string, Record<string, Record<string, TimerState>>>
type SetsMap = Record<string, Record<string, Record<string, number>>>

interface State {
  timers: TimerMap
  sets: SetsMap
}

export const useWorkoutStore = defineStore('workout', {
  state: (): State => ({
    timers: {},
    sets: {},
  }),
  actions: {
    getTimer(playerId: string, planKey: string, itemSlug: string): TimerState | null {
      return this.timers?.[playerId]?.[planKey]?.[itemSlug] || null
    },
    setTimer(playerId: string, planKey: string, itemSlug: string, next: TimerState) {
      if (!this.timers[playerId]) this.timers[playerId] = {}
      if (!this.timers[playerId][planKey]) this.timers[playerId][planKey] = {}
      this.timers[playerId][planKey][itemSlug] = next
    },
    clearTimer(playerId: string, planKey: string, itemSlug: string) {
      const root = this.timers
      if (root[playerId]?.[planKey]?.[itemSlug]) delete root[playerId][planKey][itemSlug]
      if (root[playerId]?.[planKey] && Object.keys(root[playerId][planKey]).length === 0) delete root[playerId][planKey]
      if (root[playerId] && Object.keys(root[playerId]).length === 0) delete root[playerId]
    },
    isRunning(playerId: string, planKey: string, itemSlug: string): boolean {
      return !!this.getTimer(playerId, planKey, itemSlug)?.running
    },
    remainingSec(playerId: string, planKey: string, itemSlug: string, fallbackSec: number): number {
      const st = this.getTimer(playerId, planKey, itemSlug)
      if (!st) return fallbackSec
      if (!st.running) return Number(st.remaining ?? fallbackSec)
      const elapsed = Math.floor((Date.now() - (st.startedAt || 0)) / 1000)
      const base = Number(st.duration || 0)
      return Math.max(0, base - elapsed)
    },
    startTimer(playerId: string, planKey: string, itemSlug: string, durationSec: number) {
      this.setTimer(playerId, planKey, itemSlug, { running: true, startedAt: Date.now(), duration: durationSec })
    },
    pauseTimer(playerId: string, planKey: string, itemSlug: string, remainingSec: number) {
      const cur = this.getTimer(playerId, planKey, itemSlug) || { running: false }
      this.setTimer(playerId, planKey, itemSlug, { ...cur, running: false, remaining: Number(remainingSec || 0) })
    },
    resetTimer(playerId: string, planKey: string, itemSlug: string, remainingSec: number) {
      const cur = this.getTimer(playerId, planKey, itemSlug) || { running: false }
      this.setTimer(playerId, planKey, itemSlug, { ...cur, running: false, remaining: Number(remainingSec || 0) })
    },
    finishTimer(playerId: string, planKey: string, itemSlug: string) {
      const cur = this.getTimer(playerId, planKey, itemSlug) || { running: false }
      this.setTimer(playerId, planKey, itemSlug, { ...cur, running: false, remaining: 0 })
    },

    getSets(playerId: string, planKey: string, itemSlug: string): number {
      return Number(this.sets?.[playerId]?.[planKey]?.[itemSlug] || 0)
    },
    setSets(playerId: string, planKey: string, itemSlug: string, n: number) {
      if (!this.sets[playerId]) this.sets[playerId] = {}
      if (!this.sets[playerId][planKey]) this.sets[playerId][planKey] = {}
      this.sets[playerId][planKey][itemSlug] = Number(n || 0)
    },
    incSets(playerId: string, planKey: string, itemSlug: string, target?: number) {
      const cur = this.getSets(playerId, planKey, itemSlug)
      const next = target ? Math.min(cur + 1, target) : cur + 1
      this.setSets(playerId, planKey, itemSlug, next)
    },

    clearPlan(playerId: string, planKey: string) {
      // Clear timers
      if (this.timers[playerId]?.[planKey]) delete this.timers[playerId][planKey]
      if (this.timers[playerId] && Object.keys(this.timers[playerId]).length === 0) delete this.timers[playerId]
      // Clear sets
      if (this.sets[playerId]?.[planKey]) delete this.sets[playerId][planKey]
      if (this.sets[playerId] && Object.keys(this.sets[playerId]).length === 0) delete this.sets[playerId]
    },
  },
  persist: {
    key: 'workoutStateByPlayer',
    paths: ['timers', 'sets'],
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  } as any,
})


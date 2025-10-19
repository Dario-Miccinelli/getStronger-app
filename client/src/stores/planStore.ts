import { defineStore } from 'pinia'

export interface PlanItem {
  label: string
  scheme: string
  note?: string
  restMinSec?: number
  restMaxSec?: number
  optional?: boolean
}

export interface Plan {
  key: string
  name: string
  heading: string
  items: PlanItem[]
}

interface State {
  selectedKey: string
  selectedByPlayer: Record<string, string>
  plans: Plan[]
}

export const usePlanStore = defineStore('plans', {
  state: (): State => ({
    selectedKey: '',
    selectedByPlayer: {},
    // Strongman 3-day template using only existing exercises
    plans: [
      {
        key: 'day_a_press',
        name: 'Day A - Overhead/Press',
        heading: 'DAY A - OVERHEAD / PRESS',
        items: [
          { label: 'Barbell Overhead Press', scheme: '5x3 @ RPE 8', restMinSec: 180 },
          { label: 'Incline Bench Press', scheme: '4x6 @ RPE 7.5-8', restMinSec: 120 },
          { label: 'Lat Pulldown', scheme: '4x8 @ RPE 7-8', restMinSec: 90 },
          { label: 'Bench Press', scheme: '6x3 @ RPE 6-7', restMinSec: 60 },
        ],
      },
      {
        key: 'day_b_deadlift',
        name: 'Day B - Deadlift + Legs',
        heading: 'DAY B - DEADLIFT + LEGS',
        items: [
          { label: 'Deadlift', scheme: '3x3 @-10% PR - RPE 9', restMinSec: 180 },
          { label: 'Leg Press', scheme: '4x10 @ RPE 8', restMinSec: 120 },
          { label: 'Lat Pulldown', scheme: '2x10 @ RPE 7', restMinSec: 60 },
        ],
      },
      {
        key: 'day_c_bench_legs',
        name: 'Day C - Bench + Legs',
        heading: 'DAY C - BENCH + LEGS',
        items: [
          { label: 'Bench Press', scheme: '5x5 @ RPE 8', restMinSec: 150 },
          { label: 'Barbell Overhead Press', scheme: '3x8 @ RPE 7', restMinSec: 120 },
          { label: 'Leg Press', scheme: '4x10 @ RPE 8', restMinSec: 120 },
        ],
      },
    ],
  }),
  getters: {
    selected(state) {
      return state.plans.find(p => p.key === state.selectedKey) || null
    },
  },
  actions: {
    loadForPlayer(playerId: string) {
      const id = String(playerId || '')
      this.selectedKey = this.selectedByPlayer[id] || ''
    },
    selectForPlayer(playerId: string, key: string) {
      const id = String(playerId || '')
      const v = key || ''
      this.selectedKey = v
      this.selectedByPlayer = { ...this.selectedByPlayer, [id]: v }
    },
    clearForPlayer(playerId: string) {
      const id = String(playerId || '')
      this.selectedKey = ''
      const next = { ...this.selectedByPlayer }
      delete next[id]
      this.selectedByPlayer = next
    },
  },
  persist: {
    key: 'selectedPlanByPlayer',
    pick: ['selectedByPlayer'],
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
})

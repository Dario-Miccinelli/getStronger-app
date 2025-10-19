import { defineStore } from 'pinia'

export const usePlanStore = defineStore('plans', {
  state: () => ({
    selectedKey: '',
    // Strongman 3-day template using only existing exercises
    plans: [
      {
        key: 'day_a_press',
        name: 'Day A - Overhead/Press',
        heading: 'DAY A - OVERHEAD / PRESS',
        items: [
          {
            label: 'Barbell Overhead Press',
            scheme: '5x3 @ RPE 8',
            note: 'Stop with clean aggression. No grinding reps.',
            restMinSec: 180, restMaxSec: 300,
          },
          {
            label: 'Incline Bench Press',
            scheme: '4x6 @ RPE 7.5-8',
            note: '',
            restMinSec: 120, restMaxSec: 180,
          },
          {
            label: 'Lat Pulldown',
            scheme: '4x8-12 @ RPE 7-8',
            note: 'Control the scapula. No swinging.',
            restMinSec: 90, restMaxSec: 120,
          },
          {
            label: 'Bench Press',
            scheme: 'Speed/technique - 6x3 @ RPE 6-7',
            note: 'Identical bar path. Explosive but clean.',
            restMinSec: 60, restMaxSec: 90,
          },
        ],
      },
      {
        key: 'day_b_deadlift',
        name: 'Day B - Deadlift + Legs',
        heading: 'DAY B - DEADLIFT + LEGS',
        items: [
          {
            label: 'Deadlift',
            scheme: 'Ramp-up to 3-4 reps top set @ RPE 8-8.5\nThen 3x3 back-off at -10% (~RPE 7-7.5)',
            note: '',
            restMinSec: 180, restMaxSec: 300,
          },
          {
            label: 'Leg Press',
            scheme: '4x10 @ RPE 8',
            note: 'Last reps slow and controlled. Full ROM.',
            restMinSec: 120, restMaxSec: 120,
          },
          {
            label: 'Lat Pulldown',
            scheme: 'Optional 2x10 @ RPE 7',
            note: 'Optional back work - keep rest short.',
            restMinSec: 60, restMaxSec: 90, optional: true,
          },
        ],
      },
      {
        key: 'day_c_bench_legs',
        name: 'Day C - Bench + Legs',
        heading: 'DAY C - BENCH + LEGS',
        items: [
          {
            label: 'Bench Press',
            scheme: '5x5 @ RPE 8 (last set)',
            note: '0.5-1 s micro-pause on chest for stability.',
            restMinSec: 150, restMaxSec: 180,
          },
          {
            label: 'Barbell Overhead Press',
            scheme: 'Technique/volume - 3x8 @ RPE 7',
            note: 'Elbows under the bar. Vertical path.',
            restMinSec: 120, restMaxSec: 120,
          },
          {
            label: 'Leg Press',
            scheme: '4x10 @ RPE 8',
            note: 'Last 2-3 reps controlled and nasty (in a good way).',
            restMinSec: 120, restMaxSec: 120,
          },
        ],
      },
    ],
  }),
  getters: {
    selected(state) { return state.plans.find(p => p.key === state.selectedKey) || null },
  },
  actions: {
    select(key) { this.selectedKey = key || '' },
    clear() { this.selectedKey = '' },
  },
})

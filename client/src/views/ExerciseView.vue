<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePrStore } from '../stores/prStore'
import { useExerciseStore } from '../stores/exerciseStore'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS, LineElement, PointElement, LinearScale, TimeScale, CategoryScale, Tooltip, Legend
} from 'chart.js'

ChartJS.register(LineElement, PointElement, LinearScale, TimeScale, CategoryScale, Tooltip, Legend)

const pr = usePrStore()
const route = useRoute()
const router = useRouter()

const exerciseKey = computed(() => String(route.params.key || ''))
const exerciseStore = useExerciseStore()
const exercise = computed(() => exerciseStore.items.find(e => e.exerciseKey === exerciseKey.value))

const playerId = ref(localStorage.getItem('playerSelection') || '')

const entries = computed(() => pr.getAll(playerId.value, exerciseKey.value))

const weights = computed(() => entries.value.map(e => e.weight))
function niceStep(range) {
  if (!isFinite(range) || range <= 0) return 5
  const rough = range / 6 // aim for ~6 ticks
  const order = Math.pow(10, Math.floor(Math.log10(rough)))
  const base = rough / order
  let nice
  if (base <= 1) nice = 1
  else if (base <= 2) nice = 2
  else if (base <= 2.5) nice = 2.5
  else if (base <= 5) nice = 5
  else nice = 10
  return Math.max(2, nice * order)
}

const yStats = computed(() => {
  const arr = weights.value
  if (!arr.length) return { min: 0, max: 50, step: 10 }
  let min = Math.min(...arr)
  let max = Math.max(...arr)
  if (min === max) {
    const step = niceStep(Math.max(10, max))
    const minB = Math.max(0, Math.floor((min - 2 * step) / step) * step)
    const maxB = Math.ceil((max + 2 * step) / step) * step
    return { min: minB, max: maxB, step }
  }
  const minRange = 20
  const range = Math.max(minRange, max - min)
  const step = niceStep(range)
  // expand to step boundaries and add one step padding on both sides
  const minB = Math.max(0, Math.floor(min / step) * step - step)
  const maxB = Math.ceil(max / step) * step + step
  return { min: minB, max: maxB, step }
})

const chartData = computed(() => ({
  labels: entries.value.map(e => new Date(e.dateISO).toLocaleDateString()),
  datasets: [{
    label: 'Weight (kg)',
    data: weights.value,
    borderColor: '#60a5fa',
    backgroundColor: 'rgba(96,165,250,.15)',
    tension: .3,
    spanGaps: true,
    fill: true,
    pointRadius: 3,
  }],
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { display: true, grid: { display: false } },
    y: {
      display: true,
      grid: { color: 'rgba(255,255,255,.08)' },
      min: yStats.value.min,
      max: yStats.value.max,
      ticks: {
        stepSize: yStats.value.step,
      },
    },
  },
}))

const weightInput = ref('')
const repsInput = ref('')
const rpeInput = ref('')

async function saveEntry() {
  if (!weightInput.value) return
  await pr.add(playerId.value, exerciseKey.value, {
    weight: Number(weightInput.value),
    reps: Number(repsInput.value || 1),
    rpe: Number(rpeInput.value || 0),
  })
  weightInput.value = ''
  repsInput.value = ''
  rpeInput.value = ''
}

function goBack() { router.push({ name: 'exercises' }) }
async function load() {
  try {
    if (exerciseStore.items.length === 0) await exerciseStore.fetchAll()
    if (playerId.value && exerciseKey.value) {
      await pr.fetchAll(playerId.value, exerciseKey.value, { force: true })
    }
  } catch {}
}

onMounted(load)
watch(() => route.params.key, load)
</script>

<template>
  <section class="exercise-page">
    <header class="topbar">
      <button class="back" @click="goBack" aria-label="Back">←</button>
      <h2 class="title">{{ exercise?.label }}</h2>
      <span class="spacer" />
    </header>

    <div class="chart-wrap">
      <Line :data="chartData" :options="chartOptions" />
    </div>

    <form class="form" @submit.prevent="saveEntry">
      <label>
        <span>Weight (kg)</span>
        <input type="number" step="0.5" min="0" v-model="weightInput" required inputmode="decimal" />
      </label>
      <label>
        <span>Reps</span>
        <input type="number" step="1" min="1" v-model="repsInput" inputmode="numeric" />
      </label>
      <label>
        <span>RPE</span>
        <input type="number" step="0.5" min="0" max="10" v-model="rpeInput" inputmode="decimal" />
      </label>
      <button type="submit" class="save">Save PR</button>
    </form>

    <ul class="list">
      <li v-for="(e, idx) in entries.slice(-10).reverse()" :key="idx">
        <span class="date">{{ new Date(e.dateISO).toLocaleDateString() }}</span>
        <span class="val">{{ e.weight }} kg × {{ e.reps }} reps · RPE {{ e.rpe }}</span>
      </li>
    </ul>
  </section>
</template>

<style scoped lang="scss">
.exercise-page {
  display: grid;
  gap: 1rem;
  padding: max(1rem, env(safe-area-inset-top)) 1rem max(1rem, env(safe-area-inset-bottom));
}

.topbar {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: .5rem;
}
.back {
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.12);
  color: #e5e7eb;
  border-radius: 10px;
  padding: .4rem .6rem;
}
.title { margin: 0; text-align: center; font-size: 1.1rem; }
.spacer { width: 32px; }

.chart-wrap { height: clamp(180px, 45vh, 340px); width: 100%; overflow: hidden; }

.form {
  display: grid;
  grid-template-columns: minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) auto;
  gap: .5rem;
  label { display: flex; flex-direction: column; gap: .25rem; }
  span { font-size: .8rem; opacity: .75; }
  input {
    background: #111827;
    color: #e5e7eb;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.12);
    padding: .6rem .7rem;
  }
  .save {
    background: #2563eb;
    color: white;
    border: none;
    border-radius: 10px;
    font-weight: 700;
    padding: .6rem .9rem;
  }
  @media (max-width: 480px) {
    grid-template-columns: minmax(0,1fr) minmax(0,1fr);
    .save { grid-column: 1 / -1; }
  }
}

.list {
  list-style: none; margin: 0; padding: 0; display: grid; gap: .5rem;
  li { display: grid; grid-template-columns: 120px 1fr; gap: .5rem; }
  .date { opacity: .7; }
  .val { font-weight: 600; }
  @media (max-width: 480px) { li { grid-template-columns: 1fr; } }
}
</style>

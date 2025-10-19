<script setup>
import { ref, onMounted, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useExerciseStore } from '../stores/exerciseStore'
import { usePrStore } from '../stores/prStore'
import { usePlanStore } from '../stores/planStore'
import { storage } from '../lib/storage'
import Foto1 from '../assets/images/Foto1.png'
import Foto2 from '../assets/images/Foto2.png'
import NewExerciseModal from '../components/NewExerciseModal.vue'
import RestTimer from '../components/RestTimer.vue'

const playerName = ref('')
const playerImage = ref('')
const playerId = ref('')
const showNew = ref(false)

const exercises = useExerciseStore()
const pr = usePrStore()
const plans = usePlanStore()
const selectedKey = computed({ get: () => plans.selectedKey, set: (v) => { plans.selectedKey = v || '' } })

function loadPlayer() {
  const saved = storage.get()
  playerId.value = saved
  if (saved === '1') { playerName.value = 'Dario'; playerImage.value = Foto1 }
  else if (saved === '2') { playerName.value = 'Matteo'; playerImage.value = Foto2 }
}

onMounted(async () => {
  loadPlayer()
  await exercises.fetchAll({ force: true })
  await pr.fetchLatest(playerId.value, { force: true })
  // Default to "No program" on entry
  plans.clear()
})

const latestByExercise = computed(() => pr.latest[playerId.value] || {})

const planOptions = computed(() => [{ key: '', name: 'No program' }, ...plans.plans])
function slug(s) {
  if (s == null) return ''
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
}
const planMapByLabel = computed(() => {
  const map = new Map()
  for (const it of exercises.items) map.set(slug(it.label), it)
  return map
})
const selectedPlan = computed(() => plans.plans.find(p => p.key === plans.selectedKey) || null)

const filteredPlanItems = computed(() => {
  const sp = selectedPlan.value
  if (!sp || !Array.isArray(sp.items)) return []
  const mm = planMapByLabel.value
  return sp.items.filter(it => it && typeof it.label === 'string' && mm.has(slug(it.label)))
})

const missingFromPlan = computed(() => {
  const sp = selectedPlan.value
  if (!sp) return []
  const mm = planMapByLabel.value
  return (sp.items || []).filter(it => it && typeof it.label === 'string' && !mm.has(slug(it.label)))
})

const visibleExercises = computed(() => {
  const sp = selectedPlan.value
  if (!sp) return exercises.items
  const mm = planMapByLabel.value
  return filteredPlanItems.value.map(it => mm.get(slug(it.label)))
})

const runningTimers = ref({})
function startTimerFor(label) { runningTimers.value[slug(label)] = true }
function stopTimerFor(label) { runningTimers.value[slug(label)] = false }

function secsToMinLabel(sec) {
  const m = sec / 60
  return Math.abs(m - Math.round(m)) < 0.01 ? String(Math.round(m)) : m.toFixed(1).replace(/\.0$/, '')
}
function restDefaultSec(it) {
  const a = Number(it.restMinSec ?? it.restSec ?? 90)
  const b = Number(it.restMaxSec ?? it.restSec ?? a)
  return Math.round((a + b) / 2)
}
function restRangeLabel(it) {
  const a = Number(it.restMinSec ?? it.restSec ?? 90)
  const b = Number(it.restMaxSec ?? it.restSec ?? a)
  return a === b ? `${secsToMinLabel(a)} min` : `${secsToMinLabel(a)}-${secsToMinLabel(b)} min`
}

async function addMissingExercises() {
  if (!selectedPlan.value) return
  for (const it of missingFromPlan.value) {
    try { await exercises.add(it.label) } catch {}
  }
}
</script>

<template>
  <section class="home">
    <div class="hero">
      <RouterLink
        v-if="playerImage"
        :to="{ name: 'admin', params: { playerId } }"
        class="hero__avatar-link"
        title="Open admin for this player"
      >
        <img :src="playerImage" :alt="playerName" class="hero__avatar" />
      </RouterLink>
      <div class="hero__text">
        <h2 class="title">Welcome back, {{ playerName }}!</h2>
        <p class="subtitle">Choose an exercise to view and add PRs.</p>
      </div>
      <button class="add-btn" @click="showNew = true" aria-label="Create new exercise">+</button>
    </div>

    <div class="program-controls" role="region" aria-label="Programs">
      <label class="pc-label">
        <span>Program</span>
        <select v-model="plans.selectedKey">
          <option v-for="p in planOptions" :key="p.key" :value="p.key">{{ p.name }}</option>
        </select>
      </label>
      <button v-if="plans.selectedKey" class="pc-clear" @click="plans.clear()" aria-label="Clear program">Clear</button>
    </div>

    <div v-if="selectedPlan" class="plan-panel" role="region" aria-label="Selected program">
      <div class="plan-header">{{ selectedPlan.heading }}</div>
      <div class="plan-grid">
        <div v-for="(it, idx) in filteredPlanItems" :key="idx" class="plan-card">
          <div class="pc-top">
            <div class="pc-title">{{ it.label }}</div>
            <div class="pc-rest">Rest: {{ restRangeLabel(it) }}</div>
          </div>
          <div class="pc-scheme">{{ it.scheme }}</div>
          <div class="pc-note" v-if="it.note">{{ it.note }}</div>
          <div class="pc-actions">
            <RouterLink v-if="planMapByLabel.get(slug(it.label))" class="pc-open" :to="{ name: 'exercise', params: { key: planMapByLabel.get(slug(it.label)).exerciseKey } }">Open</RouterLink>
            <button class="pc-done" @click="startTimerFor(it.label)">REST</button>
          </div>
          <div class="pc-timer" v-if="runningTimers[slug(it.label)]">
            <RestTimer :label="it.label" :duration="restDefaultSec(it)" :autoStart="true" compact @finished="stopTimerFor(it.label)" />
          </div>
        </div>
      </div>
      <button v-if="missingFromPlan.length" class="pc-add-missing" @click="addMissingExercises">
        Add missing exercises ({{ missingFromPlan.length }})
      </button>
    </div>

    <nav class="list">
      <RouterLink
        v-for="ex in (selectedPlan ? exercises.items.filter(e => selectedPlan.items.some(pi => slug(pi.label) === slug(e.label))) : exercises.items)"
        :key="ex.exerciseKey"
        class="list__item"
        :to="{ name: 'exercise', params: { key: ex.exerciseKey } }"
      >
        <span class="name">{{ ex.label }}</span>
        <span class="latest" v-if="latestByExercise[ex.exerciseKey]">
          {{ latestByExercise[ex.exerciseKey].weight }} kg - {{ latestByExercise[ex.exerciseKey].reps }}
        </span>
      </RouterLink>
    </nav>

    <NewExerciseModal v-if="showNew" @close="showNew = false" />
  </section>
</template>

<style scoped lang="scss" src="./styles/HomeView.scss"></style>

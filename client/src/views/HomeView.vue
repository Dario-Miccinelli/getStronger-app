<script setup>
import { ref, onMounted, onActivated, onBeforeUnmount, computed } from 'vue'
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
const selectedKey = computed({ get: () => plans.selectedKey, set: (v) => { plans.selectForPlayer(playerId.value, v || '') } })

function loadPlayer() {
  const saved = storage.get()
  playerId.value = saved
  if (saved === '1') { playerName.value = 'Dario'; playerImage.value = Foto1 }
  else if (saved === '2') { playerName.value = 'Matteo'; playerImage.value = Foto2 }
}

onMounted(async () => {
  loadPlayer()
  plans.loadForPlayer(playerId.value)
  await exercises.fetchAll({ force: true })
  await pr.fetchLatest(playerId.value, { force: true })
  reloadPersisted()
})

function onPlayerChange() {
  loadPlayer()
  plans.loadForPlayer(playerId.value)
  try { pr.fetchLatest(playerId.value, { force: true }) } catch {}
  reloadPersisted()
}

onActivated(() => { onPlayerChange() })
onBeforeUnmount(() => { try { window.removeEventListener('player-change', onPlayerChange) } catch {} })
try { window.addEventListener('player-change', onPlayerChange) } catch {}

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

// Persistence helpers (localStorage)
const TIMERS_KEY = 'restTimersByPlayer_v2'
const SETS_KEY = 'setsDoneByPlayer_v2'
function loadJSON(key) {
  try { return JSON.parse(window.localStorage.getItem(key) || '{}') || {} } catch { return {} }
}
function saveJSON(key, val) {
  try { window.localStorage.setItem(key, JSON.stringify(val || {})) } catch {}
}

const timersStore = ref(loadJSON(TIMERS_KEY))
const setsStore = ref(loadJSON(SETS_KEY))

function planKey() { return String(plans.selectedKey || 'none') }
function itemSlug(it) { return slug(it.label) }

function getTimerState(it) {
  const p = String(playerId.value || '')
  const pk = planKey()
  return timersStore.value?.[p]?.[pk]?.[itemSlug(it)] || null
}
function setTimerState(it, next) {
  const p = String(playerId.value || '')
  const pk = planKey()
  const s = itemSlug(it)
  const root = { ...(timersStore.value || {}) }
  if (!root[p]) root[p] = {}
  if (!root[p][pk]) root[p][pk] = {}
  root[p][pk][s] = next
  timersStore.value = root
  saveJSON(TIMERS_KEY, root)
}
function clearTimerState(it) {
  const p = String(playerId.value || '')
  const pk = planKey()
  const s = itemSlug(it)
  const root = { ...(timersStore.value || {}) }
  if (root[p]?.[pk]?.[s]) delete root[p][pk][s]
  timersStore.value = root
  saveJSON(TIMERS_KEY, root)
}

function isTimerRunning(it) {
  const st = getTimerState(it)
  if (!st) return false
  if (!st.running) return false
  const elapsed = Math.floor((Date.now() - (st.startedAt || 0)) / 1000)
  const base = Number(st.duration || 0)
  return base - elapsed > 0
}
function remainingSecFor(it) {
  const st = getTimerState(it)
  if (!st) return restDefaultSec(it)
  if (!st.running) return Number(st.remaining || restDefaultSec(it))
  const elapsed = Math.floor((Date.now() - (st.startedAt || 0)) / 1000)
  const base = Number(st.duration || 0)
  return Math.max(0, base - elapsed)
}
function startTimerFor(it) {
  const dur = restDefaultSec(it)
  setTimerState(it, { running: true, startedAt: Date.now(), duration: dur })
}
function stopTimerFor(it) {
  const st = getTimerState(it)
  if (!st) return clearTimerState(it)
  setTimerState(it, { ...st, running: false, remaining: 0 })
}

// Sets tracking per plan item (by plan key + label slug)
function itemKey(it) { return `${String(playerId.value||'') }__${plans.selectedKey || 'none'}__${slug(it.label)}` }
function targetSets(it) {
  const m = String(it.scheme || '').match(/(\d+)\s*x\s*\d+/i)
  return m ? Number(m[1]) : null
}
function setsDoneFor(it) {
  const p = String(playerId.value || '')
  const pk = planKey()
  const s = itemSlug(it)
  return Number(setsStore.value?.[p]?.[pk]?.[s] || 0)
}
function setSetsDone(it, n) {
  const p = String(playerId.value || '')
  const pk = planKey()
  const s = itemSlug(it)
  const root = { ...(setsStore.value || {}) }
  if (!root[p]) root[p] = {}
  if (!root[p][pk]) root[p][pk] = {}
  root[p][pk][s] = Number(n || 0)
  setsStore.value = root
  saveJSON(SETS_KEY, root)
}
function incSetFor(it) {
  const tgt = targetSets(it)
  const cur = setsDoneFor(it)
  const next = tgt ? Math.min(cur + 1, tgt) : cur + 1
  setSetsDone(it, next)
}
function onRestClick(it) { incSetFor(it); startTimerFor(it) }

function onTimerFinished(it) {
  stopTimerFor(it)
}
function onTimerPaused(it, e) {
  const st = getTimerState(it) || {}
  setTimerState(it, { ...st, running: false, remaining: Number(e?.remaining || 0) })
}
function onTimerReset(it, e) {
  const st = getTimerState(it) || {}
  setTimerState(it, { ...st, running: false, remaining: Number(e?.remaining || restDefaultSec(it)) })
}
function onTimerStarted(it, e) {
  const rem = Number(e?.remaining || restDefaultSec(it))
  setTimerState(it, { running: true, startedAt: Date.now(), duration: rem })
}

// Sync on player/program changes
function reloadPersisted() {
  // triggers recompute via refs; nothing else needed
  timersStore.value = loadJSON(TIMERS_KEY)
  setsStore.value = loadJSON(SETS_KEY)
}

function resetAll() {
  const p = String(playerId.value || '')
  const pk = planKey()
  // Clear timers for this player
  const tRoot = { ...(timersStore.value || {}) }
  if (tRoot[p]?.[pk]) {
    delete tRoot[p][pk]
    if (Object.keys(tRoot[p]).length === 0) delete tRoot[p]
  }
  timersStore.value = tRoot
  saveJSON(TIMERS_KEY, tRoot)
  // Clear sets for this player
  const sRoot = { ...(setsStore.value || {}) }
  if (sRoot[p]?.[pk]) {
    delete sRoot[p][pk]
    if (Object.keys(sRoot[p]).length === 0) delete sRoot[p]
  }
  setsStore.value = sRoot
  saveJSON(SETS_KEY, sRoot)
  // Clear selected program for this player
  plans.clearForPlayer(playerId.value)
}

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
        <select v-model="selectedKey">
          <option v-for="p in planOptions" :key="p.key" :value="p.key">{{ p.name }}</option>
        </select>
      </label>
      <button v-if="plans.selectedKey" class="pc-clear" @click="resetAll()" aria-label="Reset program">Reset</button>
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
            <button class="pc-done" @click="onRestClick(it)">REST</button>
            <span v-if="targetSets(it)" class="pc-sets" :class="{ done: setsDoneFor(it) >= targetSets(it) }">{{ setsDoneFor(it) }}/{{ targetSets(it) }}</span>
          </div>
          <div class="pc-timer" v-if="isTimerRunning(it)">
            <RestTimer
              :label="it.label"
              :duration="remainingSecFor(it)"
              :autoStart="true"
              compact
              @finished="onTimerFinished(it)"
              @paused="onTimerPaused(it, $event)"
              @reset="onTimerReset(it, $event)"
              @started="onTimerStarted(it, $event)"
            />
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

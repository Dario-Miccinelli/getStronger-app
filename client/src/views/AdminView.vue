<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useExerciseStore } from '../stores/exerciseStore'

const route = useRoute()
const exercises = useExerciseStore()
const playerId = ref(route.params.playerId ? String(route.params.playerId) : '1')
const playerDisplay = computed(() => (playerId.value === '1' ? 'Dario' : playerId.value === '2' ? 'Matteo' : `Player ${playerId.value || '?'}`))
const exerciseKey = ref('')
const list = ref([])
const busy = ref(false)
const apiStatus = ref('checking...')

async function fetchList() {
  busy.value = true
  try {
    const params = new URLSearchParams()
    if (playerId.value) params.append('playerId', playerId.value)
    if (exerciseKey.value) params.append('exerciseKey', exerciseKey.value)
    params.append('limit', '100')
    const res = await fetch(`/api/prs?${params.toString()}`)
    const json = await res.json()
    if (!json.ok) throw new Error('Failed to load list')
    list.value = json.data
  } finally { busy.value = false }
}

async function remove(id) {
  if (!confirm('Delete this PR?')) return
  await fetch(`/api/prs/${id}`, { method: 'DELETE' })
  await fetchList()
}

onMounted(async () => {
  if (exercises.items.length === 0) await exercises.fetchAll()
  await fetchList()
  try {
    const res = await fetch('/api/health')
    const json = await res.json()
    apiStatus.value = `${json.status} - ${json.service}`
  } catch { apiStatus.value = 'error' }
})

const exerciseOptions = computed(() => [{ exerciseKey: '', label: 'All exercises' }, ...exercises.items])
</script>

<template>
  <section class="admin">
    <header class="filters">
      <div class="pill">Admin for <strong>{{ playerDisplay }}</strong></div>
      <label>
        <span>Exercise</span>
        <select v-model="exerciseKey" @change="fetchList">
          <option v-for="ex in exerciseOptions" :key="ex.exerciseKey" :value="ex.exerciseKey">{{ ex.label }}</option>
        </select>
      </label>
      <button class="refresh" @click="fetchList" :disabled="busy">Refresh</button>
    </header>

    <ul class="table">
      <li class="row head">
        <span>Date</span><span>Exercise</span><span>Weight</span><span>Reps</span><span>RPE</span><span></span>
      </li>
      <li v-for="item in list" :key="item.id" class="row">
        <span>{{ new Date(item.dateISO).toLocaleString() }}</span>
        <span>{{ item.exerciseKey }}</span>
        <span>{{ item.weight }}</span>
        <span>{{ item.reps }}</span>
        <span>{{ item.rpe }}</span>
        <span><button class="del" @click="remove(item.id)">Delete</button></span>
      </li>
    </ul>
  </section>
</template>

<style scoped lang="scss">
.admin { display: grid; gap: 1rem; }
.filters { display: grid; grid-template-columns: auto auto 1fr auto; gap: .5rem; align-items: end; }
.pill { align-self: center; background: rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,.12); border-radius:999px; padding:.4rem .75rem; }
label { display: grid; gap: .25rem; }
select { background:#111827; color:#e5e7eb; border:1px solid rgba(255,255,255,.12); border-radius:10px; padding:.6rem .7rem; }
.refresh { background:#2563eb; color:white; border:0; border-radius:10px; padding:.6rem .9rem; font-weight:700; }
.table { list-style:none; margin:0; padding:0; display:grid; gap:.35rem; }
.row { display:grid; grid-template-columns: 1.2fr 1fr .6fr .4fr .4fr .5fr; gap:.5rem; align-items:center; background:#0f172a; border:1px solid rgba(255,255,255,.08); border-radius:10px; padding:.6rem .7rem; }
.head { opacity:.7; font-weight:700; }
.del { background:transparent; color:#ef4444; border:1px solid rgba(239,68,68,.5); border-radius:8px; padding:.35rem .6rem; }
@media (max-width: 640px) {
  .row { grid-template-columns: 1.5fr .8fr .5fr .4fr .4fr .6fr; font-size:.9rem; }
}
</style>

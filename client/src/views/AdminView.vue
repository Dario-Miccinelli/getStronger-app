<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useExerciseStore } from '../stores/exerciseStore'
import { apiFetch } from '../lib/api'

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
    const res = await apiFetch(`/prs?${params.toString()}`)
    const json = await res.json()
    if (!json.ok) throw new Error('Failed to load list')
    list.value = json.data
  } finally { busy.value = false }
}

async function remove(id) {
  if (!confirm('Delete this PR?')) return
  await apiFetch(`/prs/${id}`, { method: 'DELETE' })
  await fetchList()
}

onMounted(async () => {
  if (exercises.items.length === 0) await exercises.fetchAll()
  await fetchList()
  try {
    const res = await apiFetch('/health')
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

<style scoped lang="scss" src="./styles/AdminView.scss"></style>

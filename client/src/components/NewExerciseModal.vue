<script setup>
import { ref } from 'vue'
import { useExerciseStore } from '../stores/exerciseStore'
import { useRouter } from 'vue-router'

const emit = defineEmits(['close'])
const label = ref('')
const busy = ref(false)
const errorMsg = ref('')
const store = useExerciseStore()
const router = useRouter()

async function createExercise() {
  if (!label.value.trim()) return
  busy.value = true
  try {
    errorMsg.value = ''
    const ex = await store.add(label.value.trim())
    emit('close')
    router.push({ name: 'exercise', params: { key: ex.exerciseKey } })
  } catch (e) {
    if (e?.code === 'already_exists') {
      errorMsg.value = 'Exercise already exists'
    } else {
      errorMsg.value = 'Failed to create exercise'
    }
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="modal" role="dialog" aria-modal="true" aria-label="New Exercise">
    <div class="panel">
      <h3 class="title">Create new exercise</h3>
      <form class="form" @submit.prevent="createExercise">
        <label>
          <span>Name</span>
          <input v-model="label" placeholder="e.g., Squat" required />
        </label>
        <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
        <div class="actions">
          <button type="button" class="btn ghost" @click="emit('close')">Cancel</button>
          <button type="submit" class="btn primary" :disabled="busy">Create</button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped lang="scss">
.modal {
  position: fixed; inset: 0; display: grid; place-items: center;
  background: rgba(0,0,0,.4); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
  z-index: 3000; padding: 1rem;
}
.panel {
  width: min(520px, 100%);
  background: #0f172a; border: 1px solid rgba(255,255,255,0.12); border-radius: 16px;
  padding: 1rem; box-shadow: 0 20px 40px rgba(0,0,0,.35);
}
.title { margin: 0 0 .75rem 0; }
.form { display: grid; gap: .75rem; }
label { display: grid; gap: .35rem; }
input { background:#111827; color:#e5e7eb; border:1px solid rgba(255,255,255,.12); border-radius:10px; padding:.65rem .8rem; }
.actions { display:flex; justify-content:flex-end; gap:.5rem; margin-top: .25rem; }
.btn { border-radius:10px; padding:.55rem .9rem; font-weight:700; cursor:pointer; }
.primary { background:#2563eb; color:white; border:0; }
.ghost { background:transparent; color:#e5e7eb; border:1px solid rgba(255,255,255,.18); }
</style>
.error { color:#ef4444; font-weight:600; margin: 0; }

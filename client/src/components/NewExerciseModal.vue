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

<style scoped lang="scss" src="./styles/NewExerciseModal.scss"></style>

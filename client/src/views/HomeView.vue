<script setup>
import { ref, onMounted, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useExerciseStore } from '../stores/exerciseStore'
import { usePrStore } from '../stores/prStore'
import { storage } from '../lib/storage'
import Foto1 from '../assets/images/Foto1.png'
import Foto2 from '../assets/images/Foto2.png'
import NewExerciseModal from '../components/NewExerciseModal.vue'

const playerName = ref('')
const playerImage = ref('')
const playerId = ref('')
const showNew = ref(false)

const exercises = useExerciseStore()
const pr = usePrStore()

function loadPlayer() {
  const saved = storage.get()
  playerId.value = saved
  if (saved === '1') { playerName.value = 'Dario'; playerImage.value = Foto1 }
  else if (saved === '2') { playerName.value = 'Matteo'; playerImage.value = Foto2 }
}

onMounted(async () => {
  loadPlayer()
  await exercises.fetchAll({ force: true })
  // Fetch latest PRs (server cache ensures low DB load)
  await pr.fetchLatest(playerId.value, { force: true })
})

const latestByExercise = computed(() => pr.latest[playerId.value] || {})
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
      <button class="add-btn" @click="showNew = true" aria-label="Create new exercise">＋</button>
    </div>

    <nav class="list">
      <RouterLink
        v-for="ex in exercises.items"
        :key="ex.exerciseKey"
        class="list__item"
        :to="{ name: 'exercise', params: { key: ex.exerciseKey } }"
      >
        <span class="name">{{ ex.label }}</span>
        <span class="latest" v-if="latestByExercise[ex.exerciseKey]">
          {{ latestByExercise[ex.exerciseKey].weight }} kg × {{ latestByExercise[ex.exerciseKey].reps }}
        </span>
      </RouterLink>
    </nav>

    <NewExerciseModal v-if="showNew" @close="showNew = false" />
  </section>
</template>

<style scoped lang="scss" src="./styles/HomeView.scss"></style>

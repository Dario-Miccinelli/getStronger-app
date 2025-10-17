<script setup>
import { ref, onMounted, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useExerciseStore } from '../stores/exerciseStore'
import { usePrStore } from '../stores/prStore'
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
  const saved = localStorage.getItem('playerSelection')
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

<style scoped lang="scss">
.home { display: grid; gap: 1rem; padding-bottom: max(1rem, env(safe-area-inset-bottom)); }
.hero { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 1rem; }
.hero__avatar { width: 52px; height: 52px; border-radius: 50%; object-fit: cover; }
.hero__avatar-link { display: inline-block; border-radius: 50%; line-height: 0; }
.hero__avatar-link:active { transform: scale(.98); }
.title { margin: 0; font-size: clamp(1.2rem, 3.2vw, 1.6rem); }
.subtitle { margin: .25rem 0 0 0; opacity: .8; }

.list { display: grid; gap: .5rem; }
.list__item {
  display: grid; grid-template-columns: 1fr auto; align-items: center;
  background: #0f172a; border: 1px solid rgba(255,255,255,0.08);
  color: #e5e7eb; text-decoration: none; padding: .9rem 1rem; border-radius: 14px;
  position: relative;
}
.name { font-weight: 700; }
.latest { opacity: .9; font-weight: 600; margin-right: .75rem; }
/* removed arrow chevron */

.add-btn {
  background: #2563eb; color: white; border: none; border-radius: 10px; font-weight: 800; width: 38px; height: 38px;
}
</style>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import PlayerSelect from '../components/PlayerSelect.vue'
import Foto1 from '../assets/images/Foto1.png'
import Foto2 from '../assets/images/Foto2.png'

const router = useRouter()
const players = [
  { id: 1, name: 'Dario', image: Foto1 },
  { id: 2, name: 'Matteo', image: Foto2 },
]

function handleSelect(player) {
  try { localStorage.setItem('playerSelection', String(player.id)) } catch {}
  try { window.dispatchEvent(new Event('player-change')) } catch {}
  router.replace({ name: 'exercises' })
}

onMounted(() => {
  document.documentElement.classList.add('no-scroll')
})
onUnmounted(() => {
  document.documentElement.classList.remove('no-scroll')
})
</script>

<template>
  <PlayerSelect :players="players" @select="handleSelect" />
</template>

<style scoped lang="scss"></style>

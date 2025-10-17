<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  players: {
    type: Array,
    required: true,
    // [{ id: 1|2, name: string, image: string }]
  },
})

const emit = defineEmits(['select'])

function onSelect(player) {
  emit('select', player)
}
</script>

<template>
  <div class="player-select" role="dialog" aria-modal="true" aria-label="Player selection">
    <div class="player-select__panel">
      <h2 class="player-select__title">Choose your player</h2>
      <p class="player-select__subtitle">Pick a profile to continue</p>
      <div class="player-select__grid">
        <button
          v-for="p in players"
          :key="p.id"
          class="player-card"
          type="button"
          @click="onSelect(p)"
        >
          <div class="player-card__image-wrap">
            <img :src="p.image" :alt="p.name" class="player-card__image" />
          </div>
          <div class="player-card__label">{{ p.name }}</div>
        </button>
      </div>
    </div>
  </div>
  
</template>

<style lang="scss" scoped>
.player-select {
  position: fixed;
  inset: 0;
  display: grid;
  align-content: start;
  justify-items: center;
  padding: max(20px, env(safe-area-inset-top)) 16px max(20px, env(safe-area-inset-bottom)) 16px;
  background: rgba(2, 6, 23, 0.55);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 1000;
  overflow: hidden;

  &__panel {
    width: min(820px, 95vw);
    background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01)), #0f172a;
    color: #e2e8f0; // slate-200
    border-radius: 16px;
    box-shadow: 0 20px 50px rgba(0,0,0,.45);
    padding: clamp(1rem, 2.4vw, 1.75rem);
    border: 1px solid rgba(255,255,255,0.08);
    height: calc(100dvh - 2rem - env(safe-area-inset-top) - env(safe-area-inset-bottom));
    max-height: calc(100dvh - 2rem - env(safe-area-inset-top) - env(safe-area-inset-bottom));
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  &__title {
    margin: 0 0 .35rem 0;
    font-size: clamp(1.35rem, 2.4vw, 1.8rem);
    font-weight: 700;
    letter-spacing: .2px;
    text-align: center;
  }
  &__subtitle {
    margin: 0 0 1rem 0;
    text-align: center; opacity: .8;
    font-size: .95rem;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    grid-template-rows: 1fr;
    grid-auto-rows: 1fr;
    gap: clamp(0.75rem, 2vw, 1rem);
    flex: 1 1 auto;
    min-height: 0;
  }
}

.player-card {
  appearance: none;
  border: 0;
  background: #111827; // gray-900
  color: inherit;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  transition: transform .15s ease, box-shadow .15s ease, background .15s ease;
  outline: none;
  border: 1px solid rgba(255,255,255,0.08);
  height: 100%;

  &:hover, &:focus-visible {
    transform: translateY(-2px);
    box-shadow: 0 14px 24px rgba(0,0,0,.3);
    background: #0b1220;
  }

  &__image-wrap {
    position: relative;
    text-align: center;
    border-radius: 14px;
    overflow: hidden;
    aspect-ratio: 4/5;
    flex: 1 1 auto;
    min-height: 0;
  }

  &__image {
    display: block;
    width: 100%;
    height: 100%;
    margin: 0;
    object-fit: cover;
  }

  &__label {
    padding: .85rem 1rem 1rem;
    text-align: center;
    font-weight: 800;
    font-size: 1.05rem;
    letter-spacing: .2px;
  }
}

@media (max-width: 420px) {
  .player-select__grid {
    grid-template-columns: 1fr;
  }
}
</style>

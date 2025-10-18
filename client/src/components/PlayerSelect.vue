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

<style lang="scss" scoped src="./styles/PlayerSelect.scss"></style>

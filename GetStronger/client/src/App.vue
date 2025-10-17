<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const showBottomNav = computed(() => route.name !== 'select')
</script>

<template>
  <div class="app">

    <main class="content">
      <transition name="fade-slide" mode="out-in">
        <router-view />
      </transition>
    </main>
    <nav v-if="showBottomNav" class="bottom-nav" role="navigation" aria-label="Bottom navigation">
      <router-link class="bn-item" to="/" aria-label="Exercises">
        <svg class="bn-icon" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="3" width="8" height="8" rx="2"/>
          <rect x="13" y="3" width="8" height="8" rx="2"/>
          <rect x="3" y="13" width="8" height="8" rx="2"/>
          <rect x="13" y="13" width="8" height="8" rx="2"/>
        </svg>
        <span class="bn-label">Exercises</span>
      </router-link>
      <router-link class="bn-item" to="/select" aria-label="Player Selection">
        <svg class="bn-icon" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="8" r="3" />
          <rect x="8" y="13" width="8" height="7" rx="3" />
        </svg>
        <span class="bn-label">Player Selection</span>
      </router-link>
    </nav>
  </div>
</template>

<style lang="scss">
:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  color-scheme: light dark;
}

html.no-scroll, html.no-scroll body { overflow: hidden; }

body {
  margin: 0;
  background: radial-gradient(1200px 600px at 120% -20%, rgba(59,130,246,.15), transparent),
              radial-gradient(900px 500px at -20% 10%, rgba(16,185,129,.12), transparent),
              #0b1020;
  color: #e5e7eb; // slate-200
}

.app {
  min-height: 100dvh;
  display: grid;
  grid-template-rows: 1fr; /* header removed */
  overflow-x: hidden;
}

.brand {
  margin: 0;
  font-size: clamp(1.1rem, 3.2vw, 1.6rem);
  font-weight: 800;
  letter-spacing: .2px;
}

.status {
  font-size: .9rem;
  opacity: .9;
  .label { opacity: .7; margin-right: .35rem; }
}

.actions { display: flex; align-items: center; gap: .75rem; }

.change-btn {
  text-decoration: none;
  color: #e5e7eb;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.12);
  padding: .4rem .7rem;
  border-radius: 8px;
  font-weight: 600;
}

@media (max-width: 420px) {
  .status { display: none; }
  .actions { width: 100%; justify-content: space-between; }
}

.content {
  padding: clamp(0.75rem, 3vw, 1.25rem);
  padding-bottom: calc(72px + env(safe-area-inset-bottom));
}

.player-info {
  display: inline-flex;
  align-items: center;
  gap: .6rem;
  padding: .5rem .75rem;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 999px;

  &__avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    object-fit: cover;
    display: block;
  }

  &__text {
    font-weight: 600;
    letter-spacing: .2px;
  }
}

.muted { opacity: .7; margin-top: 1rem; }

/* page transition */
.fade-slide-enter-active, .fade-slide-leave-active { transition: opacity .18s ease, transform .18s ease; }
.fade-slide-enter-from, .fade-slide-leave-to { opacity: 0; transform: translateY(4px); }

.bottom-nav {
  position: fixed;
  left: 0; right: 0; bottom: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: rgba(15, 23, 42, 0.95);
  border-top: 1px solid rgba(255,255,255,0.08);
  padding: .5rem max(1rem, env(safe-area-inset-left)) calc(.5rem + env(safe-area-inset-bottom)) max(1rem, env(safe-area-inset-right));
  backdrop-filter: saturate(180%) blur(8px);
  -webkit-backdrop-filter: saturate(180%) blur(8px);
  z-index: 2000;
}

.bn-item {
  color: #e5e7eb;
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: .5rem;
  padding: .5rem;
  border-radius: 10px;
  font-weight: 700;
}

.bn-icon { flex: 0 0 auto; width: 22px; height: 22px; fill: currentColor; }

.bn-item.router-link-active, .bn-item.router-link-exact-active {
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.12);
  box-shadow: 0 6px 18px rgba(0,0,0,.25), inset 0 0 0 1px rgba(255,255,255,0.04);
  transform: translateY(-1px);
}

@media (max-width: 420px) {
  .change-btn { display: none; }
}
</style>

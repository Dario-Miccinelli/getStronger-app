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
        <router-view v-slot="{ Component, route }">
          <KeepAlive>
            <component :is="Component" v-if="route.meta && route.meta.keepAlive" />
          </KeepAlive>
          <component :is="Component" v-if="!route.meta || !route.meta.keepAlive" />
        </router-view>
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

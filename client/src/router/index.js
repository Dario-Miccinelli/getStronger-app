import { createRouter, createWebHistory } from 'vue-router'

const HomeView = () => import('../views/HomeView.vue')
const SelectPlayerView = () => import('../views/SelectPlayerView.vue')
const ExerciseView = () => import('../views/ExerciseView.vue')
const AdminView = () => import('../views/AdminView.vue')

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'exercises', component: HomeView },
    { path: '/exercise/:key', name: 'exercise', component: ExerciseView },
    { path: '/select', name: 'select', component: SelectPlayerView },
    { path: '/admin/:playerId?', name: 'admin', component: AdminView },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

// Global guard: require player selection except on /select
function isPlayerSelected() {
  try {
    const saved = localStorage.getItem('playerSelection')
    return saved === '1' || saved === '2'
  } catch {
    return false
  }
}

router.beforeEach((to) => {
  if (to.name !== 'select' && !isPlayerSelected()) {
    return { name: 'select' }
  }
})

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  duration: { type: Number, default: 90 }, // seconds
  autoStart: { type: Boolean, default: false },
  compact: { type: Boolean, default: false },
  label: { type: String, default: '' },
})

const emit = defineEmits(['finished'])

const remaining = ref(props.duration)
const running = ref(false)
let intervalId = null

function tick() {
  remaining.value = Math.max(0, remaining.value - 1)
  if (remaining.value === 0) {
    pause()
    try { beep() } catch {}
    emit('finished')
  }
}

function start() {
  if (running.value) return
  running.value = true
  if (remaining.value <= 0) remaining.value = props.duration
  clearInterval(intervalId)
  intervalId = setInterval(tick, 1000)
  try { scheduleNotifications(remaining.value) } catch {}
}
function pause() {
  running.value = false
  clearInterval(intervalId); intervalId = null
}
function reset() {
  pause(); remaining.value = props.duration
}

function beep() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)()
  const o = ctx.createOscillator(); const g = ctx.createGain()
  o.connect(g); g.connect(ctx.destination)
  o.type = 'sine'; o.frequency.value = 660
  g.gain.setValueAtTime(0.0001, ctx.currentTime)
  g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01)
  o.start()
  setTimeout(() => {
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.01)
    o.stop(); ctx.close()
  }, 350)
}

watch(() => props.duration, (d) => { if (!running.value) remaining.value = d })
onMounted(() => { if (props.autoStart) start() })
onBeforeUnmount(() => { clearInterval(intervalId) })

function fmt(sec) {
  const m = Math.floor(sec / 60), s = sec % 60
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}

// Notifications (best-effort; iOS PWA needs HTTPS for SW notifications)
async function scheduleNotifications(seconds) {
  try {
    const { ensurePermission, notifyStart, scheduleFinish } = await import('../lib/notify')
    const ok = await ensurePermission()
    if (!ok) return
    await notifyStart(props.label || 'Rest timer', seconds)
    await scheduleFinish(props.label || 'Rest timer', seconds)
  } catch {}
}
</script>

<template>
  <div class="rt" :class="{ compact }" role="timer" aria-live="polite" :aria-label="`Rest timer ${fmt(remaining)}`">
    <div class="rt__time">{{ fmt(remaining) }}</div>
    <div class="rt__controls">
      <button v-if="!running" class="rt__btn primary" @click="start" aria-label="Start rest">Start</button>
      <button v-else class="rt__btn" @click="pause" aria-label="Pause rest">Pause</button>
      <button class="rt__btn ghost" @click="reset" aria-label="Reset rest">Reset</button>
    </div>
  </div>
  
</template>

<style scoped lang="scss" src="./styles/RestTimer.scss"></style>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const progress = ref(0)

const updateProgress = () => {
  const windowHeight = window.innerHeight
  const documentHeight = document.documentElement.scrollHeight
  const scrollableHeight = documentHeight - windowHeight

  if (scrollableHeight <= 0) {
    progress.value = 0
    return
  }

  const scrollPercent = (window.scrollY / scrollableHeight) * 100

  progress.value = Math.min(Math.max(scrollPercent, 0), 100)
}

onMounted(() => {
  window.addEventListener('scroll', updateProgress, { passive: true })
  window.addEventListener('resize', updateProgress)

  updateProgress()
})

onUnmounted(() => {
  window.removeEventListener('scroll', updateProgress)
  window.removeEventListener('resize', updateProgress)
})
</script>

<template>
  <div
    class="progress-bar-container"
    role="progressbar"
    :aria-valuenow="Math.round(progress)"
    aria-valuemin="0"
    aria-valuemax="100"
    aria-label="Page scroll progress"
  >
    <div
      class="progress-bar"
      :style="{ width: `${progress}%` }"
    />
  </div>
</template>

<style scoped>
.progress-bar-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: transparent;
  pointer-events: none;
  z-index: 10000;
}

.progress-bar {
  position: relative;
  height: 100%;

  /*
   * The filled bar runs from tail to head:
   * dark blue → light blue → pale yellow.
   */
  background: linear-gradient(
    90deg,
    #142d82 0%,
    #2968c7 35%,
    #7dd2ff 70%,
    #fffabe 100%
  );

  box-shadow:
    0 0 4px rgba(80, 150, 255, 0.7),
    0 0 10px rgba(125, 210, 255, 0.5);

  transition: width 0.08s linear;
  will-change: width;
}

/* Glowing comet head at the current progress point. */
.progress-bar::after {
  content: '';
  position: absolute;
  top: 50%;
  right: 0;

  width: 12px;
  height: 12px;

  border-radius: 50%;
  transform: translate(50%, -50%);

  background: radial-gradient(
    circle,
    rgba(255, 255, 235, 1) 0%,
    rgba(255, 250, 190, 1) 25%,
    rgba(180, 230, 255, 0.75) 50%,
    rgba(90, 160, 235, 0.3) 75%,
    rgba(40, 80, 180, 0) 100%
  );

  box-shadow:
    0 0 5px rgba(255, 250, 190, 0.95),
    0 0 12px rgba(180, 230, 255, 0.75),
    0 0 20px rgba(50, 100, 210, 0.4);
}
</style>

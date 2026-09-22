<template>
  <div v-if="isDocPage" class="scroll-progress-bar" :style="{ width: progress + '%' }" role="progressbar" :aria-valuenow="Math.round(progress)" aria-valuemin="0" aria-valuemax="100" aria-label="Reading progress"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute } from 'vitepress'

const progress = ref(0)
const route = useRoute()

const isDocPage = computed(() => {
  return route.data?.frontmatter?.layout !== 'home'
})

function updateProgress() {
  const scrollTop = window.scrollY
  const docHeight = document.documentElement.scrollHeight - window.innerHeight
  if (docHeight > 0) {
    progress.value = Math.min((scrollTop / docHeight) * 100, 100)
  } else {
    progress.value = 100
  }
}

onMounted(() => {
  window.addEventListener('scroll', updateProgress, { passive: true })
  updateProgress()
})

onUnmounted(() => {
  window.removeEventListener('scroll', updateProgress)
})
</script>

<style scoped>
.scroll-progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  height: 3px;
  background: linear-gradient(90deg, #ff4500, #ff6b35, #ffa726);
  z-index: 9999;
  transition: width 0.1s linear;
  box-shadow: 0 0 8px rgba(255, 69, 0, 0.5);
}
</style>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vitepress'

const route = useRoute()
const readingTime = ref(0)

// Small delay to wait for VitePress content rendering after route change
const CONTENT_RENDER_DELAY = 100

function calculateReadingTime() {
  if (typeof document === 'undefined') return
  const content = document.querySelector('.vp-doc')
  if (!content) return
  const text = content.textContent || ''
  const wordCount = text.trim().split(/\s+/).length
  readingTime.value = Math.max(1, Math.ceil(wordCount / 200))
}

onMounted(() => {
  calculateReadingTime()
})

watch(() => route.path, () => {
  setTimeout(calculateReadingTime, CONTENT_RENDER_DELAY)
})
</script>

<template>
  <div v-if="readingTime > 0" class="reading-time">
    <span class="reading-time-icon">📖</span>
    <span class="reading-time-text">{{ readingTime }} min read</span>
  </div>
</template>

<style scoped>
.reading-time {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  font-size: 13px;
  color: var(--vp-c-text-2);
  margin-bottom: 16px;
}

.reading-time-icon {
  font-size: 14px;
}

.reading-time-text {
  font-weight: 500;
}
</style>

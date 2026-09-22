<script setup>
import { useData, useRoute } from 'vitepress'
import { computed } from 'vue'

const { site } = useData()
const route = useRoute()

const currentUrl = computed(() => {
  return 'https://thecrazy8.github.io/SplatoonDimensions' + route.path
})

const pageTitle = computed(() => {
  return document.title || 'Blaze & Company'
})

const shareTwitter = () => {
  const url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl.value)}&text=${encodeURIComponent(pageTitle.value)}`
  window.open(url, '_blank')
}

const shareLinkedIn = () => {
  const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl.value)}`
  window.open(url, '_blank')
}

const copyLink = () => {
  navigator.clipboard.writeText(currentUrl.value)
  alert('Link copied to clipboard!')
}
</script>

<template>
  <div class="share-buttons" role="group" aria-label="Share this page">
    <span class="share-label">Share: </span>
    <button @click="shareTwitter" class="share-btn" aria-label="Share on X (Twitter)">
      𝕏
    </button>
    <button @click="shareLinkedIn" class="share-btn" aria-label="Share on LinkedIn">
      in
    </button>
    <button @click="copyLink" class="share-btn" aria-label="Copy link to clipboard">
      🔗
    </button>
  </div>
</template>

<style scoped>
.share-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 24px 0;
  padding: 16px;
  border-top: 1px solid var(--vp-c-divider);
}

.share-label {
  font-weight: 600;
  color: var(--vp-c-text-2);
  margin-right: 8px;
}

.share-btn {
  padding: 8px 12px;
  border: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 16px;
}

.share-btn:hover {
  background: var(--vp-c-brand-soft);
  border-color: var(--vp-c-brand-1);
  transform: translateY(-2px);
}
</style>
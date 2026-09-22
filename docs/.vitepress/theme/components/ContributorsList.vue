<template>
  <div v-if="contributors.length > 0" class="contributors-section">
    <div class="contributors-header">
      <span class="contributors-label">👥 Contributors</span>
    </div>
    <div class="contributors-avatars">
      <a
        v-for="contributor in contributors"
        :key="contributor.login"
        :href="contributor.html_url"
        :title="contributor.login + ' (' + contributor.contributions + ' contributions)'"
        class="contributor-avatar"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img
          :src="contributor.avatar_url + '&s=64'"
          :alt="contributor.login"
          width="32"
          height="32"
          loading="lazy"
        />
      </a>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const CACHE_KEY = 'blaze-contributors-cache'
const CACHE_DURATION_MS = 3600000 // 1 hour
const CONTRIBUTORS_URL = 'https://api.github.com/repos/TheCrazy8/SplatoonDimensions/contributors'

const contributors = ref([])

function loadFromCache() {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      const parsed = JSON.parse(cached)
      if (Date.now() - parsed.timestamp < CACHE_DURATION_MS) {
        return parsed.data
      }
    }
  } catch {
    // ignore cache errors
  }
  return null
}

function saveToCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      timestamp: Date.now(),
      data
    }))
  } catch {
    // ignore storage errors
  }
}

onMounted(async () => {
  const cached = loadFromCache()
  if (cached) {
    contributors.value = cached
    return
  }

  try {
    const response = await fetch(CONTRIBUTORS_URL)
    if (response.ok) {
      const data = await response.json()
      contributors.value = data.slice(0, 20) // Show top 20
      saveToCache(contributors.value)
    }
  } catch {
    // Silently fail - component won't show if no data
  }
})
</script>

<style scoped>
.contributors-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--vp-c-divider);
}

.contributors-header {
  margin-bottom: 0.75rem;
}

.contributors-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--vp-c-text-2);
}

.contributors-avatars {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.contributor-avatar {
  display: inline-flex;
  transition: transform 0.2s ease;
}

.contributor-avatar:hover {
  transform: scale(1.2);
  z-index: 1;
}

.contributor-avatar img {
  border-radius: 50%;
  border: 2px solid var(--vp-c-divider);
  transition: border-color 0.2s ease;
}

.contributor-avatar:hover img {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 0 8px rgba(255, 69, 0, 0.3);
}
</style>

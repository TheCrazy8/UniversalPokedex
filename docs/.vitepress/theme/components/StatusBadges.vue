<template>
  <div v-if="loaded" class="status-badges">
    <a
      class="status-badge"
      href="https://github.com/TheCrazy8/SplatoonDimensions"
      target="_blank"
      rel="noopener noreferrer"
      title="GitHub Stars"
    >
      <span class="badge-icon">⭐</span>
      <span class="badge-value">{{ stars }}</span>
    </a>
    <a
      class="status-badge"
      href="https://github.com/TheCrazy8/SplatoonDimensions/network/members"
      target="_blank"
      rel="noopener noreferrer"
      title="GitHub Forks"
    >
      <span class="badge-icon">🍴</span>
      <span class="badge-value">{{ forks }}</span>
    </a>
    <a
      class="status-badge"
      href="https://github.com/TheCrazy8/SplatoonDimensions/issues"
      target="_blank"
      rel="noopener noreferrer"
      title="Open Issues"
    >
      <span class="badge-icon">📋</span>
      <span class="badge-value">{{ issues }}</span>
    </a>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const CACHE_KEY = 'splatoondimensions-repo-stats-cache'
const CACHE_DURATION_MS = 3600000 // 1 hour
const REPO_URL = 'https://api.github.com/repos/TheCrazy8/SplatoonDimensions'

const stars = ref(0)
const forks = ref(0)
const issues = ref(0)
const loaded = ref(false)

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
    stars.value = cached.stars
    forks.value = cached.forks
    issues.value = cached.issues
    loaded.value = true
    return
  }

  try {
    const response = await fetch(REPO_URL)
    if (response.ok) {
      const data = await response.json()
      stars.value = data.stargazers_count || 0
      forks.value = data.forks_count || 0
      issues.value = data.open_issues_count || 0
      loaded.value = true
      saveToCache({ stars: stars.value, forks: forks.value, issues: issues.value })
    }
  } catch {
    // Silently fail
  }
})
</script>

<style scoped>
.status-badges {
  display: inline-flex;
  gap: 8px;
  padding: 4px 0;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 16px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
  text-decoration: none !important;
  transition: all 0.2s ease;
  cursor: pointer;
}

.status-badge:hover {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  transform: translateY(-1px);
}

.badge-icon {
  font-size: 0.9rem;
}

.badge-value {
  font-weight: 600;
}
</style>

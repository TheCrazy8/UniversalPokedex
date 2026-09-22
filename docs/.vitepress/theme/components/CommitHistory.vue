<template>
  <div class="commit-history">
    <div class="history-header">
      <h2>Recent Commits</h2>
      <div class="controls">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Search commits..."
          class="search-input"
        />
        <select v-model="filterType" class="filter-select">
          <option value="all">All Files</option>
          <option value="docs">Documentation</option>
          <option value="code">Code</option>
          <option value="config">Configuration</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading commit history...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>⚠️ {{ error }}</p>
      <button @click="fetchCommits" class="retry-button">Retry</button>
    </div>

    <div v-else class="commits-container">
      <div v-for="(commits, date) in groupedCommits" :key="date" class="date-group">
        <h3 class="date-header">{{ date }}</h3>
        <div class="commits-list">
          <div 
            v-for="commit in commits" 
            :key="commit.sha" 
            class="commit-card"
          >
            <div class="commit-header">
              <a 
                :href="commit.html_url" 
                target="_blank" 
                rel="noopener noreferrer"
                class="commit-message"
              >
                {{ commit.commit.message.split('\n')[0] }}
              </a>
              <span class="commit-sha" :title="commit.sha">
                {{ commit.sha.substring(0, 7) }}
              </span>
            </div>
            
            <div class="commit-meta">
              <span class="commit-author">
                <img 
                  v-if="commit.author" 
                  :src="commit.author.avatar_url" 
                  :alt="commit.commit.author.name"
                  class="author-avatar"
                />
                <span class="author-name">{{ commit.commit.author.name }}</span>
              </span>
              <span class="commit-time">
                {{ formatTime(commit.commit.author.date) }}
              </span>
            </div>

            <div v-if="commit.files && commit.files.length > 0" class="commit-files">
              <details>
                <summary>
                  {{ commit.files.length }} file{{ commit.files.length !== 1 ? 's' : '' }} changed
                </summary>
                <ul class="files-list">
                  <li v-for="file in commit.files.slice(0, 10)" :key="file.filename" class="file-item">
                    <span class="file-status" :class="file.status">{{ file.status[0].toUpperCase() }}</span>
                    <span class="file-name">{{ file.filename }}</span>
                  </li>
                  <li v-if="commit.files.length > 10" class="more-files">
                    ... and {{ commit.files.length - 10 }} more
                  </li>
                </ul>
              </details>
            </div>
          </div>
        </div>
      </div>

      <div v-if="hasMore && !loading" class="load-more">
        <button @click="loadMore" class="load-more-button">
          Load More Commits
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { githubFetch } from '../config/github-auth.js'

const commits = ref([])
const loading = ref(true)
const error = ref(null)
const searchQuery = ref('')
const filterType = ref('all')
const page = ref(1)
const hasMore = ref(true)
const perPage = 30

const CACHE_KEY = 'brightos-commits-cache'
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

onMounted(() => {
  loadFromCache()
  fetchCommits()
})

function loadFromCache() {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      const { data, timestamp } = JSON.parse(cached)
      if (Date.now() - timestamp < CACHE_DURATION) {
        commits.value = data
        loading.value = false
      }
    }
  } catch (err) {
    console.error('Cache load error:', err)
  }
}

function saveToCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now()
    }))
  } catch (err) {
    console.error('Cache save error:', err)
  }
}

async function fetchCommits() {
  loading.value = true
  error.value = null

  try {
    const response = await githubFetch(
      `https://api.github.com/repos/TheCrazy8/SplatoonDimensions/commits?per_page=${perPage}&page=${page.value}`
    )

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (page.value === 1) {
      commits.value = data
      saveToCache(data)
    } else {
      commits.value.push(...data)
    }

    hasMore.value = data.length === perPage
  } catch (err) {
    error.value = err.message || 'Failed to fetch commits'
    console.error('Fetch error:', err)
  } finally {
    loading.value = false
  }
}

function loadMore() {
  page.value++
  fetchCommits()
}

const filteredCommits = computed(() => {
  let filtered = commits.value

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(commit => 
      commit.commit.message.toLowerCase().includes(query) ||
      commit.commit.author.name.toLowerCase().includes(query) ||
      commit.sha.toLowerCase().includes(query)
    )
  }

  // Apply file type filter
  if (filterType.value !== 'all' && filtered.length > 0) {
    filtered = filtered.filter(commit => {
      if (!commit.files) return false
      
      return commit.files.some(file => {
        if (filterType.value === 'docs') {
          return file.filename.startsWith('docs/') || file.filename.endsWith('.md')
        } else if (filterType.value === 'code') {
          return file.filename.endsWith('.py') || 
                 file.filename.endsWith('.js') || 
                 file.filename.endsWith('.vue')
        } else if (filterType.value === 'config') {
          return file.filename.includes('config') || 
                 file.filename.endsWith('.json') || 
                 file.filename.endsWith('.mjs')
        }
        return true
      })
    })
  }

  return filtered
})

const groupedCommits = computed(() => {
  const groups = {}
  
  filteredCommits.value.forEach(commit => {
    const date = new Date(commit.commit.author.date)
    const dateKey = date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
    
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(commit)
  })
  
  return groups
})

function formatTime(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return 'just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
  
  return date.toLocaleString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.commit-history {
  margin: 20px 0;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 16px;
  flex-wrap: wrap;
}

.history-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.controls {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.search-input,
.filter-select {
  padding: 8px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 14px;
}

.search-input {
  min-width: 200px;
}

.search-input:focus,
.filter-select:focus {
  outline: none;
  border-color: var(--vp-c-brand-1);
}

.loading-state,
.error-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--vp-c-text-2);
}

.spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 16px;
  border: 3px solid var(--vp-c-divider);
  border-top-color: var(--vp-c-brand-1);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.retry-button {
  margin-top: 12px;
  padding: 8px 16px;
  background: var(--vp-c-brand-1);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.retry-button:hover {
  background: var(--vp-c-brand-2);
}

.date-group {
  margin-bottom: 32px;
}

.date-header {
  font-size: 16px;
  font-weight: 600;
  color: var(--vp-c-text-2);
  margin: 0 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--vp-c-divider);
}

.commits-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.commit-card {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s;
}

.commit-card:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.commit-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 12px;
  margin-bottom: 8px;
}

.commit-message {
  flex: 1;
  font-size: 15px;
  font-weight: 500;
  color: var(--vp-c-text-1);
  text-decoration: none;
  line-height: 1.4;
}

.commit-message:hover {
  color: var(--vp-c-brand-1);
}

.commit-sha {
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  color: var(--vp-c-text-3);
  padding: 2px 6px;
  background: var(--vp-c-bg);
  border-radius: 4px;
  flex-shrink: 0;
}

.commit-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: var(--vp-c-text-2);
  margin-bottom: 8px;
}

.commit-author {
  display: flex;
  align-items: center;
  gap: 6px;
}

.author-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
}

.commit-files {
  margin-top: 8px;
}

.commit-files details {
  cursor: pointer;
}

.commit-files summary {
  font-size: 12px;
  color: var(--vp-c-text-3);
  padding: 4px 0;
}

.commit-files summary:hover {
  color: var(--vp-c-brand-1);
}

.files-list {
  list-style: none;
  padding: 8px 0 0 0;
  margin: 0;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 12px;
  font-family: var(--vp-font-family-mono);
}

.file-status {
  display: inline-block;
  width: 18px;
  height: 18px;
  border-radius: 3px;
  text-align: center;
  line-height: 18px;
  font-size: 10px;
  font-weight: 600;
  color: white;
}

.file-status.added {
  background: rgb(16, 185, 129);
}

.file-status.modified {
  background: rgb(245, 158, 11);
}

.file-status.removed {
  background: rgb(239, 68, 68);
}

.file-name {
  color: var(--vp-c-text-2);
}

.more-files {
  padding: 4px 0;
  font-size: 12px;
  color: var(--vp-c-text-3);
  font-style: italic;
}

.load-more {
  text-align: center;
  margin-top: 24px;
}

.load-more-button {
  padding: 10px 24px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  color: var(--vp-c-text-1);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.load-more-button:hover {
  background: var(--vp-c-brand-1);
  color: white;
  border-color: var(--vp-c-brand-1);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .history-header {
    flex-direction: column;
    align-items: stretch;
  }

  .controls {
    flex-direction: column;
  }

  .search-input {
    min-width: 100%;
  }

  .commit-header {
    flex-direction: column;
  }

  .commit-sha {
    align-self: flex-start;
  }
}
</style>

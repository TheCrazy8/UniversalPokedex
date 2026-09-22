<script setup>
import { ref, computed, onMounted } from 'vue'
import { analytics, reviews } from '../config/supabase.js'
import PluginCard from './PluginCard.vue'

const searchQuery = ref('')
const selectedCategory = ref('all')
const selectedDifficulty = ref('all')
const sortBy = ref('downloads')
const isLoading = ref(true)
const error = ref(null)
const cacheAge = ref(null)

const categories = ref(['all'])
const difficulties = ['all', 'Beginner', 'Intermediate', 'Advanced']

const plugins = ref([])
const selectedPlugin = ref(null)
const repoStats = ref(null)

const showReviewModal = ref(false)
const reviewPluginId = ref(null)
const reviewForm = ref({
  userName: '',
  rating: 5,
  comment:  ''
})
const pluginReviews = ref({})
const pluginStats = ref({})

// Fetch real download and review stats from Supabase
const fetchRealStats = async () => {
  try {
    const stats = await analytics.getAllStats()
    
    stats.forEach(stat => {
      pluginStats.value[stat.plugin_id] = {
        downloads: stat.download_count,
        reviewCount: stat.review_count,
        averageRating: parseFloat(stat.average_rating)
      }
    })
  } catch (err) {
    console.error('Error fetching real stats:', err)
  }
}

// Fetch plugins from GitHub (always fresh)
const fetchPlugins = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    // Fetch directly from GitHub repository (always up-to-date)
    console.log('Loading plugins from GitHub...')
    const githubUrl = 'https://raw.githubusercontent.com/TheCrazy8/SplatoonDimensions/main/docs/public/plugins-cache.json'
    const cacheResponse = await fetch(githubUrl)
    
    if (cacheResponse.ok) {
      const cache = await cacheResponse.json()
      
      // Calculate cache age
      const generatedAt = new Date(cache.generated_at)
      const ageHours = Math.floor((Date.now() - generatedAt.getTime()) / (1000 * 60 * 60))
      cacheAge.value = ageHours < 1 ? 'less than 1 hour' : `${ageHours} hours`
      
      console.log(`✓ Loaded ${cache.plugins.length} plugins from GitHub (${cacheAge.value} old)`)
      
      // Load plugins from cache
      plugins.value = cache.plugins
      
      // Load repo stats from cache
      if (cache.repository) {
        repoStats.value = {
          stars: cache.repository.stars,
          forks: cache.repository.forks,
          watchers: cache.repository.watchers
        }
      }
      
      // Extract unique categories
      const uniqueCategories = [...new Set(cache.plugins.map(p => p.category))]
      categories.value = ['all', ...uniqueCategories]
      
      isLoading.value = false
      return
    }
    
    // Fallback: Cache not available on GitHub
    throw new Error('Plugin cache not found on GitHub. The cache will be generated automatically on the next repository update.')
    
  } catch (err) {
    console.error('Error loading plugins:', err)
    error.value = err.message
    isLoading.value = false
  }
}

// Rest of the component stays exactly the same...
// (All the computed properties, functions, etc.)

const totalPlugins = computed(() => plugins.value. length)
const totalDownloads = computed(() => 
  plugins.value.reduce((sum, p) => sum + (pluginStats.value[p.id]?.downloads || 0), 0)
)
const totalContributors = computed(() => {
  const allContributors = plugins.value.flatMap(p => p.contributors)
  return new Set(allContributors).size
})
const totalCommits = computed(() => 
  plugins.value.reduce((sum, p) => sum + p.commitCount, 0)
)
const averageRating = computed(() => {
  if (plugins.value.length === 0) return 0
  const sum = plugins.value.reduce((sum, p) => {
    const stats = pluginStats.value[p.id]
    return sum + (stats?.averageRating || p.rating || 0)
  }, 0)
  const avg = sum / plugins.value.length
  return avg.toFixed(1)
})

const filteredPlugins = computed(() => {
  return plugins.value
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                           p.description. toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                           p.tags.some(tag => tag.includes(searchQuery.value. toLowerCase()))
      const matchesCategory = selectedCategory.value === 'all' || p. category === selectedCategory.value
      const matchesDifficulty = selectedDifficulty.value === 'all' || p.difficulty === selectedDifficulty.value
      return matchesSearch && matchesCategory && matchesDifficulty
    })
    .sort((a, b) => {
      switch(sortBy.value) {
        case 'downloads':  {
          const aDownloads = pluginStats.value[a.id]?. downloads || 0
          const bDownloads = pluginStats. value[b.id]?.downloads || 0
          return bDownloads - aDownloads
        }
        case 'rating': {
          const aRating = pluginStats.value[a.id]?.averageRating || a.rating || 0
          const bRating = pluginStats. value[b.id]?.averageRating || b.rating || 0
          return bRating - aRating
        }
        case 'date': return new Date(b.lastUpdated) - new Date(a.lastUpdated)
        case 'name': return a.name.localeCompare(b.name)
        default: return 0
      }
    })
})

// Track download with Supabase
const trackDownload = async (plugin) => {
  try {
    await analytics.trackDownload(plugin.id, plugin.name)
    
    if (! pluginStats.value[plugin.id]) {
      pluginStats. value[plugin.id] = { downloads: 0, reviewCount:  0, averageRating:  0 }
    }
    pluginStats.value[plugin.id].downloads++
  } catch (err) {
    console.error('Error tracking download:', err)
  }
}

const copyCode = async (plugin) => {
  try {
    const response = await fetch(plugin.downloadUrl)
    const code = await response.text()
    await navigator.clipboard.writeText(code)
    
    await trackDownload(plugin)
    
    if (window.$toast) {
      window.$toast. success(`✨ ${plugin.name} code copied to clipboard! `)
    } else {
      alert(`✅ ${plugin.name} code copied! `)
    }
  } catch (err) {
    if (window.$toast) {
      window.$toast.error('❌ Failed to copy code')
    } else {
      alert('❌ Failed to copy code')
    }
  }
}

const downloadPlugin = async (plugin) => {
  window. open(plugin.downloadUrl, '_blank')
  await trackDownload(plugin)
  
  if (window.$toast) {
    window.$toast.success(`📥 Downloading ${plugin.name}...`)
  }
}

const viewPlugin = (plugin) => {
  selectedPlugin.value = plugin
}

const closeModal = () => {
  selectedPlugin.value = null
}

// Review functions
const openReviewModal = (plugin) => {
  reviewPluginId.value = plugin
  showReviewModal.value = true
  loadPluginReviews(plugin. id)
}

const closeReviewModal = () => {
  showReviewModal.value = false
  reviewPluginId.value = null
  reviewForm.value = { userName: '', rating: 5, comment: '' }
}

const loadPluginReviews = async (pluginId) => {
  try {
    const data = await reviews.getReviews(pluginId, 10)
    pluginReviews. value[pluginId] = data
    
    const stats = await reviews.getReviewStats(pluginId)
    if (pluginStats.value[pluginId]) {
      pluginStats. value[pluginId].reviewCount = stats.count
      pluginStats.value[pluginId].averageRating = parseFloat(stats.average)
      pluginStats.value[pluginId].distribution = stats.distribution
    } else {
      pluginStats. value[pluginId] = {
        downloads: 0,
        reviewCount: stats.count,
        averageRating: parseFloat(stats.average),
        distribution: stats.distribution
      }
    }
  } catch (err) {
    console.error('Error loading reviews:', err)
  }
}

const submitReview = async () => {
  if (!reviewForm.value.userName. trim()) {
    if (window.$toast) {
      window.$toast.warning('Please enter your name')
    }
    return
  }
  
  if (! reviewForm.value.comment.trim()) {
    if (window.$toast) {
      window.$toast.warning('Please write a review')
    }
    return
  }
  
  try {
    const result = await reviews.submitReview(
      reviewPluginId.value. id,
      reviewPluginId.value.name,
      reviewForm.value. userName,
      reviewForm.value.rating,
      reviewForm.value. comment
    )
    
    if (result.success) {
      if (window.$toast) {
        window.$toast.success('✅ Review submitted!')
      }
      
      await loadPluginReviews(reviewPluginId.value.id)
      reviewForm.value = { userName: '', rating: 5, comment: '' }
    } else {
      if (window.$toast) {
        window.$toast.error('Failed to submit review')
      }
    }
  } catch (err) {
    console.error('Error submitting review:', err)
    if (window.$toast) {
      window.$toast.error('Failed to submit review')
    }
  }
}

const getPluginStats = (pluginId) => {
  const stats = pluginStats.value[pluginId]
  return {
    downloads: stats?.downloads || 0,
    reviewCount: stats?.reviewCount || 0,
    averageRating:  stats?.averageRating || 0
  }
}

const getTimeSince = (date) => {
  const days = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  return `${Math.floor(days / 30)} months ago`
}

const retryFetch = () => {
  fetchPlugins()
}

// Load on mount
onMounted(async () => {
  await fetchRealStats()
  await fetchPlugins()
})
</script>

<template>
  <div class="plugin-marketplace">
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner">⚙️</div>
      <p>Loading plugins from GitHub...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">❌</div>
      <h3>Plugin Cache Not Available</h3>
      <p style="white-space: pre-wrap;">{{ error }}</p>
      <p class="help-text">
        The plugin cache is automatically generated when you push changes to the repository. 
        If this is your first visit, please wait a few minutes for the cache to be created.
      </p>
      <button @click="retryFetch" class="btn btn-primary">
        🔄 Retry
      </button>
    </div>

    <!-- Main Content -->
    <template v-else>
      <!-- Header -->
      <div class="marketplace-header">
        <h1>🔌 Plugin Marketplace</h1>
        <p>Discover and install community-made plugins to extend BrightOS</p>
        
        <!-- Cache age indicator -->
        <div v-if="cacheAge" class="cache-info">
          <span>📦 Data from GitHub (generated {{ cacheAge }} ago)</span>
        </div>
        
        <!-- Stats Overview -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">📦</div>
            <div class="stat-value">{{ totalPlugins }}</div>
            <div class="stat-label">Total Plugins</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">⬇️</div>
            <div class="stat-value">{{ totalDownloads }}</div>
            <div class="stat-label">Downloads</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">👥</div>
            <div class="stat-value">{{ totalContributors }}</div>
            <div class="stat-label">Contributors</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">⭐</div>
            <div class="stat-value">{{ averageRating }}</div>
            <div class="stat-label">Avg Rating</div>
          </div>
        </div>
      </div>

      <!-- Filters and Search -->
      <div class="controls">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="🔍 Search plugins..." 
          class="search-input"
        />
        
        <div class="filters">
          <select v-model="selectedCategory" class="filter-select">
            <option v-for="cat in categories" :key="cat" :value="cat">
              {{ cat === 'all' ? 'All Categories' : cat }}
            </option>
          </select>
          
          <select v-model="selectedDifficulty" class="filter-select">
            <option v-for="diff in difficulties" :key="diff" :value="diff">
              {{ diff === 'all' ? 'All Difficulties' : diff }}
            </option>
          </select>
          
          <select v-model="sortBy" class="filter-select">
            <option value="downloads">Most Downloaded</option>
            <option value="rating">Highest Rated</option>
            <option value="date">Recently Updated</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>
      </div>

      <!-- Results Count -->
      <div class="results-info">
        <p>{{ filteredPlugins.length }} plugin{{ filteredPlugins.length !== 1 ? 's' : '' }} found</p>
      </div>

      <!-- Plugin Grid using PluginCard -->
      <div v-if="filteredPlugins.length > 0" class="plugin-grid">
        <PluginCard
          v-for="plugin in filteredPlugins"
          :key="plugin.id"
          :plugin="{
            ...plugin,
            downloads: getPluginStats(plugin.id).downloads,
            rating: getPluginStats(plugin.id).averageRating || plugin.rating
          }"
          @try-in-web="viewPlugin(plugin)"
        />
      </div>

      <!-- No Results -->
      <div v-else class="no-results">
        <div class="no-results-icon">🔍</div>
        <h3>No plugins found</h3>
        <p>Try adjusting your search or filters</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.plugin-marketplace {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

/* Loading & Error States */
.loading-state,
.error-state {
  text-align: center;
  padding: 60px 20px;
}

.spinner {
  font-size: 48px;
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.error-state h3 {
  margin-bottom: 12px;
  color: var(--vp-c-text-1);
}

.error-state p {
  color: var(--vp-c-text-2);
  margin-bottom: 8px;
}

.help-text {
  margin-top: 12px;
  font-size: 14px;
  color: var(--vp-c-text-3);
}

.btn {
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  margin-top: 20px;
}

.btn-primary {
  background: var(--vp-c-brand-1);
  color: white;
}

.btn-primary:hover {
  background: var(--vp-c-brand-2);
}

/* Header */
.marketplace-header {
  text-align: center;
  margin-bottom: 40px;
}

.marketplace-header h1 {
  margin-bottom: 12px;
  color: var(--vp-c-text-1);
}

.marketplace-header p {
  color: var(--vp-c-text-2);
  font-size: 16px;
}

.cache-info {
  margin-top: 8px;
  font-size: 12px;
  color: var(--vp-c-text-3);
  font-style: italic;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 32px;
}

.stat-card {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  transition: all 0.3s ease;
}

.stat-card:hover {
  border-color: var(--vp-c-brand-1);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--vp-c-brand-1);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 13px;
  color: var(--vp-c-text-2);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Controls */
.controls {
  margin-bottom: 24px;
}

.search-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  font-size: 14px;
  margin-bottom: 16px;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 0 0 3px rgba(var(--vp-c-brand-rgb), 0.1);
}

.filters {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-select {
  flex: 1;
  min-width: 150px;
  padding: 10px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-select:hover {
  border-color: var(--vp-c-brand-1);
}

.filter-select:focus {
  outline: none;
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 0 0 3px rgba(var(--vp-c-brand-rgb), 0.1);
}

/* Results Info */
.results-info {
  margin-bottom: 20px;
  color: var(--vp-c-text-2);
  font-size: 14px;
}

/* Plugin Grid */
.plugin-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

/* No Results */
.no-results {
  text-align: center;
  padding: 60px 20px;
}

.no-results-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.no-results h3 {
  margin-bottom: 8px;
  color: var(--vp-c-text-1);
}

.no-results p {
  color: var(--vp-c-text-2);
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .plugin-marketplace {
    padding: 16px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .filters {
    flex-direction: column;
  }

  .filter-select {
    width: 100%;
  }

  .plugin-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
</style>

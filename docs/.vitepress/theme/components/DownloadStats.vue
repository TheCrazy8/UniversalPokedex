<template>
  <LoadingSpinner :loading="loading" text="Loading download statistics...">
    <div class="stats-container">
      <div class="stat-card" v-for="stat in stats" :key="stat.plugin_id">
        <h3>{{ stat.plugin_name }}</h3>
        <p class="download-count">{{ stat.downloads }} downloads</p>
      </div>
    </div>
  </LoadingSpinner>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { analytics } from '../config/supabase.js'
import LoadingSpinner from './LoadingSpinner.vue'

const stats = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    stats.value = await analytics.getAllStats()
  } catch (error) {
    console.error('Failed to load stats:', error)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.stats-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
  margin: 1rem 0;
}

.stat-card {
  padding: 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
}

.download-count {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--vp-c-brand-1);
}
</style>

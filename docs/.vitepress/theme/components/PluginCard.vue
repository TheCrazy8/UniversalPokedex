<template>
  <div class="plugin-card">
    <div class="plugin-header">
      <h3 class="plugin-name">{{ plugin.name }}</h3>
      <div class="plugin-badges">
        <span v-if="plugin.version" class="badge version">v{{ plugin.version }}</span>
        <span v-if="plugin.category" class="badge category">{{ plugin.category }}</span>
      </div>
    </div>

    <p class="plugin-description">{{ plugin.description }}</p>

    <div class="plugin-meta">
      <span v-if="plugin.author" class="meta-item">
        👤 {{ plugin.author }}
      </span>
      <span v-if="plugin.downloads" class="meta-item">
        ⬇️ {{ plugin.downloads }} downloads
      </span>
      <span v-if="plugin.lastUpdated" class="meta-item">
        📅 {{ formatDate(plugin.lastUpdated) }}
      </span>
    </div>

    <div v-if="plugin.features && plugin.features.length > 0" class="plugin-features">
      <strong>Features:</strong>
      <ul>
        <li v-for="(feature, index) in plugin.features.slice(0, 3)" :key="index">
          {{ feature }}
        </li>
      </ul>
    </div>

    <div v-if="plugin.requirements" class="plugin-requirements">
      <strong>Requirements:</strong> {{ plugin.requirements }}
    </div>

    <div class="plugin-actions">
      <button @click="copyCode" class="action-button primary" :class="{ copied }">
        {{ copied ? '✓ Copied!' : '📋 Copy Code' }}
      </button>
      <a v-if="plugin.downloadUrl" :href="plugin.downloadUrl" class="action-button secondary" target="_blank">
        💾 Download
      </a>
      <button v-if="plugin.code" @click="togglePreview" class="action-button secondary">
        {{ showPreview ? '👁️ Hide' : '👁️ Preview' }}
      </button>
      <button v-if="tryInWebEnabled" @click="tryInWeb" class="action-button accent">
        🚀 Try in Web
      </button>
    </div>

    <div v-if="showPreview && plugin.code" class="code-preview">
      <pre><code>{{ plugin.code }}</code></pre>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  plugin: {
    type: Object,
    required: true
  },
  tryInWebEnabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['try-in-web'])

const showPreview = ref(false)
const copied = ref(false)

function togglePreview() {
  showPreview.value = !showPreview.value
}

function copyCode() {
  const code = props.plugin.code
  
  if (!code) {
    console.warn('No code available to copy')
    return
  }

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(code)
      .then(() => showCopiedFeedback())
      .catch(() => fallbackCopy(code))
  } else {
    fallbackCopy(code)
  }
}

function fallbackCopy(text) {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.left = '-999999px'
  document.body.appendChild(textarea)
  textarea.select()
  
  try {
    document.execCommand('copy')
    showCopiedFeedback()
  } catch (err) {
    console.error('Copy failed:', err)
  }
  
  document.body.removeChild(textarea)
}

function showCopiedFeedback() {
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}

function tryInWeb() {
  emit('try-in-web', props.plugin)
}

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })
}
</script>

<style scoped>
.plugin-card {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
}

.plugin-card:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.plugin-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 12px;
  gap: 12px;
}

.plugin-name {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  line-height: 1.3;
}

.plugin-badges {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge.version {
  background: rgba(16, 185, 129, 0.1);
  color: rgb(16, 185, 129);
  border: 1px solid rgb(16, 185, 129);
}

.badge.category {
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  border: 1px solid var(--vp-c-divider);
}

.plugin-description {
  color: var(--vp-c-text-2);
  line-height: 1.6;
  margin: 0 0 16px 0;
}

.plugin-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--vp-c-divider);
}

.meta-item {
  font-size: 13px;
  color: var(--vp-c-text-3);
  display: flex;
  align-items: center;
  gap: 4px;
}

.plugin-features {
  margin-bottom: 16px;
  font-size: 14px;
}

.plugin-features strong {
  color: var(--vp-c-text-1);
  display: block;
  margin-bottom: 8px;
}

.plugin-features ul {
  margin: 0;
  padding-left: 20px;
  color: var(--vp-c-text-2);
}

.plugin-features li {
  margin: 4px 0;
}

.plugin-requirements {
  margin-bottom: 16px;
  padding: 12px;
  background: var(--vp-c-bg);
  border-radius: 6px;
  font-size: 13px;
  color: var(--vp-c-text-2);
}

.plugin-requirements strong {
  color: var(--vp-c-text-1);
}

.plugin-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.action-button {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.action-button.primary {
  background: var(--vp-c-brand-1);
  color: white;
}

.action-button.primary:hover:not(.copied) {
  background: var(--vp-c-brand-2);
}

.action-button.primary.copied {
  background: rgb(16, 185, 129);
}

.action-button.secondary {
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  border: 1px solid var(--vp-c-divider);
}

.action-button.secondary:hover {
  background: var(--vp-c-bg-mute);
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.action-button.accent {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.action-button.accent:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.4);
}

.code-preview {
  margin-top: 16px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
}

.code-preview pre {
  margin: 0;
  padding: 16px;
  background: var(--vp-c-bg);
  overflow-x: auto;
  font-size: 13px;
  line-height: 1.6;
  font-family: var(--vp-font-family-mono);
}

.code-preview code {
  color: var(--vp-c-text-1);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .plugin-card {
    padding: 16px;
  }

  .plugin-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .plugin-meta {
    flex-direction: column;
    gap: 8px;
  }

  .plugin-actions {
    flex-direction: column;
  }

  .action-button {
    width: 100%;
    justify-content: center;
  }
}
</style>

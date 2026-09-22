<template>
  <div class="copy-code-wrapper">
    <button 
      class="copy-code-button" 
      :class="{ copied }"
      @click="copyCode"
      :title="copied ? 'Copied!' : 'Copy to clipboard'"
      :aria-label="copied ? 'Code copied' : 'Copy code to clipboard'"
    >
      <span v-if="!copied" class="copy-icon">📋</span>
      <span v-else class="check-icon">✓</span>
      <span class="button-text">{{ copied ? 'Copied!' : 'Copy' }}</span>
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  code: {
    type: String,
    required: true
  }
})

const copied = ref(false)
let timeoutId = null

function copyCode() {
  // Clear any existing timeout
  if (timeoutId) {
    clearTimeout(timeoutId)
  }

  // Try modern clipboard API first
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(props.code)
      .then(() => {
        showCopiedFeedback()
      })
      .catch(err => {
        console.error('Failed to copy:', err)
        fallbackCopy()
      })
  } else {
    fallbackCopy()
  }
}

function fallbackCopy() {
  // Fallback for older browsers
  const textarea = document.createElement('textarea')
  textarea.value = props.code
  textarea.style.position = 'fixed'
  textarea.style.left = '-999999px'
  textarea.style.top = '-999999px'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()
  
  try {
    const successful = document.execCommand('copy')
    if (successful) {
      showCopiedFeedback()
    }
  } catch (err) {
    console.error('Fallback copy failed:', err)
  }
  
  document.body.removeChild(textarea)
}

function showCopiedFeedback() {
  copied.value = true
  timeoutId = setTimeout(() => {
    copied.value = false
    timeoutId = null
  }, 2000)
}
</script>

<style scoped>
.copy-code-wrapper {
  position: relative;
  display: inline-block;
}

.copy-code-button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  color: var(--vp-c-text-2);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.copy-code-button:hover {
  background: var(--vp-c-bg-mute);
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.copy-code-button.copied {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgb(16, 185, 129);
  color: rgb(16, 185, 129);
}

.copy-icon,
.check-icon {
  font-size: 14px;
  line-height: 1;
}

.button-text {
  font-size: 11px;
  letter-spacing: 0.02em;
}

/* Animation for copied state */
.copy-code-button.copied {
  animation: pulse 0.3s ease;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

/* Mobile styles */
@media (max-width: 640px) {
  .copy-code-button {
    padding: 6px 8px;
    font-size: 11px;
  }
  
  .button-text {
    display: none;
  }
  
  .copy-icon,
  .check-icon {
    font-size: 16px;
  }
}
</style>

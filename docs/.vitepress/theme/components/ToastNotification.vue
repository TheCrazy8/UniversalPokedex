<script setup>
import { ref, onMounted } from 'vue'

const toasts = ref([])
let idCounter = 0

const addToast = (message, type = 'info', duration = 3000) => {
  const id = idCounter++
  const toast = {
    id,
    message,
    type,
    duration,
    progress: 100,
    isPaused: false
  }
  
  toasts.value.push(toast)
  
  if (duration > 0) {
    startProgress(toast)
  }
  
  return id
}

const startProgress = (toast) => {
  const interval = 50 // Update every 50ms
  const decrement = (interval / toast.duration) * 100
  
  const progressInterval = setInterval(() => {
    if (toast.isPaused) return
    
    toast.progress -= decrement
    
    if (toast.progress <= 0) {
      clearInterval(progressInterval)
      removeToast(toast.id)
    }
  }, interval)
  
  toast.progressInterval = progressInterval
}

const removeToast = (id) => {
  const index = toasts.value.findIndex(t => t.id === id)
  if (index > -1) {
    const toast = toasts.value[index]
    if (toast.progressInterval) {
      clearInterval(toast.progressInterval)
    }
    toasts.value.splice(index, 1)
  }
}

const pauseToast = (toast) => {
  toast.isPaused = true
}

const resumeToast = (toast) => {
  toast.isPaused = false
}

// Expose methods globally
onMounted(() => {
  window.$toast = {
    success: (msg, duration) => addToast(msg, 'success', duration),
    error: (msg, duration) => addToast(msg, 'error', duration),
    warning: (msg, duration) => addToast(msg, 'warning', duration),
    info: (msg, duration) => addToast(msg, 'info', duration),
    
    // Custom toast with options
    show: (message, options = {}) => {
      const { type = 'info', duration = 3000 } = options
      return addToast(message, type, duration)
    },
    
    // Remove specific toast
    remove: (id) => removeToast(id),
    
    // Clear all toasts
    clear: () => {
      toasts.value. forEach(t => {
        if (t.progressInterval) clearInterval(t.progressInterval)
      })
      toasts.value = []
    }
  }
})

const getIcon = (type) => {
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  }
  return icons[type] || icons.info
}
</script>

<template>
  <div class="toast-container">
    <transition-group name="toast">
      <div 
        v-for="toast in toasts" 
        :key="toast.id"
        :class="['toast', `toast-${toast.type}`]"
        @click="removeToast(toast.id)"
        @mouseenter="pauseToast(toast)"
        @mouseleave="resumeToast(toast)"
        role="alert"
        aria-live="polite"
      >
        <div class="toast-content">
          <span class="toast-icon">{{ getIcon(toast.type) }}</span>
          <span class="toast-message">{{ toast.message }}</span>
          <button 
            class="toast-close" 
            @click. stop="removeToast(toast. id)"
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
        <div class="toast-progress" :style="{ width: toast.progress + '%' }"></div>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index:  10000;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
}

.toast {
  min-width: 320px;
  max-width: 500px;
  background: var(--vp-c-bg);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  cursor: pointer;
  pointer-events: auto;
  position: relative;
  border: 2px solid;
}

.toast-success {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.05);
}

.toast-error {
  border-color: #ef4444;
  background:  rgba(239, 68, 68, 0.05);
}

.toast-warning {
  border-color: #f59e0b;
  background:  rgba(245, 158, 11, 0.05);
}

.toast-info {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.05);
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
}

.toast-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.toast-message {
  flex: 1;
  color: var(--vp-c-text-1);
  font-weight: 500;
  line-height: 1.4;
  word-break: break-word;
}

.toast-close {
  background: none;
  border: none;
  color: var(--vp-c-text-2);
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
  padding:  0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
  flex-shrink: 0;
}

.toast-close:hover {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
}

.toast-progress {
  height: 4px;
  background: currentColor;
  transition: width 0.05s linear;
  position: absolute;
  bottom: 0;
  left: 0;
}

.toast-success .toast-progress {
  color: #10b981;
}

.toast-error .toast-progress {
  color: #ef4444;
}

.toast-warning .toast-progress {
  color: #f59e0b;
}

.toast-info .toast-progress {
  color: #3b82f6;
}

/* Animations */
.toast-enter-active {
  animation:  toastSlideIn 0.3s ease-out;
}

.toast-leave-active {
  animation: toastSlideOut 0.3s ease-in;
}

@keyframes toastSlideIn {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes toastSlideOut {
  from {
    transform: translateX(0) scale(1);
    opacity: 1;
  }
  to {
    transform: translateX(400px) scale(0.9);
    opacity: 0;
  }
}

.toast:hover .toast-progress {
  opacity: 0.5;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .toast-container {
    left: 20px;
    right: 20px;
    top: 70px;
  }
  
  .toast {
    min-width: auto;
    width: 100%;
  }
}

/* Dark mode adjustments */
.dark .toast {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .toast-enter-active,
  .toast-leave-active {
    animation:  none;
    transition: opacity 0.2s;
  }
}

/* Focus styles for accessibility */
.toast:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
}
</style>

<template>
  <Transition name="slide-up">
    <div v-if="showPrompt" class="pwa-install-prompt">
      <div class="prompt-content">
        <div class="prompt-icon">📱</div>
        <div class="prompt-text">
          <h3>Install BrightOS Docs</h3>
          <p>Install our app for offline access and a better experience!</p>
        </div>
        <div class="prompt-actions">
          <button @click="install" class="install-btn">Install</button>
          <button @click="dismiss" class="dismiss-btn">Not now</button>
        </div>
      </div>
      <button @click="dismissForever" class="close-btn" aria-label="Close">×</button>
    </div>
  </Transition>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const showPrompt = ref(false)
let deferredPrompt = null

onMounted(() => {
  // Check if user has already dismissed
  const dismissed = localStorage.getItem('pwa-install-dismissed')
  const dismissedForever = localStorage.getItem('pwa-install-never')
  
  if (dismissedForever) return

  // Listen for the beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e
    
    // Show prompt after a short delay (unless dismissed before)
    if (!dismissed) {
      setTimeout(() => {
        showPrompt.value = true
      }, 3000) // Show after 3 seconds
    }
  })

  // Check if already installed
  if (window.matchMedia('(display-mode: standalone)').matches) {
    // Already installed, don't show prompt
    return
  }
})

const install = async () => {
  if (!deferredPrompt) return
  
  deferredPrompt.prompt()
  const { outcome } = await deferredPrompt.userChoice
  
  if (outcome === 'accepted') {
    console.log('User accepted the install prompt')
  }
  
  deferredPrompt = null
  showPrompt.value = false
  localStorage.setItem('pwa-install-dismissed', 'true')
}

const dismiss = () => {
  showPrompt.value = false
  localStorage.setItem('pwa-install-dismissed', 'true')
  
  // Show again after 7 days
  setTimeout(() => {
    localStorage.removeItem('pwa-install-dismissed')
  }, 7 * 24 * 60 * 60 * 1000)
}

const dismissForever = () => {
  showPrompt.value = false
  localStorage.setItem('pwa-install-never', 'true')
}
</script>

<style scoped>
.pwa-install-prompt {
  position: fixed;
  bottom: 20px;
  right: 20px;
  max-width: 400px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  padding: 1.5rem;
}

.prompt-content {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.prompt-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.prompt-text h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  color: var(--vp-c-text-1);
}

.prompt-text p {
  margin: 0;
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
}

.prompt-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  width: 100%;
}

.install-btn, .dismiss-btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.install-btn {
  background: var(--vp-c-brand-1);
  color: white;
  flex: 1;
}

.install-btn:hover {
  background: var(--vp-c-brand-2);
}

.dismiss-btn {
  background: transparent;
  color: var(--vp-c-text-2);
  border: 1px solid var(--vp-c-divider);
}

.dismiss-btn:hover {
  background: var(--vp-c-bg-mute);
}

.close-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: transparent;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--vp-c-text-3);
  padding: 0.25rem;
  line-height: 1;
}

.close-btn:hover {
  color: var(--vp-c-text-1);
}

@media (max-width: 768px) {
  .pwa-install-prompt {
    bottom: 10px;
    right: 10px;
    left: 10px;
    max-width: none;
  }
  
  .prompt-content {
    flex-direction: column;
  }
}

.slide-up-enter-active, .slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  transform: translateY(100%);
  opacity: 0;
}

.slide-up-leave-to {
  transform: translateY(20px);
  opacity: 0;
}
</style>

<script setup>
import { ref, onMounted } from 'vue'

const showPrompt = ref(false)
let registration = null

onMounted(async () => {
  if ('serviceWorker' in navigator) {
    registration = await navigator.serviceWorker.getRegistration()
    
    // Listen for updates
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      showPrompt.value = true
    })
  }
})

const updateApp = () => {
  if (registration && registration.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    window.location.reload()
  }
}

const dismissPrompt = () => {
  showPrompt.value = false
}
</script>

<template>
  <div v-if="showPrompt" class="pwa-prompt">
    <div class="pwa-prompt-content">
      <p>🔥 A new version is available! </p>
      <div class="pwa-prompt-actions">
        <button @click="updateApp" class="pwa-update-btn">Update Now</button>
        <button @click="dismissPrompt" class="pwa-dismiss-btn">Later</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pwa-prompt {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  background: linear-gradient(135deg, #ff4500, #ff6b35);
  color: white;
  padding: 20px;
  border-radius:  12px;
  box-shadow:  0 8px 32px rgba(255, 69, 0, 0.4);
  max-width: 350px;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateY(100px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.pwa-prompt-content p {
  margin: 0 0 16px 0;
  font-weight: 600;
  font-size: 16px;
}

.pwa-prompt-actions {
  display: flex;
  gap:  10px;
}

.pwa-update-btn,
.pwa-dismiss-btn {
  padding: 8px 16px;
  border:  none;
  border-radius:  6px;
  font-weight: 600;
  cursor: pointer;
  transition:  all 0.2s;
}

.pwa-update-btn {
  background: white;
  color: #ff4500;
  flex:  1;
}

.pwa-update-btn:hover {
  background: #f0f0f0;
  transform: translateY(-2px);
}

.pwa-dismiss-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.pwa-dismiss-btn:hover {
  background:  rgba(255, 255, 255, 0.3);
}

@media (max-width: 768px) {
  .pwa-prompt {
    bottom: 10px;
    right: 10px;
    left: 10px;
    max-width: none;
  }
}
</style>
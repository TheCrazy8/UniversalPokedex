<script setup>
import { ref, onMounted } from 'vue'

const show = ref(true)
const storageKey = 'announcement-dismissed-v1'

onMounted(() => {
  show.value = ! localStorage.getItem(storageKey)
})

const dismiss = () => {
  localStorage.setItem(storageKey, 'true')
  show.value = false
}
</script>

<template>
  <div v-if="show" class="announcement-banner" role="banner" aria-label="Site announcement">
    <div class="announcement-content">
      <span>Hi There</span>
      <button @click="dismiss" class="dismiss-btn" aria-label="Dismiss announcement">✕</button>
    </div>
  </div>
</template>

<style scoped>
.announcement-banner {
  position: sticky;
  top: 0;
  z-index: 999;
  background: linear-gradient(135deg, #ff4500, #ff6b35);
  color: white;
  padding: 12px 24px;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(255, 69, 0, 0.3);
}

.announcement-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.dismiss-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  transition: background 0.2s;
}

.dismiss-btn:hover {
  background:  rgba(255, 255, 255, 0.3);
}

@media (max-width: 768px) {
  .announcement-banner {
    font-size: 13px;
    padding: 10px 16px;
  }
}
</style>

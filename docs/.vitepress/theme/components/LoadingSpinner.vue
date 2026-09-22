<template>
  <div class="loading-container" v-if="loading">
    <div class="spinner"></div>
    <p v-if="text">{{ text }}</p>
  </div>
  <slot v-else></slot>
</template>

<script setup>
defineProps({
  loading: Boolean,
  text: String
})
</script>

<style scoped>
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-left-color: var(--vp-c-brand-1);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@media (prefers-color-scheme: dark) {
  .spinner {
    border-color: rgba(255, 255, 255, 0.1);
    border-left-color: var(--vp-c-brand-1);
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-container p {
  margin-top: 1rem;
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
}
</style>

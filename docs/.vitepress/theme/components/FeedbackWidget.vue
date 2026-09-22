<script setup>
import { ref } from 'vue'

const feedback = ref(null)
const showThankYou = ref(false)

const handleFeedback = (isHelpful) => {
  feedback.value = isHelpful
  showThankYou.value = true
  
  // Optional: Send to analytics
  console.log(`Page helpful: ${isHelpful}`)
  
  setTimeout(() => {
    showThankYou.value = false
  }, 3000)
}
</script>

<template>
  <div class="feedback-widget" role="region" aria-label="Page feedback">
    <div v-if="! showThankYou" class="feedback-question">
      <p id="feedback-label">Was this page helpful?</p>
      <div class="feedback-buttons" role="group" aria-labelledby="feedback-label">
        <button @click="handleFeedback(true)" class="feedback-btn" aria-label="Yes, this page was helpful">
          👍 Yes
        </button>
        <button @click="handleFeedback(false)" class="feedback-btn" aria-label="No, this page was not helpful">
          👎 No
        </button>
      </div>
    </div>
    <div v-else class="feedback-thanks" aria-live="polite">
      <p>✨ Thanks for your feedback! </p>
    </div>
  </div>
</template>

<style scoped>
.feedback-widget {
  margin: 48px 0 24px;
  padding: 24px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  text-align: center;
}

.feedback-question p {
  margin: 0 0 16px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.feedback-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.feedback-btn {
  padding: 10px 24px;
  border: 2px solid var(--vp-c-brand-1);
  background: transparent;
  color: var(--vp-c-brand-1);
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.feedback-btn:hover {
  background: var(--vp-c-brand-1);
  color: white;
  transform: translateY(-2px);
}

.feedback-thanks {
  color: var(--vp-c-brand-1);
  font-weight: 600;
  font-size: 16px;
}
</style>
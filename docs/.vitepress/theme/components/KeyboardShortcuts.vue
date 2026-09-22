<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'

const showDialog = ref(false)
const dialogRef = ref(null)
const closeButtonRef = ref(null)

watch(showDialog, async (val) => {
  if (val) {
    await nextTick()
    closeButtonRef.value?.focus()
  }
})

const isMac = computed(() => {
  if (typeof navigator === 'undefined') return false
  return /Mac|iPhone|iPad|iPod/.test(navigator.userAgent)
})

const shortcuts = computed(() => [
  { keys: [isMac.value ? '⌘' : 'Ctrl', 'K'], description: 'Open search' },
  { keys: ['?'], description: 'Show keyboard shortcuts' },
  { keys: ['Esc'], description: 'Close dialog / search' },
  { keys: ['↑', '↓'], description: 'Navigate search results' },
  { keys: ['Enter'], description: 'Select search result' },
  { keys: ['t'], description: 'Scroll to top' },
])

function isEditableElement(target) {
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
}

function handleKeyDown(e) {
  if (isEditableElement(e.target)) {
    return
  }

  if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
    e.preventDefault()
    showDialog.value = !showDialog.value
  }

  if (e.key === 'Escape') {
    showDialog.value = false
  }

  if (e.key === 't' && !e.ctrlKey && !e.metaKey && !showDialog.value) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="shortcuts-fade">
      <div v-if="showDialog" class="shortcuts-overlay" @click.self="showDialog = false" role="dialog" aria-modal="true" aria-labelledby="shortcuts-title">
        <div class="shortcuts-dialog">
          <div class="shortcuts-header">
            <h3 id="shortcuts-title">⌨️ Keyboard Shortcuts</h3>
            <button ref="closeButtonRef" class="shortcuts-close" @click="showDialog = false" aria-label="Close">✕</button>
          </div>
          <div class="shortcuts-list">
            <div v-for="shortcut in shortcuts" :key="shortcut.description" class="shortcut-item">
              <div class="shortcut-keys">
                <kbd v-for="key in shortcut.keys" :key="key">{{ key }}</kbd>
              </div>
              <span class="shortcut-description">{{ shortcut.description }}</span>
            </div>
          </div>
          <div class="shortcuts-footer">
            Press <kbd>?</kbd> to toggle this dialog
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.shortcuts-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.shortcuts-dialog {
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  padding: 24px;
  max-width: 420px;
  width: 90%;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
}

.shortcuts-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.shortcuts-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--vp-c-text-1);
}

.shortcuts-close {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: var(--vp-c-text-2);
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s;
}

.shortcuts-close:hover {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
}

.shortcuts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.shortcut-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
}

.shortcut-keys {
  display: flex;
  gap: 4px;
}

kbd {
  display: inline-block;
  padding: 3px 8px;
  font-size: 12px;
  font-family: var(--vp-font-family-mono);
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-border);
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  font-weight: 600;
  min-width: 24px;
  text-align: center;
}

.shortcut-description {
  font-size: 14px;
  color: var(--vp-c-text-2);
}

.shortcuts-footer {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--vp-c-divider);
  text-align: center;
  font-size: 13px;
  color: var(--vp-c-text-3);
}

.shortcuts-fade-enter-active,
.shortcuts-fade-leave-active {
  transition: opacity 0.2s ease;
}

.shortcuts-fade-enter-from,
.shortcuts-fade-leave-to {
  opacity: 0;
}
</style>

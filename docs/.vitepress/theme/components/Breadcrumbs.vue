<script setup>
import { useData, useRoute } from 'vitepress'
import { computed } from 'vue'

const { site } = useData()
const route = useRoute()

const breadcrumbs = computed(() => {
  const path = route.path
  const parts = path.split('/').filter(p => p && p !== 'index.html')
  
  const crumbs = [{ text: 'Home', link: '/' }]
  
  let currentPath = ''
  parts.forEach((part, index) => {
    currentPath += '/' + part
    const text = part.replace('.html', '').replace(/-/g, ' ')
    crumbs.push({
      text: text.charAt(0).toUpperCase() + text.slice(1),
      link: currentPath,
      isLast: index === parts.length - 1
    })
  })
  
  return crumbs
})
</script>

<template>
  <nav class="breadcrumbs" v-if="breadcrumbs.length > 1">
    <span v-for="(crumb, index) in breadcrumbs" :key="crumb.link">
      <a v-if="!crumb.isLast" :href="crumb.link">{{ crumb.text }}</a>
      <span v-else class="current">{{ crumb.text }}</span>
      <span v-if="index < breadcrumbs.length - 1" class="separator">→</span>
    </span>
  </nav>
</template>

<style scoped>
.breadcrumbs {
  padding: 16px 0;
  font-size: 14px;
  color: var(--vp-c-text-2);
  border-bottom: 1px solid var(--vp-c-divider);
  margin-bottom: 24px;
}

.breadcrumbs a {
  color: var(--vp-c-brand-1);
  text-decoration: none;
  font-weight: 500;
}

.breadcrumbs a:hover {
  color: var(--vp-c-brand-2);
}

.current {
  color: var(--vp-c-text-1);
  font-weight: 600;
}

.separator {
  margin: 0 8px;
  color: var(--vp-c-text-3);
}
</style>
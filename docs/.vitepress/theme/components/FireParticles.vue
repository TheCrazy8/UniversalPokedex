<script setup>
import { onMounted, ref } from 'vue'

const containerRef = ref(null)
let animationFrameId = null

onMounted(() => {
  createCometTrail()
})

function createCometTrail() {
  const container = containerRef.value
  if (!container) return
  
  let mouseX = window.innerWidth / 2
  let mouseY = window.innerHeight / 2
  
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX
    mouseY = e.clientY
  })
  
  function animate() {
    if (Math.random() > 0.7) {
      const particle = document.createElement('div')
      particle.className = 'comet-particle'
      particle.style.left = mouseX + 'px'
      particle.style.top = mouseY + 'px'
      particle.style.animationDuration = (Math.random() * 0.8 + 0.5) + 's'
      container.appendChild(particle)
      
      setTimeout(() => particle.remove(), 1000)
    }
    
    animationFrameId = requestAnimationFrame(animate)
  }
  
  animate()
}
</script>

<template>
  <div ref="containerRef" class="comet-trail"></div>
</template>

<style scoped>
.comet-trail {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.comet-particle {
  position: absolute;
  width: 6px;
  height: 6px;
  background: radial-gradient(circle, #ffffff, #00d4ff);
  border-radius: 50%;
  animation: comet-fade linear forwards;
  box-shadow: 0 0 8px rgba(0, 212, 255, 0.8), 0 0 16px rgba(0, 212, 255, 0.4);
  filter: blur(0.5px);
  transform: translate(-50%, -50%);
}

@keyframes comet-fade {
  0% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0);
  }
}
</style>

<script setup>
import { onMounted, onUnmounted } from 'vue'

let canvas
let ctx
let animationFrame

let mouseX = 0
let mouseY = 0
let cometX = 0
let cometY = 0
let initialized = false

const particles = []

onMounted(() => {
  canvas = document.createElement('canvas')

  Object.assign(canvas.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: '9999'
  })

  document.body.appendChild(canvas)

  ctx = canvas.getContext('2d')

  resizeCanvas()

  window.addEventListener('mousemove', updateMouse)
  window.addEventListener('resize', resizeCanvas)

  animate()
})

onUnmounted(() => {
  window.removeEventListener('mousemove', updateMouse)
  window.removeEventListener('resize', resizeCanvas)

  cancelAnimationFrame(animationFrame)

  if (canvas) {
    canvas.remove()
  }
})

function updateMouse(event) {
  mouseX = event.clientX
  mouseY = event.clientY

  if (!initialized) {
    cometX = mouseX
    cometY = mouseY
    initialized = true
  }
}

function resizeCanvas() {
  if (!canvas || !ctx) return

  const pixelRatio = window.devicePixelRatio || 1

  canvas.width = window.innerWidth * pixelRatio
  canvas.height = window.innerHeight * pixelRatio

  canvas.style.width = `${window.innerWidth}px`
  canvas.style.height = `${window.innerHeight}px`

  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
}

function createTailParticles(speedX, speedY) {
  const speed = Math.hypot(speedX, speedY)

  const particleCount = Math.min(
    8,
    Math.max(2, Math.ceil(speed / 2))
  )

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: cometX + (Math.random() - 0.5) * 6,
      y: cometY + (Math.random() - 0.5) * 6,

      velocityX:
        -speedX * (Math.random() * 0.25 + 0.05) +
        (Math.random() - 0.5) * 0.8,

      velocityY:
        -speedY * (Math.random() * 0.25 + 0.05) +
        (Math.random() - 0.5) * 0.8,

      size: Math.random() * 5 + 2,
      life: 1,
      decay: Math.random() * 0.018 + 0.018
    })
  }

  if (particles.length > 800) {
    particles.splice(0, particles.length - 800)
  }
}

function mixColor(colorA, colorB, amount) {
  return colorA.map((value, index) =>
    Math.round(value + (colorB[index] - value) * amount)
  )
}

function getTailColor(life) {
  const paleYellow = [255, 250, 190]
  const lightBlue = [125, 210, 255]
  const darkBlue = [20, 45, 130]

  // New particles closest to the head:
  // pale yellow fading into light blue.
  if (life > 0.55) {
    const amount = (1 - life) / 0.45
    return mixColor(paleYellow, lightBlue, amount)
  }

  // Older particles farther down the tail:
  // light blue fading into dark blue.
  const amount = (0.55 - life) / 0.55
  return mixColor(lightBlue, darkBlue, amount)
}

function drawCometHead() {
  const glow = ctx.createRadialGradient(
    cometX,
    cometY,
    0,
    cometX,
    cometY,
    26
  )

  glow.addColorStop(0, 'rgba(255, 255, 230, 1)')
  glow.addColorStop(0.18, 'rgba(255, 250, 190, 1)')
  glow.addColorStop(0.45, 'rgba(180, 230, 255, 0.8)')
  glow.addColorStop(0.75, 'rgba(90, 160, 235, 0.35)')
  glow.addColorStop(1, 'rgba(40, 80, 180, 0)')

  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(cometX, cometY, 26, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = 'rgba(255, 255, 225, 1)'
  ctx.beginPath()
  ctx.arc(cometX, cometY, 4, 0, Math.PI * 2)
  ctx.fill()
}

function drawParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const particle = particles[i]

    particle.x += particle.velocityX
    particle.y += particle.velocityY

    particle.velocityX *= 0.98
    particle.velocityY *= 0.98

    particle.life -= particle.decay
    particle.size *= 0.985

    if (particle.life <= 0 || particle.size <= 0.1) {
      particles.splice(i, 1)
      continue
    }

    const radius = Math.max(0.1, particle.size)
    const [red, green, blue] = getTailColor(particle.life)

    const gradient = ctx.createRadialGradient(
      particle.x,
      particle.y,
      0,
      particle.x,
      particle.y,
      radius * 2
    )

    gradient.addColorStop(
      0,
      `rgba(${red}, ${green}, ${blue}, ${particle.life})`
    )

    gradient.addColorStop(
      0.35,
      `rgba(${red}, ${green}, ${blue}, ${particle.life * 0.7})`
    )

    gradient.addColorStop(
      1,
      `rgba(${red}, ${green}, ${blue}, 0)`
    )

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(
      particle.x,
      particle.y,
      radius * 2,
      0,
      Math.PI * 2
    )
    ctx.fill()
  }
}

function animate() {
  if (!ctx || !canvas) return

  ctx.clearRect(
    0,
    0,
    window.innerWidth,
    window.innerHeight
  )

  if (initialized) {
    const previousX = cometX
    const previousY = cometY

    cometX += (mouseX - cometX) * 0.28
    cometY += (mouseY - cometY) * 0.28

    const speedX = cometX - previousX
    const speedY = cometY - previousY
    const speed = Math.hypot(speedX, speedY)

    if (speed > 0.05) {
      createTailParticles(speedX, speedY)
    }

    ctx.save()
    ctx.globalCompositeOperation = 'lighter'

    drawParticles()
    drawCometHead()

    ctx.restore()
  }

  animationFrame = requestAnimationFrame(animate)
}
</script>

<template>
  <div />
</template>

<template>
  <div class="github-auth">
    <button class="github-auth__btn" @click="openModal" v-if="!isAuthenticated">
      <slot>Sign in with GitHub</slot>
    </button>

    <div v-if="showModal" class="github-auth__modal">
      <div class="github-auth__content">
        <button class="close" @click="closeModal">✕</button>
        <h3>{{ message || 'Sign in with GitHub' }}</h3>

        <div v-if="stage === 'start'">
          <p>To sign in, open the link below and enter the code shown.</p>
          <p>
            <strong>Code:</strong>
            <span class="code">{{ deviceInfo?.user_code || '—' }}</span>
          </p>
          <p>
            <strong>Verification URL:</strong>
            <a :href="deviceInfo?.verification_uri" target="_blank" v-if="deviceInfo?.verification_uri">{{ deviceInfo.verification_uri }}</a>
            <span v-else>—</span>
          </p>
          <div class="actions">
            <button @click="startLogin" :disabled="starting">Get Code</button>
            <button @click="openVerification" v-if="deviceInfo?.verification_uri">Open Verification</button>
          </div>
        </div>

        <div v-if="stage === 'poll'">
          <p>Waiting for you to authorize... <em v-if="expiresIn">Expires in {{ expiresIn }}s</em></p>
          <p>Status: {{ status }}</p>
          <div class="actions">
            <button @click="cancelPoll">Cancel</button>
          </div>
        </div>

        <div v-if="stage === 'success'">
          <p>Signed in as <strong>{{ user?.login }}</strong></p>
          <div class="actions">
            <button @click="closeModal">Done</button>
            <button @click="signOut">Sign Out</button>
          </div>
        </div>

        <div v-if="stage === 'error'">
          <p class="error">Error: {{ errorMessage }}</p>
          <div class="actions">
            <button @click="closeModal">Close</button>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="isAuthenticated" class="github-auth__signed-in">
      <slot name="signed-in">
        Signed in
      </slot>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import githubAuth from '../config/github-auth.js' // path matches the config module above

// Props
const props = defineProps({
  message: { type: String, default: '' },
  showSignIn: { type: Boolean, default: true },
  showRateLimit: { type: Boolean, default: false }
})

// local state
const showModal = ref(false)
const starting = ref(false)
const stage = ref('start') // start | poll | success | error
const deviceInfo = ref(null)
const status = ref('')
const errorMessage = ref('')
const user = ref(null)
const expiresIn = ref(null)
let expiresTimer = null

const isAuthenticated = computed(() => githubAuth.isAuthenticated())

function openModal() {
  showModal.value = true
  stage.value = 'start'
  status.value = ''
  errorMessage.value = ''
  deviceInfo.value = null
  user.value = null
}

function closeModal() {
  showModal.value = false
  stopExpiryTimer()
  githubAuth.cancelPolling()
}

function updateExpiry(seconds) {
  stopExpiryTimer()
  expiresIn.value = seconds
  if (seconds && seconds > 0) {
    expiresTimer = setInterval(() => {
      expiresIn.value = expiresIn.value - 1
      if (expiresIn.value <= 0) stopExpiryTimer()
    }, 1000)
  }
}

function stopExpiryTimer() {
  if (expiresTimer) {
    clearInterval(expiresTimer)
    expiresTimer = null
  }
}

async function startLogin() {
  starting.value = true
  stage.value = 'start'
  status.value = 'Requesting device code...'
  try {
    const info = await githubAuth.startDeviceFlow()
    deviceInfo.value = info
    updateExpiry(info.expires_in || 0)
    status.value = 'Device code received. Open verification URL and enter the code.'
  } catch (err) {
    console.error(err)
    errorMessage.value = err.message || String(err)
    stage.value = 'error'
  } finally {
    starting.value = false
  }
}

function openVerification() {
  if (deviceInfo.value?.verification_uri) {
    window.open(deviceInfo.value.verification_uri, '_blank')
  }
}

async function startPoll() {
  if (!deviceInfo.value?.device_code) {
    errorMessage.value = 'No device code available'
    stage.value = 'error'
    return
  }
  stage.value = 'poll'
  status.value = 'Waiting for authorization...'
  try {
    const res = await githubAuth.pollForToken(deviceInfo.value.device_code, 300)
    if (res && res.token && res.token.access_token) {
      user.value = res.user || null
      status.value = 'Authorized'
      stage.value = 'success'
    } else {
      throw new Error('No token returned')
    }
  } catch (err) {
    console.error(err)
    errorMessage.value = err.message || String(err)
    stage.value = 'error'
  }
}

function cancelPoll() {
  githubAuth.cancelPolling()
  status.value = 'Polling cancelled'
  stage.value = 'start'
}

function signOut() {
  githubAuth.clearToken()
  user.value = null
  closeModal()
}

// When user clicks "Get Code" we show code; start polling if they choose to "Open Verification" or you can start polling automatically:
async function startLoginAndPoll() {
  await startLogin()
  // Autostart polling after code is shown
  startPoll()
}

onMounted(() => {
  // If token already present, try to fetch user info via backend or cached user
  if (isAuthenticated.value) {
    // Optionally fetch user info from backend or GitHub via server endpoint
    // For now, nothing is done here.
  }
})
</script>

<style scoped>
.github-auth__modal {
  position: fixed;
  left: 0; top: 0; right: 0; bottom: 0;
  display:flex; align-items:center; justify-content:center;
  background: rgba(0,0,0,0.5);
  z-index: 1000;
}
.github-auth__content {
  background: #000; padding: 1.25rem; border-radius: 8px; width: 440px; max-width: calc(100% - 32px);
  position: relative;
}
.github-auth__btn { /* simple button style */ }
.code { font-family: monospace; background:#000; padding:0.15rem 0.4rem; border-radius:4px; }
.error { color: crimson; }
.actions { margin-top: 1rem; display:flex; gap:0.5rem; }
.close { position: absolute; right: 8px; top: 8px; background: transparent; border: none; font-size: 16px; cursor: pointer; }
</style>

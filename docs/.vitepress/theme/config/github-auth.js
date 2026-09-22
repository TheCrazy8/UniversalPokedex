// GitHub OAuth Device Flow client utilities — modified to use backend device-flow server
// Exports:
//   default export: githubAuth (instance of GitHubAuth)
//   named exports: GITHUB_CONFIG, GitHubAuth, githubFetch
//
// githubFetch is a small wrapper around fetch that:
// - prefixes relative paths with https://api.github.com
// - adds Authorization header from stored token (localStorage) when available
// - sets Accept header for GitHub v3 API
// - clears stored token on 401 responses (best-effort, client-side only)
//
// IMPORTANT: This module must be usable during SSR builds. It avoids access to window/localStorage
// when not running in a browser.

const BACKEND_BASE = (typeof window !== 'undefined' && window.__BACKEND_BASE__) || ''

const GITHUB_CONFIG = {
  // Public client ID (kept for informational / legacy). Device flow works through backend by default.
  clientId: import.meta.env.VITE_GITHUB_CLIENT_ID || 'Ov23li1xL6Hj2CflCVf2',

  // Backend endpoints (relative by default). If backend is on separate origin, set window.__BACKEND_BASE__ in template.
  // Example backends often expose POST /device/start and POST /device/poll
  deviceCodeUrl: `${BACKEND_BASE}/device/start`,
  accessTokenUrl: `${BACKEND_BASE}/device/poll`,

  // Scope requested (backend will forward to GitHub during device start)
  scope: import.meta.env.VITE_GITHUB_OAUTH_SCOPE || 'public_repo',

  // Storage keys
  tokenKey: 'github_oauth_token',
  tokenExpiryKey: 'github_oauth_expiry',

  // Polling interval fallback (seconds). Backend returns recommended interval; frontend does not call GitHub directly.
  pollInterval: 5
}

class GitHubAuth {
  constructor() {
    this.token = typeof window !== 'undefined' ? this.loadToken() : null
    this.deviceInfo = null
    this.pollAbortController = null
  }

  loadToken() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return null
    try {
      const token = localStorage.getItem(GITHUB_CONFIG.tokenKey)
      const expiry = localStorage.getItem(GITHUB_CONFIG.tokenExpiryKey)
      if (token && expiry) {
        const expiryDate = new Date(expiry)
        if (expiryDate > new Date()) {
          return token
        } else {
          this.clearToken()
        }
      }
    } catch (err) {
      // ignore
      console.error('Error loading GitHub token:', err)
    }
    return null
  }

  saveToken(token, expiresIn = 28800) {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return
    try {
      const expiry = new Date()
      expiry.setSeconds(expiry.getSeconds() + expiresIn)
      localStorage.setItem(GITHUB_CONFIG.tokenKey, token)
      localStorage.setItem(GITHUB_CONFIG.tokenExpiryKey, expiry.toISOString())
      this.token = token
    } catch (err) {
      console.error('Error saving GitHub token:', err)
    }
  }

  clearToken() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return
    try {
      localStorage.removeItem(GITHUB_CONFIG.tokenKey)
      localStorage.removeItem(GITHUB_CONFIG.tokenExpiryKey)
      this.token = null
    } catch (err) {
      console.error('Error clearing GitHub token:', err)
    }
  }

  isAuthenticated() {
    return !!this.token
  }

  getToken() {
    return this.token
  }

  // Start device flow via backend (preferred) or directly against GitHub if BACKEND_BASE is empty.
  // Note: many backends expect POST /device/start. If your backend returns 404 on GET, switch to POST.
  async startDeviceFlow() {
    if (typeof window === 'undefined') {
      throw new Error('startDeviceFlow must be called from the browser')
    }

    const rawUrl = GITHUB_CONFIG.deviceCodeUrl || ''
    const url = new URL(rawUrl, window.location.origin).toString()

    // If no backend is configured (BACKEND_BASE === ''), call GitHub's public device endpoint directly.
    // GitHub expects application/x-www-form-urlencoded POST for /login/device/code.
    const callingGitHubDirectly = rawUrl === '' || /github\.com\/login\/device\/code/.test(url)

    try {
      let res
      if (callingGitHubDirectly) {
        // Call GitHub directly
        const body = new URLSearchParams({
          client_id: GITHUB_CONFIG.clientId,
          scope: GITHUB_CONFIG.scope
        })
        res = await fetch('https://github.com/login/device/code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body.toString()
        })
      } else {
        // Call backend. Many backends expect POST JSON; if your backend expects GET, change to method: 'GET'.
        res = await fetch(url, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ client_id: GITHUB_CONFIG.clientId, scope: GITHUB_CONFIG.scope })
        })
      }

      if (!res.ok) {
        // try to parse JSON error or raw text for better diagnostics
        let errBody = await res.text().catch(() => '')
        let parsed = {}
        try { parsed = JSON.parse(errBody || '{}') } catch (e) { /* not JSON */ }
        const message = parsed.message || errBody || `startDeviceFlow failed: ${res.status}`
        throw new Error(message)
      }

      // Parse JSON response (GitHub returns device_code, user_code, verification_uri, expires_in, interval)
      const data = await res.json()
      this.deviceInfo = data
      return data
    } catch (err) {
      // surface a clearer error
      const msg = err && err.message ? err.message : String(err)
      // Useful debug info: expose the URL we tried (will be same-origin absolute URL)
      throw new Error(`startDeviceFlow failed calling ${url}: ${msg}`)
    }
  }

  // Poll for token by asking backend to poll GitHub on our behalf
  // maxWait in seconds
  async pollForToken(deviceCode, maxWait = 300) {
    if (typeof window === 'undefined') {
      throw new Error('pollForToken must be called from the browser')
    }
    const url = new URL(GITHUB_CONFIG.accessTokenUrl, window.location.origin).toString()
    // allow cancellation
    this.pollAbortController = new AbortController()
    const signal = this.pollAbortController.signal

    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_code: deviceCode, max_wait: maxWait }),
      signal
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.message || `pollForToken failed: ${res.status}`)
    }
    const body = await res.json()
    if (body && body.token && body.token.access_token) {
      // Optionally, backend may return token expiry or we assume default
      // Save token locally (frontend storage). It's recommended to create a server session instead.
      this.saveToken(body.token.access_token)
      return body
    }
    throw new Error('pollForToken succeeded but no token was returned')
  }

  cancelPolling() {
    try {
      if (this.pollAbortController) this.pollAbortController.abort()
    } catch (e) {
      // ignore
    } finally {
      this.pollAbortController = null
    }
  }

  // High-level login: start device flow then poll. Returns { success, token, user | error }
  async login({ maxWait = 300, openVerificationInNewTab = false } = {}) {
    if (typeof window === 'undefined') return { success: false, error: 'Not running in browser' }
    try {
      const info = await this.startDeviceFlow()
      if (openVerificationInNewTab && info.verification_uri) {
        try { window.open(info.verification_uri, '_blank') } catch (e) {}
      }
      const result = await this.pollForToken(info.device_code, maxWait)
      return { success: true, token: result.token, user: result.user }
    } catch (err) {
      return { success: false, error: err.message || String(err) }
    }
  }
}

// --- githubFetch helper (named export) ---
// Usage in components:
// import { githubFetch } from '../config/github-auth.js'
// const res = await githubFetch('/repos/owner/repo/commits?per_page=30')
// or githubFetch('https://api.github.com/whatever', { method: 'GET' })
async function githubFetch(input, init = {}) {
  // If running under SSR, just throw or return a lightweight stub that fails gracefully.
  if (typeof fetch === 'undefined') {
    throw new Error('githubFetch: fetch is not available (SSR). Call from browser only.')
  }

  // Normalize URL: if input is relative (starts with /), prefix with GitHub API base
  let url = input
  if (typeof input === 'string' && input.startsWith('/')) {
    url = `https://api.github.com${input}`
  }

  // Prepare headers
  const headers = new Headers(init.headers || {})
  // Add Accept header for GitHub v3 unless already present
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/vnd.github.v3+json')
  }

  // Add Authorization if token present in localStorage
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const token = localStorage.getItem(GITHUB_CONFIG.tokenKey)
      if (token && !headers.has('Authorization')) {
        // token typically stored as plain token from device flow
        headers.set('Authorization', `token ${token}`)
      }
    }
  } catch (e) {
    // localStorage might throw in some environments; ignore
    console.warn('githubFetch: could not access localStorage', e)
  }

  const merged = Object.assign({}, init, { headers, credentials: init.credentials || 'same-origin' })

  const res = await fetch(url, merged)

  // If unauthorized, clear stored token (best-effort) so UI can re-authenticate
  if (res.status === 401) {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.removeItem(GITHUB_CONFIG.tokenKey)
        localStorage.removeItem(GITHUB_CONFIG.tokenExpiryKey)
      }
    } catch (e) { /* ignore */ }
  }

  return res
}

// Export a singleton instance for easy import
const githubAuth = new GitHubAuth()
export default githubAuth
export { GITHUB_CONFIG, GitHubAuth, githubFetch }

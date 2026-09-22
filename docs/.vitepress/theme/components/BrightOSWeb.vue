<template>
  <div class="brightos-web">
    <div class="control-panel">
      <div class="section">
        <h3>Script Management</h3>
        <div class="button-group">
          <label for="script-upload" class="button primary">
            Load Script
            <input 
              id="script-upload" 
              type="file" 
              accept=".py,.js" 
              @change="handleScriptUpload" 
              style="display: none;"
            />
          </label>
          <select v-model="selectedScript" class="script-select">
            <option value="" disabled>Select a script</option>
            <option v-for="script in scripts" :key="script.name" :value="script.name">
              {{ script.name }}
            </option>
          </select>
          <button 
            @click="runScript" 
            :disabled="!selectedScript || isRunning"
            class="button primary"
          >
            {{ isRunning ? 'Running...' : 'Run Script' }}
          </button>
          <button 
            @click="stopScript" 
            :disabled="!isRunning"
            class="button secondary"
          >
            Stop
          </button>
        </div>
      </div>

      <div class="section">
        <h3>Arduino Control</h3>
        <div class="button-group">
          <button 
            @click="connectArduino" 
            :disabled="isArduinoConnected"
            class="button primary"
          >
            {{ isArduinoConnected ? 'Connected' : 'Connect Arduino' }}
          </button>
          <button 
            @click="disconnectArduino" 
            :disabled="!isArduinoConnected"
            class="button secondary"
          >
            Disconnect
          </button>
          <span v-if="isArduinoConnected" class="status-indicator connected">
            ● Connected
          </span>
          <span v-else-if="!serialSupported" class="status-indicator error">
            ⚠ Web Serial API not supported
          </span>
        </div>
      </div>

      <div class="section">
        <h3>Plugin Management</h3>
        <div class="button-group">
          <label for="plugin-upload" class="button primary">
            Load Plugin
            <input 
              id="plugin-upload" 
              type="file" 
              accept=".py,.js" 
              @change="handlePluginUpload" 
              style="display: none;"
            />
          </label>
          <div class="plugin-list">
            <span v-if="plugins.length === 0" class="empty-state">No plugins loaded</span>
            <span v-for="plugin in plugins" :key="plugin.name" class="plugin-item">
              {{ plugin.name }}
            </span>
          </div>
        </div>
      </div>

      <div class="section">
        <h3>Workspace</h3>
        <div class="button-group">
          <button @click="clearWorkspace" class="button secondary" title="Clear all scripts and plugins">
            Clear Workspace
          </button>
          <span class="workspace-info">
            {{ scripts.length }} script(s), {{ plugins.length }} plugin(s) loaded
          </span>
        </div>
      </div>
    </div>

    <div class="output-panel">
      <div class="output-header">
        <h3>Output</h3>
        <div class="output-controls">
          <label class="auto-scroll-toggle">
            <input type="checkbox" v-model="autoScroll" />
            <span>Auto-scroll</span>
          </label>
          <button @click="copyOutput" class="button small" title="Copy output to clipboard">
            📋 Copy
          </button>
          <button @click="exportOutput" class="button small" title="Export output as file">
            💾 Export
          </button>
          <button @click="clearOutput" class="button small" title="Clear output">
            🗑️ Clear
          </button>
        </div>
      </div>
      <div class="output-content" ref="outputContent">
        <div v-if="outputLines.length === 0" class="empty-state">
          Output will appear here...
        </div>
        <div v-for="(line, index) in outputLines" :key="index" class="output-line">
          <span class="timestamp">{{ line.timestamp }}</span>
          <span :class="['message', line.type]">{{ line.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'

// State management
const scripts = ref([])
const plugins = ref([])
const selectedScript = ref('')
const outputLines = ref([])
const isRunning = ref(false)
const isArduinoConnected = ref(false)
const serialSupported = ref(false)
const outputContent = ref(null)
const autoScroll = ref(true)

// Serial port management
let serialPort = null
let reader = null
let writer = null

// Check for Web Serial API support
onMounted(() => {
  serialSupported.value = 'serial' in navigator
  loadWorkspace()
  loadExampleScripts()
  addOutput('BrightOS Web Interface initialized', 'info')
  
  if (!serialSupported.value) {
    addOutput('Web Serial API not supported. Arduino control requires Chrome, Edge, or Opera.', 'warning')
  }
})

// Watch for workspace changes and save
watch([scripts, plugins], () => {
  saveWorkspace()
}, { deep: true })

// Output management
function addOutput(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString()
  outputLines.value.push({ timestamp, message, type })
  
  nextTick(() => {
    if (outputContent.value && autoScroll.value) {
      outputContent.value.scrollTop = outputContent.value.scrollHeight
    }
  })
}

function clearOutput() {
  outputLines.value = []
  addOutput('Output cleared', 'info')
}

function copyOutput() {
  const text = outputLines.value
    .map(line => `[${line.timestamp}] ${line.message}`)
    .join('\n')
  
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text)
      .then(() => {
        addOutput('Output copied to clipboard', 'success')
      })
      .catch(err => {
        addOutput(`Failed to copy: ${err.message}`, 'error')
      })
  } else {
    // Fallback for older browsers
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      document.execCommand('copy')
      addOutput('Output copied to clipboard', 'success')
    } catch (err) {
      addOutput('Failed to copy output', 'error')
    }
    document.body.removeChild(textarea)
  }
}

function exportOutput() {
  const text = outputLines.value
    .map(line => `[${line.timestamp}] ${line.message}`)
    .join('\n')
  
  const blob = new Blob([text], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `brightos-output-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.log`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  addOutput('Output exported', 'success')
}

// Script management
function handleScriptUpload(event) {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const content = e.target.result
    const script = {
      name: file.name,
      content: content,
      type: file.name.endsWith('.py') ? 'python' : 'javascript'
    }
    scripts.value.push(script)
    selectedScript.value = script.name
    addOutput(`Script loaded: ${file.name}`, 'success')
  }
  reader.readAsText(file)
  
  // Reset input
  event.target.value = ''
}

function runScript() {
  const script = scripts.value.find(s => s.name === selectedScript.value)
  if (!script) {
    addOutput('No script selected', 'error')
    return
  }

  isRunning.value = true
  addOutput(`Running script: ${script.name}`, 'info')
  addOutput('─'.repeat(50), 'info')

  try {
    if (script.type === 'javascript') {
      // Execute JavaScript in sandboxed context
      const scriptContext = {
        console: {
          log: (...args) => addOutput(args.join(' '), 'info'),
          error: (...args) => addOutput(args.join(' '), 'error'),
          warn: (...args) => addOutput(args.join(' '), 'warning'),
        },
        plugins: {
          telemetrix: isArduinoConnected.value ? { connected: true } : null
        },
        arduino: {
          write: async (data) => {
            if (writer) {
              await writer.write(new TextEncoder().encode(data))
              addOutput(`Sent to Arduino: ${data}`, 'info')
            } else {
              addOutput('Arduino not connected', 'error')
            }
          },
          read: async () => {
            if (reader) {
              const { value, done } = await reader.read()
              if (!done) {
                const text = new TextDecoder().decode(value)
                addOutput(`Received from Arduino: ${text}`, 'info')
                return text
              }
            }
            return null
          }
        }
      }

      // Create function from script content
      const scriptFunction = new Function('context', `
        const console = context.console;
        const plugins = context.plugins;
        const arduino = context.arduino;
        
        ${script.content}
        
        if (typeof main === 'function') {
          main(plugins);
        }
      `)
      
      scriptFunction(scriptContext)
      addOutput('Script completed', 'success')
    } else if (script.type === 'python') {
      // For Python scripts, we can only show them (no execution in browser)
      addOutput('Python execution in browser is not supported.', 'error')
      addOutput('Use the desktop launcher to run Python scripts.', 'info')
      addOutput('Showing script content:', 'info')
      script.content.split('\n').slice(0, 20).forEach(line => {
        addOutput(line, 'info')
      })
    }
  } catch (error) {
    addOutput(`Script error: ${error.message}`, 'error')
  }

  addOutput('─'.repeat(50), 'info')
  isRunning.value = false
}

function stopScript() {
  isRunning.value = false
  addOutput('Script stopped by user', 'warning')
}

// Plugin management
function handlePluginUpload(event) {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const content = e.target.result
    const plugin = {
      name: file.name,
      content: content,
      type: file.name.endsWith('.py') ? 'python' : 'javascript'
    }
    plugins.value.push(plugin)
    addOutput(`Plugin loaded: ${file.name}`, 'success')
  }
  reader.readAsText(file)
  
  // Reset input
  event.target.value = ''
}

// Arduino connection management
async function connectArduino() {
  if (!serialSupported.value) {
    addOutput('Web Serial API is not supported in this browser', 'error')
    return
  }

  try {
    // Request port access
    serialPort = await navigator.serial.requestPort()
    
    // Open the port
    await serialPort.open({ baudRate: 115200 })
    
    // Get reader and writer
    reader = serialPort.readable.getReader()
    writer = serialPort.writable.getWriter()
    
    isArduinoConnected.value = true
    addOutput('Arduino connected successfully', 'success')
    
    // Start reading from serial port
    readFromSerial()
  } catch (error) {
    addOutput(`Arduino connection failed: ${error.message}`, 'error')
  }
}

async function disconnectArduino() {
  try {
    if (reader) {
      await reader.cancel()
      reader.releaseLock()
      reader = null
    }
    
    if (writer) {
      writer.releaseLock()
      writer = null
    }
    
    if (serialPort) {
      await serialPort.close()
      serialPort = null
    }
    
    isArduinoConnected.value = false
    addOutput('Arduino disconnected', 'info')
  } catch (error) {
    addOutput(`Disconnect error: ${error.message}`, 'error')
  }
}

async function readFromSerial() {
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) {
        break
      }
      const text = new TextDecoder().decode(value)
      addOutput(`Arduino: ${text}`, 'info')
    }
  } catch (error) {
    if (error.name !== 'NetworkError') {
      addOutput(`Serial read error: ${error.message}`, 'error')
    }
  }
}

// Workspace persistence
function saveWorkspace() {
  try {
    const workspace = {
      scripts: scripts.value,
      plugins: plugins.value,
      selectedScript: selectedScript.value
    }
    localStorage.setItem('brightos-workspace', JSON.stringify(workspace))
  } catch (error) {
    console.error('Failed to save workspace:', error)
  }
}

function loadWorkspace() {
  try {
    const saved = localStorage.getItem('brightos-workspace')
    if (saved) {
      const workspace = JSON.parse(saved)
      scripts.value = workspace.scripts || []
      plugins.value = workspace.plugins || []
      selectedScript.value = workspace.selectedScript || ''
      if (scripts.value.length > 0 || plugins.value.length > 0) {
        addOutput('Workspace restored from last session', 'success')
      }
    }
  } catch (error) {
    console.error('Failed to load workspace:', error)
  }
}

function clearWorkspace() {
  scripts.value = []
  plugins.value = []
  selectedScript.value = ''
  localStorage.removeItem('brightos-workspace')
  addOutput('Workspace cleared', 'info')
}

// Example scripts
function loadExampleScripts() {
  const examples = [
    {
      name: 'blink-led.js',
      content: `// Blink LED Example - Beginner
// Toggle an LED on/off every second

function main(plugins) {
  const board = plugins.get("telemetrix");
  
  if (!board) {
    console.error("Telemetrix not connected");
    return;
  }
  
  const LED_PIN = 13;
  let isOn = false;
  
  console.log("Starting LED blink on pin " + LED_PIN);
  
  // Toggle LED every second
  setInterval(() => {
    if (arduino.write) {
      const value = isOn ? 1 : 0;
      arduino.write(\`digitalWrite(\${LED_PIN}, \${value})\\n\`);
      console.log("LED " + (isOn ? "ON" : "OFF"));
      isOn = !isOn;
    }
  }, 1000);
}`,
      type: 'javascript'
    },
    {
      name: 'servo-sweep.js',
      content: `// Servo Sweep Example - Beginner
// Sweep a servo motor from 0 to 180 degrees

function main(plugins) {
  const board = plugins.get("telemetrix");
  const motor = plugins.get("motorcontroller");
  
  if (!motor || !board) {
    console.error("Required plugins not loaded");
    return;
  }
  
  motor.set_board(board);
  
  const SERVO_PIN = 9;
  let angle = 0;
  let direction = 1;
  
  console.log("Starting servo sweep on pin " + SERVO_PIN);
  
  setInterval(() => {
    motor.servo_control(SERVO_PIN, angle);
    console.log("Servo angle: " + angle);
    
    angle += direction * 10;
    if (angle >= 180 || angle <= 0) {
      direction *= -1;
    }
  }, 100);
}`,
      type: 'javascript'
    },
    {
      name: 'button-input.js',
      content: `// Button Input Handler - Intermediate
// Read button state and control LED

function main(plugins) {
  const board = plugins.get("telemetrix");
  
  if (!board) {
    console.error("Telemetrix not connected");
    return;
  }
  
  const BUTTON_PIN = 2;
  const LED_PIN = 13;
  
  console.log("Button input demo ready");
  console.log("Press button on pin " + BUTTON_PIN);
  
  // Simulated button reading
  setInterval(() => {
    if (arduino.read) {
      arduino.read().then(data => {
        if (data && data.includes("BUTTON")) {
          console.log("Button pressed! LED ON");
          if (arduino.write) {
            arduino.write(\`digitalWrite(\${LED_PIN}, 1)\\n\`);
          }
        }
      });
    }
  }, 100);
}`,
      type: 'javascript'
    }
  ]
  
  // Don't auto-load examples if workspace already has scripts
  if (scripts.value.length === 0) {
    examples.forEach(example => {
      scripts.value.push(example)
    })
    addOutput(`${examples.length} example scripts loaded`, 'info')
  }
}

function loadExampleScript(scriptName) {
  const script = scripts.value.find(s => s.name === scriptName)
  if (script) {
    selectedScript.value = script.name
    addOutput(`Selected example: ${scriptName}`, 'info')
  }
}
</script>

<style scoped>
.brightos-web {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: 20px 0;
}

.control-panel {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.section {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 16px;
}

.section h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.button {
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.button.primary {
  background: var(--vp-c-brand-1);
  color: white;
}

.button.primary:hover:not(:disabled) {
  background: var(--vp-c-brand-2);
}

.button.secondary {
  background: var(--vp-c-bg-mute);
  color: var(--vp-c-text-1);
  border: 1px solid var(--vp-c-divider);
}

.button.secondary:hover:not(:disabled) {
  background: var(--vp-c-bg-soft);
}

.button.small {
  padding: 4px 12px;
  font-size: 12px;
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.script-select {
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 14px;
  min-width: 200px;
}

.status-indicator {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
}

.status-indicator.connected {
  background: rgba(16, 185, 129, 0.1);
  color: rgb(16, 185, 129);
}

.status-indicator.error {
  background: rgba(239, 68, 68, 0.1);
  color: rgb(239, 68, 68);
}

.plugin-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex: 1;
}

.plugin-item {
  padding: 4px 12px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  font-size: 13px;
  color: var(--vp-c-text-2);
}

.output-panel {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
}

.output-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
}

.output-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.output-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.auto-scroll-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--vp-c-text-2);
  cursor: pointer;
  user-select: none;
}

.auto-scroll-toggle input[type="checkbox"] {
  cursor: pointer;
}

.workspace-info {
  font-size: 13px;
  color: var(--vp-c-text-2);
  padding: 4px 8px;
}

.output-content {
  padding: 16px;
  max-height: 400px;
  overflow-y: auto;
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  line-height: 1.6;
}

.output-line {
  display: flex;
  gap: 12px;
  margin-bottom: 4px;
}

.timestamp {
  color: var(--vp-c-text-3);
  font-size: 11px;
  flex-shrink: 0;
}

.message {
  color: var(--vp-c-text-2);
  word-break: break-word;
}

.message.error {
  color: rgb(239, 68, 68);
}

.message.warning {
  color: rgb(245, 158, 11);
}

.message.success {
  color: rgb(16, 185, 129);
}

.message.info {
  color: var(--vp-c-text-1);
}

.empty-state {
  color: var(--vp-c-text-3);
  font-style: italic;
}

/* Scrollbar styling */
.output-content::-webkit-scrollbar {
  width: 8px;
}

.output-content::-webkit-scrollbar-track {
  background: var(--vp-c-bg);
  border-radius: 4px;
}

.output-content::-webkit-scrollbar-thumb {
  background: var(--vp-c-divider);
  border-radius: 4px;
}

.output-content::-webkit-scrollbar-thumb:hover {
  background: var(--vp-c-text-3);
}

/* Mobile responsive styles */
@media (max-width: 768px) {
  .button-group {
    flex-direction: column;
    align-items: stretch;
  }
  
  .script-select {
    min-width: 100%;
  }
  
  .output-controls {
    flex-wrap: wrap;
  }
  
  .auto-scroll-toggle {
    font-size: 12px;
  }
  
  .button.small {
    padding: 6px 10px;
    font-size: 11px;
  }
  
  .output-content {
    max-height: 300px;
    font-size: 12px;
  }
}
</style>

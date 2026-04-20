<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { usePin } from '@/composables/usePin'

const { authenticated, hasPin, checkRemembered, setPin, verifyPin, remember } = usePin()

const pin = ref('')
const confirmPin = ref('')
const rememberDevice = ref(false)
const error = ref('')
const mode = ref<'loading' | 'set' | 'verify'>('loading')

onMounted(() => {
  if (checkRemembered()) return
  mode.value = hasPin.value ? 'verify' : 'set'
})

async function handleSet() {
  if (pin.value.length < 4) {
    error.value = 'PIN must be at least 4 characters'
    return
  }
  if (pin.value !== confirmPin.value) {
    error.value = 'PINs do not match'
    return
  }
  await setPin(pin.value)
  if (rememberDevice.value) remember()
}

async function handleVerify() {
  const ok = await verifyPin(pin.value)
  if (!ok) {
    error.value = 'Incorrect PIN'
    pin.value = ''
    return
  }
  if (rememberDevice.value) remember()
}
</script>

<template>
  <div v-if="!authenticated" class="pin-overlay">
    <div class="pin-card">
      <div class="pin-logo">🔒</div>
      <h1>Family Finances</h1>

      <!-- Set PIN (first visit) -->
      <form v-if="mode === 'set'" @submit.prevent="handleSet">
        <p class="pin-subtitle">Create a PIN to protect your finances</p>
        <div class="pin-field">
          <label>New PIN</label>
          <input
            v-model="pin"
            type="password"
            inputmode="numeric"
            placeholder="Enter PIN"
            autocomplete="new-password"
            autofocus
          />
        </div>
        <div class="pin-field">
          <label>Confirm PIN</label>
          <input
            v-model="confirmPin"
            type="password"
            inputmode="numeric"
            placeholder="Confirm PIN"
            autocomplete="new-password"
          />
        </div>
        <label class="remember-check">
          <input v-model="rememberDevice" type="checkbox" />
          Remember this device for 7 days
        </label>
        <p v-if="error" class="pin-error">{{ error }}</p>
        <button type="submit" class="pin-btn">Set PIN</button>
      </form>

      <!-- Verify PIN -->
      <form v-else-if="mode === 'verify'" @submit.prevent="handleVerify">
        <p class="pin-subtitle">Enter your PIN to continue</p>
        <div class="pin-field">
          <input
            v-model="pin"
            type="password"
            inputmode="numeric"
            placeholder="Enter PIN"
            autocomplete="current-password"
            autofocus
          />
        </div>
        <label class="remember-check">
          <input v-model="rememberDevice" type="checkbox" />
          Remember this device for 7 days
        </label>
        <p v-if="error" class="pin-error">{{ error }}</p>
        <button type="submit" class="pin-btn">Unlock</button>
      </form>
    </div>
  </div>

  <slot v-else />
</template>

<style scoped>
.pin-overlay {
  position: fixed;
  inset: 0;
  background: linear-gradient(135deg, #1565c0, #1976d2, #42a5f5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

.pin-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  width: 100%;
  max-width: 360px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
  text-align: center;
}

.pin-logo {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

h1 {
  font-size: 1.3rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.pin-subtitle {
  color: #777;
  font-size: 0.9rem;
  margin-bottom: 1.25rem;
}

.pin-field {
  margin-bottom: 0.75rem;
  text-align: left;
}

.pin-field label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: #555;
  margin-bottom: 0.25rem;
}

.pin-field input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 1.2rem;
  text-align: center;
  letter-spacing: 0.3em;
  box-sizing: border-box;
}

.pin-field input:focus {
  outline: none;
  border-color: #1976d2;
}

.remember-check {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  color: #666;
  margin: 0.75rem 0;
  cursor: pointer;
  justify-content: center;
}

.remember-check input[type="checkbox"] {
  accent-color: #1976d2;
}

.pin-error {
  color: #c62828;
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.pin-btn {
  width: 100%;
  padding: 0.75rem;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 0.25rem;
}

.pin-btn:hover {
  background: #1565c0;
}
</style>


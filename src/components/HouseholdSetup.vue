<script setup lang="ts">
import { ref } from 'vue'
import { useHousehold } from '@/composables/useHousehold'
import { useFinancesStore } from '@/stores/finances'
import { useNotificationsStore } from '@/stores/notifications'

const { householdId, hasHousehold, firebaseReady, createHousehold, joinHousehold, leaveHousehold } = useHousehold()
const financesStore = useFinancesStore()
const notificationsStore = useNotificationsStore()

const mode = ref<'menu' | 'join'>('menu')
const joinCode = ref('')
const error = ref('')
const loading = ref(false)
const showCode = ref(false)

async function handleCreate() {
  loading.value = true
  error.value = ''
  const code = await createHousehold()
  if (code) {
    financesStore.enableSync(code)
    notificationsStore.enableSync(code)
    showCode.value = true
  } else {
    error.value = 'Failed to create household. Check Firebase config.'
  }
  loading.value = false
}

async function handleJoin() {
  if (!joinCode.value.trim()) {
    error.value = 'Enter a household code'
    return
  }
  loading.value = true
  error.value = ''
  const ok = await joinHousehold(joinCode.value)
  if (ok) {
    financesStore.enableSync(householdId.value!)
    notificationsStore.enableSync(householdId.value!)
  } else {
    error.value = 'Household not found. Check the code and try again.'
  }
  loading.value = false
}

function handleLeave() {
  leaveHousehold()
  window.location.reload()
}

// If already in a household, enable sync on mount
if (hasHousehold.value) {
  financesStore.enableSync(householdId.value!)
  notificationsStore.enableSync(householdId.value!)
}
</script>

<template>
  <!-- Not using Firebase — show nothing -->
  <div v-if="!firebaseReady" class="household-banner offline">
    <span>📱 Offline mode — data stored on this device only</span>
  </div>

  <!-- Connected to a household -->
  <div v-else-if="hasHousehold && !showCode" class="household-banner connected">
    <span>🏠 Household: <strong>{{ householdId }}</strong> (synced)</span>
    <button class="leave-btn" @click="handleLeave">Leave</button>
  </div>

  <!-- Show new household code -->
  <div v-else-if="showCode" class="household-banner created">
    <div>
      <span>✅ Household created! Share this code:</span>
      <strong class="code-display">{{ householdId }}</strong>
    </div>
    <button class="done-btn" @click="showCode = false">Done</button>
  </div>

  <!-- Setup flow -->
  <div v-else class="household-setup">
    <div class="setup-card">
      <h2>🏠 Sync with Family</h2>
      <p class="setup-desc">Share finances with your family in real-time</p>

      <div v-if="mode === 'menu'" class="setup-actions">
        <button class="setup-btn create" @click="handleCreate" :disabled="loading">
          {{ loading ? 'Creating...' : '➕ Create Household' }}
        </button>
        <button class="setup-btn join" @click="mode = 'join'" :disabled="loading">
          🔗 Join Existing
        </button>
        <p class="setup-skip">
          Or continue with <strong>local-only</strong> mode (no sync)
        </p>
      </div>

      <form v-else @submit.prevent="handleJoin" class="join-form">
        <input
          v-model="joinCode"
          type="text"
          placeholder="Enter household code"
          class="code-input"
          autofocus
        />
        <div class="join-actions">
          <button type="submit" class="setup-btn join" :disabled="loading">
            {{ loading ? 'Joining...' : 'Join' }}
          </button>
          <button type="button" class="setup-btn back" @click="mode = 'menu'">Back</button>
        </div>
      </form>

      <p v-if="error" class="setup-error">{{ error }}</p>
    </div>
  </div>
</template>

<style scoped>
.household-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  flex-wrap: wrap;
}

.household-banner.offline { background: #f5f5f5; color: #999; }
.household-banner.connected { background: #e8f5e9; color: #2e7d32; }
.household-banner.created { background: #e3f2fd; color: #1565c0; }

.code-display {
  display: inline-block;
  margin-left: 0.5rem;
  background: white;
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
  font-size: 1.1rem;
  letter-spacing: 0.15em;
  font-family: monospace;
}

.leave-btn, .done-btn {
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  border: none;
}
.leave-btn { background: #ffcdd2; color: #c62828; }
.done-btn { background: #bbdefb; color: #1565c0; }

.household-setup {
  display: flex;
  justify-content: center;
  padding: 1rem;
}

.setup-card {
  background: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 1.5rem;
  max-width: 360px;
  width: 100%;
  text-align: center;
}

.setup-card h2 { font-size: 1.15rem; margin-bottom: 0.25rem; }
.setup-desc { color: #777; font-size: 0.9rem; margin-bottom: 1.25rem; }

.setup-actions {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.setup-btn {
  padding: 0.7rem;
  border: none;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
}
.setup-btn.create { background: #1976d2; color: white; }
.setup-btn.join { background: #4caf50; color: white; }
.setup-btn.back { background: #e0e0e0; color: #555; }
.setup-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.setup-skip {
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: #999;
}

.join-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.code-input {
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 1.1rem;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.2em;
}
.code-input:focus { outline: none; border-color: #4caf50; }

.join-actions { display: flex; gap: 0.5rem; }
.join-actions .setup-btn { flex: 1; }

.setup-error { color: #c62828; font-size: 0.85rem; margin-top: 0.75rem; }
</style>


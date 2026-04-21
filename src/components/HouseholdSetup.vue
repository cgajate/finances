<script setup lang="ts">
import { ref } from 'vue'
import { useHousehold } from '@/composables/useHousehold'
import { useFinancesStore } from '@/stores/finances'
import { useNotificationsStore } from '@/stores/notifications'
import { useBudgetsStore } from '@/stores/budgets'
import { useSavingsGoalsStore } from '@/stores/savingsGoals'

const { householdId, hasHousehold, firebaseReady, createHousehold, joinHousehold, leaveHousehold } = useHousehold()
const financesStore = useFinancesStore()
const notificationsStore = useNotificationsStore()
const budgetsStore = useBudgetsStore()
const savingsGoalsStore = useSavingsGoalsStore()

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
    budgetsStore.enableSync(code)
    savingsGoalsStore.enableSync(code)
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
    budgetsStore.enableSync(householdId.value!)
    savingsGoalsStore.enableSync(householdId.value!)
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
  budgetsStore.enableSync(householdId.value!)
  savingsGoalsStore.enableSync(householdId.value!)
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

.household-banner.offline { background: var(--color-bg-secondary); color: var(--color-text-muted); }
.household-banner.connected { background: var(--color-income-bg); color: var(--color-income); }
.household-banner.created { background: var(--color-primary-light); color: var(--color-primary-text); }

.code-display {
  display: inline-block;
  margin-left: 0.5rem;
  background: var(--color-surface);
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
.leave-btn { background: var(--color-expense-bg); color: var(--color-expense); }
.done-btn { background: var(--color-primary-light); color: var(--color-primary-text); }

.household-setup {
  display: flex;
  justify-content: center;
  padding: 1rem;
}

.setup-card {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.5rem;
  max-width: 360px;
  width: 100%;
  text-align: center;
}

.setup-card h2 { font-size: 1.15rem; margin-bottom: 0.25rem; }
.setup-desc { color: var(--color-text-muted); font-size: 0.9rem; margin-bottom: 1.25rem; }

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
.setup-btn.create { background: var(--color-primary); color: white; }
.setup-btn.join { background: var(--color-progress-fill); color: white; }
.setup-btn.back { background: var(--color-border); color: var(--color-text-secondary); }
.setup-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.setup-skip {
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.join-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.code-input {
  padding: 0.75rem;
  border: 2px solid var(--color-border);
  border-radius: 10px;
  font-size: 1.1rem;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  background: var(--color-input-bg);
  color: var(--color-input-text);
}
.code-input:focus { outline: none; border-color: var(--color-progress-fill); }

.join-actions { display: flex; gap: 0.5rem; }
.join-actions .setup-btn { flex: 1; }

.setup-error { color: var(--color-expense); font-size: 0.85rem; margin-top: 0.75rem; }
</style>


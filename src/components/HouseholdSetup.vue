<script setup lang="ts">
import { ref } from 'vue'
import { useHousehold } from '@/composables/useHousehold'
import { useFinancesStore } from '@/stores/finances'
import { useNotificationsStore } from '@/stores/notifications'
import { useBudgetsStore } from '@/stores/budgets'
import { useSavingsGoalsStore } from '@/stores/savingsGoals'
import { useSnackbar } from '@/composables/useSnackbar'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const { householdId, hasHousehold, firebaseReady, createHousehold, joinHousehold, leaveHousehold } =
  useHousehold()
const financesStore = useFinancesStore()
const notificationsStore = useNotificationsStore()
const budgetsStore = useBudgetsStore()
const savingsGoalsStore = useSavingsGoalsStore()
const snackbar = useSnackbar()

const mode = ref<'menu' | 'join'>('menu')
const joinCode = ref('')
const error = ref('')
const loading = ref(false)

function enableAllSync(code: string) {
  financesStore.enableSync(code)
  notificationsStore.enableSync(code)
  budgetsStore.enableSync(code)
  savingsGoalsStore.enableSync(code)
}

async function handleCreate() {
  loading.value = true
  error.value = ''
  try {
    const code = await createHousehold()
    if (code) {
      enableAllSync(code)
      emit('close')
      snackbar.show(`Household created! Code: ${code}`, {
        copyText: code,
        persistent: true,
      })
    } else {
      snackbar.show('Failed to create household. Check Firebase config.')
    }
  } catch {
    snackbar.show('Failed to create household. Check Firebase config.')
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
  try {
    const ok = await joinHousehold(joinCode.value)
    if (ok) {
      enableAllSync(householdId.value!)
      emit('close')
      snackbar.show('Successfully joined household!')
    } else {
      snackbar.show('Household not found. Check the code and try again.')
    }
  } catch {
    snackbar.show('Failed to join household. Please try again.')
  }
  loading.value = false
}

function handleLeave() {
  leaveHousehold()
  emit('close')
  snackbar.show('Left household. Reloading...')
  setTimeout(() => window.location.reload(), 1000)
}

function closeModal() {
  mode.value = 'menu'
  error.value = ''
  joinCode.value = ''
  emit('close')
}

// If already in a household, enable sync on mount
if (hasHousehold.value) {
  enableAllSync(householdId.value!)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="open" class="modal-backdrop" @click.self="closeModal" @keydown.escape="closeModal">
        <div class="modal-card" role="dialog" aria-modal="true" aria-label="Sync with Family">
          <div class="modal-header">
            <h2>
              <font-awesome-icon :icon="['fas', 'users']" />
              Sync with Family
            </h2>
            <button class="modal-close" @click="closeModal" aria-label="Close">
              <font-awesome-icon :icon="['fas', 'xmark']" />
            </button>
          </div>

          <!-- Already connected -->
          <div v-if="hasHousehold" class="modal-body">
            <div class="status-row connected">
              <font-awesome-icon :icon="['fas', 'circle-check']" />
              <span>Connected to household: <strong>{{ householdId }}</strong></span>
            </div>
            <button class="modal-btn danger" @click="handleLeave">
              <font-awesome-icon :icon="['fas', 'right-from-bracket']" />
              Leave Household
            </button>
          </div>

          <!-- Firebase not configured -->
          <div v-else-if="!firebaseReady" class="modal-body">
            <div class="status-row offline">
              <font-awesome-icon :icon="['fas', 'wifi-slash']" v-if="false" />
              <font-awesome-icon :icon="['fas', 'tower-broadcast']" />
              <span>Offline mode — data stored on this device only</span>
            </div>
          </div>

          <!-- Setup flow -->
          <div v-else class="modal-body">
            <p class="modal-desc">Share finances with your family in real-time</p>

            <div v-if="mode === 'menu'" class="modal-actions">
              <button class="modal-btn primary" @click="handleCreate" :disabled="loading">
                <font-awesome-icon :icon="['fas', loading ? 'spinner' : 'plus']" :spin="loading" />
                {{ loading ? 'Creating...' : 'Create Household' }}
              </button>
              <button class="modal-btn secondary" @click="mode = 'join'" :disabled="loading">
                <font-awesome-icon :icon="['fas', 'link']" />
                Join Existing
              </button>
              <p class="modal-hint">
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
                <button type="submit" class="modal-btn primary" :disabled="loading">
                  <font-awesome-icon
                    :icon="['fas', loading ? 'spinner' : 'right-to-bracket']"
                    :spin="loading"
                  />
                  {{ loading ? 'Joining...' : 'Join' }}
                </button>
                <button type="button" class="modal-btn secondary" @click="mode = 'menu'">
                  <font-awesome-icon :icon="['fas', 'arrow-left']" />
                  Back
                </button>
              </div>
            </form>

            <p v-if="error" class="modal-error">
              <font-awesome-icon :icon="['fas', 'triangle-exclamation']" />
              {{ error }}
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 300;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  box-shadow: 0 12px 40px var(--color-card-shadow);
  max-width: 380px;
  width: 100%;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--color-border-light);
}

.modal-header h2 {
  font-size: 1.05rem;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text);
}

.modal-close {
  background: none;
  border: none;
  color: var(--color-text-muted);
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 6px;
  transition: background 0.15s, color 0.15s;
}

.modal-close:hover {
  background: var(--color-badge-bg);
  color: var(--color-text);
}

.modal-body {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.modal-desc {
  color: var(--color-text-muted);
  font-size: 0.85rem;
  text-align: center;
  margin: 0;
}

.status-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.75rem;
  border-radius: 8px;
  font-size: 0.85rem;
}

.status-row.connected {
  background: var(--color-income-bg);
  color: var(--color-income);
}

.status-row.offline {
  background: var(--color-bg-secondary);
  color: var(--color-text-muted);
}

.modal-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.modal-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.5rem 0.75rem;
  border: none;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.1s;
}

.modal-btn:active {
  transform: scale(0.98);
}

.modal-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.modal-btn.primary {
  background: var(--color-primary);
  color: white;
}

.modal-btn.secondary {
  background: var(--color-badge-bg);
  color: var(--color-text-secondary);
}

.modal-btn.danger {
  background: var(--color-expense-bg);
  color: var(--color-expense);
}

.modal-hint {
  text-align: center;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin: 0;
}

.join-form {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.code-input {
  padding: 0.6rem;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  font-size: 1rem;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  background: var(--color-input-bg);
  color: var(--color-input-text);
}

.code-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.join-actions {
  display: flex;
  gap: 0.5rem;
}

.join-actions .modal-btn {
  flex: 1;
}

.modal-error {
  color: var(--color-expense);
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0;
}

/* Transition */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-active .modal-card,
.modal-fade-leave-active .modal-card {
  transition: transform 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .modal-card {
  transform: scale(0.95);
}

.modal-fade-leave-to .modal-card {
  transform: scale(0.95);
}
</style>


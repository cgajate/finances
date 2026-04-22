<script setup lang="ts">
import { ref } from 'vue'
import { useSavingsGoalsStore } from '@/stores/savingsGoals'
import { useSnackbar } from '@/composables/useSnackbar'
import { formatCurrency } from '@/lib/formatCurrency'
import CurrencyInput from '@/components/CurrencyInput.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import EmptyState from '@/components/EmptyState.vue'

const store = useSavingsGoalsStore()
const snackbar = useSnackbar()

function deleteGoal(id: string) {
  const goal = store.goals.find((g: { id: string }) => g.id === id)
  if (!goal) return
  const snapshot = { ...goal }
  store.removeGoal(id)
  snackbar.show(`Deleted "${snapshot.name}"`, () => {
    store.addGoal({
      name: snapshot.name,
      targetAmount: snapshot.targetAmount,
      deadline: snapshot.deadline,
      savedAmount: snapshot.savedAmount,
    })
  })
}

// Add goal form
const goalName = ref('')
const targetAmount = ref<number | null>(null)
const deadline = ref('')

// Add savings form
const addAmountFor = ref<string | null>(null)
const addAmount = ref<number | null>(null)

function addGoal() {
  if (!goalName.value || !targetAmount.value || !deadline.value) return
  store.addGoal({
    name: goalName.value,
    targetAmount: targetAmount.value,
    deadline: deadline.value,
  })
  goalName.value = ''
  targetAmount.value = null
  deadline.value = ''
}

function submitSavings(id: string) {
  if (!addAmount.value) return
  store.addSavings(id, addAmount.value)
  addAmountFor.value = null
  addAmount.value = null
}


function daysUntilDeadline(deadline: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(deadline + 'T00:00:00')
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function percentComplete(goal: { savedAmount: number; targetAmount: number }): number {
  if (goal.targetAmount <= 0) return 0
  return Math.min(Math.round((goal.savedAmount / goal.targetAmount) * 100), 100)
}

function meterVariant(percent: number): 'ok' | 'warning' | 'over' | 'primary' {
  if (percent >= 100) return 'ok'
  if (percent >= 60) return 'primary'
  if (percent >= 30) return 'warning'
  return 'over'
}
</script>

<template>
  <div>

    <!-- Add goal form -->
    <form class="form" @submit.prevent="addGoal">
      <div class="form-row">
        <div class="field">
          <label for="goal-name">Goal Name *</label>
          <input id="goal-name" v-model="goalName" type="text" placeholder="e.g. Vacation" required />
        </div>
        <div class="field">
          <label for="goal-target">Target Amount *</label>
          <CurrencyInput id="goal-target" v-model="targetAmount" :required="true" />
        </div>
        <div class="field">
          <label for="goal-deadline">Deadline *</label>
          <input id="goal-deadline" v-model="deadline" type="date" required />
        </div>
        <button type="submit" class="btn-add">+ Add Goal</button>
      </div>
    </form>

    <!-- Active goals -->
    <h2 v-if="store.activeGoals.length">Active Goals ({{ store.activeGoals.length }})</h2>
    <div v-if="store.activeGoals.length" class="goals-list">
      <div v-for="goal in store.activeGoals" :key="goal.id" class="goal-card">
        <div class="goal-header">
          <span class="goal-name">{{ goal.name }}</span>
          <span class="goal-deadline" :class="{ overdue: daysUntilDeadline(goal.deadline) < 0 }">
            <template v-if="daysUntilDeadline(goal.deadline) < 0">
              {{ Math.abs(daysUntilDeadline(goal.deadline)) }} days overdue
            </template>
            <template v-else-if="daysUntilDeadline(goal.deadline) === 0">Due today</template>
            <template v-else>{{ daysUntilDeadline(goal.deadline) }} days left</template>
          </span>
        </div>

        <div class="goal-amounts">
          <span class="goal-saved">{{ formatCurrency(goal.savedAmount) }}</span>
          <span class="goal-of">of</span>
          <span class="goal-target">{{ formatCurrency(goal.targetAmount) }}</span>
        </div>

        <!-- Visual meter -->
        <ProgressBar :percent="percentComplete(goal)" :variant="meterVariant(percentComplete(goal))" :height="12" />
        <div class="meter-label">{{ percentComplete(goal) }}% complete</div>

        <!-- Actions -->
        <div class="goal-actions">
          <template v-if="addAmountFor === goal.id">
            <form class="add-savings-form" @submit.prevent="submitSavings(goal.id)">
              <CurrencyInput v-model="addAmount" class="savings-input" />
              <button type="submit" class="btn-save-sm">Add</button>
              <button type="button" class="btn-cancel-sm" @click="addAmountFor = null; addAmount = null">✕</button>
            </form>
          </template>
          <template v-else>
            <button class="btn-fund" :aria-label="`Add savings to ${goal.name}`" @click="addAmountFor = goal.id">+ Add Savings</button>
            <button class="btn-remove" :aria-label="`Remove ${goal.name} goal`" @click="deleteGoal(goal.id)">Remove</button>
          </template>
        </div>
      </div>
    </div>
    <EmptyState v-else-if="!store.completedGoals.length" message="No savings goals yet. Add one above to start tracking!" />

    <!-- Completed goals -->
    <template v-if="store.completedGoals.length">
      <h2><font-awesome-icon :icon="['fas', 'trophy']" /> Completed ({{ store.completedGoals.length }})</h2>
      <div class="goals-list">
        <div v-for="goal in store.completedGoals" :key="goal.id" class="goal-card completed">
          <div class="goal-header">
            <span class="goal-name"><font-awesome-icon :icon="['fas', 'circle-check']" /> {{ goal.name }}</span>
            <span class="goal-saved-final">{{ formatCurrency(goal.savedAmount) }}</span>
          </div>
          <ProgressBar :percent="100" variant="ok" :height="12" />
          <div class="goal-actions">
            <button class="btn-remove" :aria-label="`Remove ${goal.name} goal`" @click="deleteGoal(goal.id)">Remove</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
h2 { margin-top: 2rem; margin-bottom: 0.75rem; font-size: 1.1rem; }

.form { margin-bottom: 1.5rem; }
.form-row { display: flex; gap: 0.75rem; align-items: flex-end; flex-wrap: wrap; }
.field { display: flex; flex-direction: column; gap: 0.25rem; flex: 1; min-width: 140px; }
.field label { font-size: 0.85rem; font-weight: 600; color: var(--color-text-secondary); }
.field input {
  padding: 0.6rem; border: 1px solid var(--color-input-border); border-radius: 8px; font-size: 1rem;
  background: var(--color-input-bg); color: var(--color-input-text);
}

.goals-list { display: flex; flex-direction: column; gap: 0.75rem; }
.goal-card {
  padding: 1rem; border: 1px solid var(--color-border); border-radius: 12px;
  display: flex; flex-direction: column; gap: 0.5rem; background: var(--color-surface);
}
.goal-card.completed { background: var(--color-income-bg); border-color: var(--color-income); }

.goal-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; }
.goal-name { font-weight: 700; font-size: 1.05rem; }
.goal-deadline { font-size: 0.85rem; color: var(--color-text-muted); }
.goal-deadline.overdue { color: var(--color-expense); font-weight: 600; }

.goal-amounts { display: flex; align-items: baseline; gap: 0.4rem; }
.goal-saved { font-size: 1.25rem; font-weight: 700; color: var(--color-primary); }
.goal-of { font-size: 0.85rem; color: var(--color-text-muted); }
.goal-target { font-size: 1rem; font-weight: 600; color: var(--color-text-secondary); }
.goal-saved-final { font-weight: 700; color: var(--color-income); }

.meter-label { font-size: 0.8rem; font-weight: 600; color: var(--color-text-muted); }

.goal-actions { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }

.add-savings-form { display: flex; gap: 0.4rem; align-items: center; }
.savings-input {
  width: 100px; padding: 0.4rem; border: 1px solid var(--color-input-border); border-radius: 6px;
  font-size: 0.9rem; background: var(--color-input-bg); color: var(--color-input-text);
}
</style>


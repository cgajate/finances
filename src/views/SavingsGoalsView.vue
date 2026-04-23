<script setup lang="ts">
import { ref } from 'vue'
import { useSavingsGoalsStore } from '@/stores/savingsGoals'
import { useDeleteWithUndo } from '@/composables/useDeleteWithUndo'
import { formatCurrency } from '@/lib/formatCurrency'
import CurrencyInput from '@/components/CurrencyInput.vue'
import SavingsGoalRow from '@/components/SavingsGoalRow.vue'
import EmptyState from '@/components/EmptyState.vue'

const store = useSavingsGoalsStore()
const { deleteSavingsGoal: deleteGoal } = useDeleteWithUndo()

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
      <SavingsGoalRow
        v-for="goal in store.activeGoals"
        :key="goal.id"
        :goal="goal"
        mode="full"
      >
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
      </SavingsGoalRow>
    </div>
    <EmptyState v-else-if="!store.completedGoals.length" message="No savings goals yet. Add one above to start tracking!" />

    <!-- Completed goals -->
    <template v-if="store.completedGoals.length">
      <h2><font-awesome-icon :icon="['fas', 'trophy']" /> Completed ({{ store.completedGoals.length }})</h2>
      <div class="goals-list">
        <SavingsGoalRow
          v-for="goal in store.completedGoals"
          :key="goal.id"
          :goal="goal"
          mode="full"
        >
          <div class="goal-actions">
            <button class="btn-remove" :aria-label="`Remove ${goal.name} goal`" @click="deleteGoal(goal.id)">Remove</button>
          </div>
        </SavingsGoalRow>
      </div>
    </template>
  </div>
</template>

<style scoped>
h2 { margin-top: 2rem; margin-bottom: 0.75rem; font-size: 1.1rem; }

.form { margin-bottom: 1.5rem; }
.form-row .field { flex: 1; min-width: 140px; }

.goals-list { display: flex; flex-direction: column; gap: 0.75rem; }

.goal-actions { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }

.add-savings-form { display: flex; gap: 0.4rem; align-items: center; }
.savings-input {
  width: 100px; padding: 0.4rem; border: 1px solid var(--color-input-border); border-radius: 6px;
  font-size: 0.9rem; background: var(--color-input-bg); color: var(--color-input-text);
}
</style>


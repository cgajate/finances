<script setup lang="ts">
import { ref } from 'vue'
import { useBudgetsStore } from '@/stores/budgets'
import { useSnackbar } from '@/composables/useSnackbar'
import { formatCurrency } from '@/lib/formatCurrency'
import type { ExpenseCategory } from '@/types/finance'
import CurrencyInput from '@/components/CurrencyInput.vue'
import BudgetProgressRow from '@/components/BudgetProgressRow.vue'
import EmptyState from '@/components/EmptyState.vue'

const budgetsStore = useBudgetsStore()
const snackbar = useSnackbar()

const selectedCategory = ref<ExpenseCategory | ''>('')
const limitAmount = ref<number | null>(null)


function addBudget() {
  if (!selectedCategory.value || !limitAmount.value) return
  budgetsStore.setBudget(selectedCategory.value, limitAmount.value)
  selectedCategory.value = ''
  limitAmount.value = null
}

function removeBudget(category: ExpenseCategory) {
  const budget = budgetsStore.getBudgetForCategory(category)
  const limit = budget?.limit ?? 0
  budgetsStore.removeBudget(category)
  snackbar.show(`Removed ${category} budget`, () => {
    budgetsStore.setBudget(category, limit)
  })
}
</script>

<template>
  <div>
    <p class="subtitle">Set monthly spending limits per category</p>

    <!-- Add budget form -->
    <form v-if="budgetsStore.availableCategories.length" class="form" @submit.prevent="addBudget">
      <div class="form-row">
        <div class="field">
          <label for="budget-category">Category</label>
          <select id="budget-category" v-model="selectedCategory" required>
            <option value="" disabled>Select category</option>
            <option
              v-for="cat in budgetsStore.availableCategories"
              :key="cat"
              :value="cat"
            >
              {{ cat }}
            </option>
          </select>
        </div>
        <div class="field">
          <label for="budget-limit">Monthly Limit</label>
          <CurrencyInput id="budget-limit" v-model="limitAmount" :required="true" />
        </div>
        <button type="submit" class="btn-add">+ Add</button>
      </div>
    </form>
    <p v-else class="all-set"><font-awesome-icon :icon="['fas', 'circle-check']" /> All categories have budgets set!</p>

    <!-- Budget status list -->
    <div v-if="budgetsStore.budgetStatus.length" class="budget-list">
      <BudgetProgressRow
        v-for="bs in budgetsStore.budgetStatus"
        :key="bs.category"
        :status="bs"
        mode="full"
      >
        <div class="budget-footer">
          <span class="budget-percent" :class="`status-${bs.status}`">
            {{ Math.round(bs.percent) }}%
            <span v-if="bs.status === 'over'" class="status-label"><font-awesome-icon :icon="['fas', 'triangle-exclamation']" /> Over budget!</span>
            <span v-else-if="bs.status === 'warning'" class="status-label"><font-awesome-icon :icon="['fas', 'triangle-exclamation']" /> Approaching limit</span>
          </span>
          <button class="btn-remove" :aria-label="`Remove ${bs.category} budget`" @click="removeBudget(bs.category)">Remove</button>
        </div>
      </BudgetProgressRow>
    </div>
    <EmptyState v-else message="No budgets set yet. Add one above to start tracking." />
  </div>
</template>

<style scoped>
.subtitle { color: var(--color-text-muted); font-size: 0.9rem; margin-bottom: 1.5rem; }

.form { margin-bottom: 2rem; }
.form-row .field { flex: 1; min-width: 140px; }
.all-set { color: var(--color-income); font-weight: 500; margin-bottom: 1.5rem; }

.budget-list { display: flex; flex-direction: column; gap: 0.75rem; }

.budget-footer { display: flex; justify-content: space-between; align-items: center; }
.budget-percent { font-size: 0.85rem; font-weight: 600; }
.status-label { font-weight: 500; }
</style>

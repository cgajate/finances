<script setup lang="ts">
import { ref } from 'vue'
import { useBudgetsStore } from '@/stores/budgets'
import { useCurrencyInput } from '@/composables/useCurrencyInput'
import { useSnackbar } from '@/composables/useSnackbar'
import type { ExpenseCategory } from '@/types/finance'

const budgetsStore = useBudgetsStore()
const snackbar = useSnackbar()

const selectedCategory = ref<ExpenseCategory | ''>('')
const limitAmount = ref<number | null>(null)
const limitCurrency = useCurrencyInput(limitAmount)

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

function addBudget() {
  if (!selectedCategory.value || !limitAmount.value) return
  budgetsStore.setBudget(selectedCategory.value, limitAmount.value)
  selectedCategory.value = ''
  limitCurrency.reset()
}

function removeBudget(category: ExpenseCategory) {
  const budget = budgetsStore.getBudgetForCategory(category)
  const limit = budget?.limit ?? 0
  budgetsStore.removeBudget(category)
  snackbar.show(`Removed ${category} budget`, () => {
    budgetsStore.setBudget(category, limit)
  })
}

function statusColor(status: string): string {
  const style = getComputedStyle(document.documentElement)
  if (status === 'over') return style.getPropertyValue('--color-expense').trim()
  if (status === 'warning') return style.getPropertyValue('--color-warning').trim()
  return style.getPropertyValue('--color-income').trim()
}

function barColor(status: string): string {
  const style = getComputedStyle(document.documentElement)
  if (status === 'over') return style.getPropertyValue('--color-progress-over').trim()
  if (status === 'warning') return style.getPropertyValue('--color-progress-warning').trim()
  return style.getPropertyValue('--color-progress-fill').trim()
}
</script>

<template>
  <div>
    <p class="subtitle">Set monthly spending limits per category</p>

    <!-- Add budget form -->
    <form v-if="budgetsStore.availableCategories.length" class="form" @submit.prevent="addBudget">
      <div class="form-row">
        <div class="field">
          <label>Category</label>
          <select v-model="selectedCategory" required>
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
          <label>Monthly Limit</label>
          <input
            type="text"
            inputmode="decimal"
            placeholder="$0.00"
            :value="limitCurrency.display.value"
            @input="limitCurrency.onInput"
            @blur="limitCurrency.onBlur"
            @focus="limitCurrency.onFocus"
            required
          />
        </div>
        <button type="submit" class="btn-add">+ Add</button>
      </div>
    </form>
    <p v-else class="all-set"><font-awesome-icon :icon="['fas', 'circle-check']" /> All categories have budgets set!</p>

    <!-- Budget status list -->
    <div v-if="budgetsStore.budgetStatus.length" class="budget-list">
      <div
        v-for="bs in budgetsStore.budgetStatus"
        :key="bs.category"
        class="budget-card"
      >
        <div class="budget-header">
          <span class="budget-category">{{ bs.category }}</span>
          <span class="budget-values" :style="{ color: statusColor(bs.status) }">
            {{ formatCurrency(bs.spent) }} / {{ formatCurrency(bs.limit) }}
          </span>
        </div>
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{
              width: Math.min(bs.percent, 100) + '%',
              background: barColor(bs.status),
            }"
          ></div>
        </div>
        <div class="budget-footer">
          <span class="budget-percent" :style="{ color: statusColor(bs.status) }">
            {{ Math.round(bs.percent) }}%
            <span v-if="bs.status === 'over'" class="status-label"><font-awesome-icon :icon="['fas', 'triangle-exclamation']" /> Over budget!</span>
            <span v-else-if="bs.status === 'warning'" class="status-label"><font-awesome-icon :icon="['fas', 'triangle-exclamation']" /> Approaching limit</span>
          </span>
          <button class="btn-remove" @click="removeBudget(bs.category)">Remove</button>
        </div>
      </div>
    </div>
    <p v-else class="empty">No budgets set yet. Add one above to start tracking.</p>
  </div>
</template>

<style scoped>
.subtitle { color: var(--color-text-muted); font-size: 0.9rem; margin-bottom: 1.5rem; }

.form { margin-bottom: 2rem; }
.form-row { display: flex; gap: 0.75rem; align-items: flex-end; flex-wrap: wrap; }
.field { display: flex; flex-direction: column; gap: 0.25rem; flex: 1; min-width: 140px; }
.field label { font-size: 0.85rem; font-weight: 600; color: var(--color-text-secondary); }
.field input, .field select {
  padding: 0.6rem; border: 1px solid var(--color-input-border); border-radius: 8px; font-size: 1rem;
  background: var(--color-input-bg); color: var(--color-input-text);
}
.all-set { color: var(--color-income); font-weight: 500; margin-bottom: 1.5rem; }

.budget-list { display: flex; flex-direction: column; gap: 0.75rem; }
.budget-card {
  padding: 1rem; border: 1px solid var(--color-border); border-radius: 12px;
  display: flex; flex-direction: column; gap: 0.5rem; background: var(--color-surface);
}
.budget-header { display: flex; justify-content: space-between; align-items: center; }
.budget-category { font-weight: 700; font-size: 1rem; }
.budget-values { font-weight: 600; font-size: 0.9rem; }

.progress-bar { height: 10px; background: var(--color-progress-track); border-radius: 5px; overflow: hidden; }
.progress-fill { height: 100%; border-radius: 5px; transition: width 0.3s ease; }

.budget-footer { display: flex; justify-content: space-between; align-items: center; }
.budget-percent { font-size: 0.85rem; font-weight: 600; }
.status-label { font-weight: 500; }
.empty { color: var(--color-text-muted); font-style: italic; }
</style>


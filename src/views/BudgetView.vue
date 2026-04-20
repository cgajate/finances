<script setup lang="ts">
import { ref } from 'vue'
import { useBudgetsStore } from '@/stores/budgets'
import { useCurrencyInput } from '@/composables/useCurrencyInput'
import type { ExpenseCategory } from '@/types/finance'

const budgetsStore = useBudgetsStore()

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
  budgetsStore.removeBudget(category)
}

function statusColor(status: string): string {
  if (status === 'over') return '#c62828'
  if (status === 'warning') return '#e65100'
  return '#2e7d32'
}

function barColor(status: string): string {
  if (status === 'over') return '#ef5350'
  if (status === 'warning') return '#ff9800'
  return '#4caf50'
}
</script>

<template>
  <div class="page">
    <h1>Budget Goals</h1>
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
    <p v-else class="all-set">✅ All categories have budgets set!</p>

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
            <span v-if="bs.status === 'over'" class="status-label">⚠️ Over budget!</span>
            <span v-else-if="bs.status === 'warning'" class="status-label">⚠️ Approaching limit</span>
          </span>
          <button class="btn-remove" @click="removeBudget(bs.category)">Remove</button>
        </div>
      </div>
    </div>
    <p v-else class="empty">No budgets set yet. Add one above to start tracking.</p>
  </div>
</template>

<style scoped>
.page { max-width: 600px; margin: 0 auto; }
h1 { margin-bottom: 0.25rem; }
.subtitle { color: #777; font-size: 0.9rem; margin-bottom: 1.5rem; }

.form { margin-bottom: 2rem; }
.form-row {
  display: flex; gap: 0.75rem; align-items: flex-end; flex-wrap: wrap;
}
.field { display: flex; flex-direction: column; gap: 0.25rem; flex: 1; min-width: 140px; }
.field label { font-size: 0.85rem; font-weight: 600; color: #555; }
.field input, .field select {
  padding: 0.6rem; border: 1px solid #ccc; border-radius: 8px; font-size: 1rem;
}
.btn-add {
  padding: 0.6rem 1.25rem; background: #1976d2; color: white; border: none;
  border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer;
  white-space: nowrap; align-self: flex-end;
}
.all-set { color: #2e7d32; font-weight: 500; margin-bottom: 1.5rem; }

.budget-list { display: flex; flex-direction: column; gap: 0.75rem; }
.budget-card {
  padding: 1rem; border: 1px solid #e0e0e0; border-radius: 12px;
  display: flex; flex-direction: column; gap: 0.5rem;
}
.budget-header {
  display: flex; justify-content: space-between; align-items: center;
}
.budget-category { font-weight: 700; font-size: 1rem; }
.budget-values { font-weight: 600; font-size: 0.9rem; }

.progress-bar {
  height: 10px; background: #e0e0e0; border-radius: 5px; overflow: hidden;
}
.progress-fill {
  height: 100%; border-radius: 5px; transition: width 0.3s ease;
}

.budget-footer {
  display: flex; justify-content: space-between; align-items: center;
}
.budget-percent { font-size: 0.85rem; font-weight: 600; }
.status-label { font-weight: 500; }
.btn-remove {
  padding: 0.25rem 0.6rem; background: none; color: #ef5350; border: 1px solid #ef5350;
  border-radius: 6px; font-size: 0.8rem; cursor: pointer;
}
.btn-remove:hover { background: #fce4ec; }
.empty { color: #999; font-style: italic; }
</style>


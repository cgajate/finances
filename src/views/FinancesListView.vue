<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useFinancesStore } from '@/stores/finances'
import { useSortFilter } from '@/composables/useSortFilter'
import { useSnackbar } from '@/composables/useSnackbar'
import FilterSortBar from '@/components/FilterSortBar.vue'
import SearchBar from '@/components/SearchBar.vue'
import { formatDate, formatDateTime } from '@/lib/formatDate'
import type { Frequency } from '@/types/finance'
import { ref } from 'vue'

const route = useRoute()
const store = useFinancesStore()
const snackbar = useSnackbar()

const activeTab = computed(() => (route.query.tab as string) || 'income')

// Income sort & filter
const {
  sortBy: incomeSortBy,
  sortField: incomeSortField,
  sortDirection: incomeSortDirection,
  activeFilters: incomeActiveFilters,
  activeCategoryFilters: incomeActiveCategoryFilters,
  filtered: sortedIncomes,
  toggleFilter: incomeToggleFilter,
  toggleCategoryFilter: incomeToggleCategoryFilter,
  clearFilters: incomeClearFilters,
  hasFilter: incomeHasFilter,
  hasCategoryFilter: incomeHasCategoryFilter,
} = useSortFilter(() => store.incomes)

// Income search
const incomeSearchQuery = ref('')
const filteredIncomes = computed(() => {
  const q = incomeSearchQuery.value.trim().toLowerCase()
  if (!q) return sortedIncomes.value
  return sortedIncomes.value.filter((item) => {
    const notes = item.type === 'recurring' ? item.notes : ''
    const freq = item.type === 'recurring' ? item.frequency : 'one-time'
    const date = item.type === 'recurring' ? item.date : item.date
    return [item.description, String(item.amount), item.category, item.type, notes, freq, date]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(q))
  })
})

// Expense sort & filter
const {
  sortBy: expenseSortBy,
  sortField: expenseSortField,
  sortDirection: expenseSortDirection,
  activeFilters: expenseActiveFilters,
  activeCategoryFilters: expenseActiveCategoryFilters,
  filtered: sortedExpenses,
  toggleFilter: expenseToggleFilter,
  toggleCategoryFilter: expenseToggleCategoryFilter,
  clearFilters: expenseClearFilters,
  hasFilter: expenseHasFilter,
  hasCategoryFilter: expenseHasCategoryFilter,
} = useSortFilter(() => store.expenses)

// Expense search
const expenseSearchQuery = ref('')
const filteredExpenses = computed(() => {
  const q = expenseSearchQuery.value.trim().toLowerCase()
  if (!q) return sortedExpenses.value
  return sortedExpenses.value.filter((item) => {
    const freq = item.type === 'recurring' ? item.frequency : 'one-time'
    return [
      item.description,
      String(item.amount),
      item.category,
      item.type,
      item.notes,
      freq,
      item.dueDate,
      item.assignedTo,
    ]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(q))
  })
})

function deleteIncome(id: string) {
  const item = store.getIncomeById(id)
  if (!item) return
  const snapshot = { ...item }
  store.removeIncome(id)
  snackbar.show(`Deleted "${snapshot.description}"`, () => {
    if (snapshot.type === 'recurring') {
      store.addRecurringIncome({
        amount: snapshot.amount,
        frequency: snapshot.frequency,
        description: snapshot.description,
        notes: snapshot.notes,
        date: snapshot.date,
        category: snapshot.category,
      })
    } else {
      store.addAdhocIncome({
        amount: snapshot.amount,
        description: snapshot.description,
        date: snapshot.date,
        category: snapshot.category,
      })
    }
  })
}

function deleteExpense(id: string) {
  const item = store.getExpenseById(id)
  if (!item) return
  const snapshot = { ...item }
  store.removeExpense(id)
  snackbar.show(`Deleted "${snapshot.description}"`, () => {
    if (snapshot.type === 'recurring') {
      store.addRecurringExpense({
        amount: snapshot.amount,
        frequency: snapshot.frequency,
        description: snapshot.description,
        notes: snapshot.notes,
        dueDate: snapshot.dueDate,
        category: snapshot.category,
        assignedTo: snapshot.assignedTo,
      })
    } else {
      store.addAdhocExpense({
        amount: snapshot.amount,
        description: snapshot.description,
        notes: snapshot.notes,
        dueDate: snapshot.dueDate,
        category: snapshot.category,
        assignedTo: snapshot.assignedTo,
      })
    }
  })
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

function advanceDate(dateStr: string, frequency: Frequency): string {
  const d = new Date(dateStr + 'T00:00:00')
  switch (frequency) {
    case 'weekly':
      d.setDate(d.getDate() + 7)
      break
    case 'bi-weekly':
      d.setDate(d.getDate() + 14)
      break
    case 'monthly':
      d.setMonth(d.getMonth() + 1)
      break
    case 'quarterly':
      d.setMonth(d.getMonth() + 3)
      break
    case 'yearly':
      d.setFullYear(d.getFullYear() + 1)
      break
  }
  return d.toISOString().split('T')[0] ?? dateStr
}

function getNextDueDate(dateStr: string, frequency: Frequency): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let current = dateStr
  while (new Date(current + 'T00:00:00') < today) {
    current = advanceDate(current, frequency)
  }
  return current
}
</script>

<template>
  <!-- Income Tab -->
  <div v-if="activeTab === 'income'">
    <div class="section-header">
      <h2>All Income</h2>
      <RouterLink to="/finances/income/add" class="btn">
        <font-awesome-icon :icon="['fas', 'plus']" /> Add Income
      </RouterLink>
    </div>

    <SearchBar v-if="store.incomes.length" v-model="incomeSearchQuery" placeholder="Search income..." />

    <FilterSortBar
      v-if="store.incomes.length"
      :sort-by="incomeSortBy"
      :sort-field="incomeSortField"
      :sort-direction="incomeSortDirection"
      :active-filters="incomeActiveFilters"
      :active-category-filters="incomeActiveCategoryFilters"
      :has-filter="incomeHasFilter"
      :has-category-filter="incomeHasCategoryFilter"
      type="income"
      @update:sort-by="incomeSortBy = $event"
      @update:sort-field="incomeSortField = $event"
      @update:sort-direction="incomeSortDirection = $event"
      @toggle-filter="incomeToggleFilter"
      @toggle-category-filter="incomeToggleCategoryFilter"
      @clear-filters="incomeClearFilters"
    />

    <div v-if="filteredIncomes.length" class="list">
      <div v-for="item in filteredIncomes" :key="item.id" class="list-item">
        <div class="list-item-main">
          <strong>{{ item.description }}</strong>
          <span class="amount income-amount">{{ formatCurrency(item.amount) }}</span>
        </div>
        <div class="list-item-meta">
          <span class="badge income-badge">{{ item.type === 'recurring' ? item.frequency : 'one-time' }}</span>
          <span class="badge cat-badge">{{ item.category ?? 'Other' }}</span>
          <span v-if="item.type === 'recurring' && item.notes" class="meta">📝 {{ item.notes }}</span>
        </div>
        <div v-if="item.type === 'recurring' && item.date" class="list-item-date">
          <font-awesome-icon :icon="['fas', 'calendar-day']" class="date-icon income-date-icon" />
          Next: {{ formatDate(getNextDueDate(item.date, item.frequency)) }}
        </div>
        <div v-else-if="item.type === 'adhoc'" class="list-item-date">
          <font-awesome-icon :icon="['fas', 'calendar']" class="date-icon income-date-icon" />
          {{ formatDate(item.date) }}
        </div>
        <div class="list-item-created">
          Created {{ formatDateTime(item.createdAt) }}
        </div>
        <div class="list-item-actions">
          <RouterLink :to="`/finances/income/${item.id}/edit`" class="btn-edit">Edit</RouterLink>
          <button class="btn-delete" @click="deleteIncome(item.id)">Remove</button>
        </div>
      </div>
    </div>
    <p v-else-if="store.incomes.length && incomeSearchQuery" class="empty">
      No income matches "{{ incomeSearchQuery }}".
    </p>
    <p v-else-if="store.incomes.length" class="empty">No income matches the current filter.</p>
    <p v-else class="empty">No income entries yet.</p>
  </div>

  <!-- Expenses Tab -->
  <div v-if="activeTab === 'expenses'">
    <div class="section-header">
      <h2>All Expenses</h2>
      <RouterLink to="/finances/expenses/add" class="btn">
        <font-awesome-icon :icon="['fas', 'plus']" /> Add Expense
      </RouterLink>
    </div>

    <SearchBar
      v-if="store.expenses.length"
      v-model="expenseSearchQuery"
      placeholder="Search expenses..."
    />

    <FilterSortBar
      v-if="store.expenses.length"
      :sort-by="expenseSortBy"
      :sort-field="expenseSortField"
      :sort-direction="expenseSortDirection"
      :active-filters="expenseActiveFilters"
      :active-category-filters="expenseActiveCategoryFilters"
      :has-filter="expenseHasFilter"
      :has-category-filter="expenseHasCategoryFilter"
      type="expense"
      @update:sort-by="expenseSortBy = $event"
      @update:sort-field="expenseSortField = $event"
      @update:sort-direction="expenseSortDirection = $event"
      @toggle-filter="expenseToggleFilter"
      @toggle-category-filter="expenseToggleCategoryFilter"
      @clear-filters="expenseClearFilters"
    />

    <div v-if="filteredExpenses.length" class="list">
      <div v-for="item in filteredExpenses" :key="item.id" class="list-item">
        <div class="list-item-main">
          <strong>{{ item.description }}</strong>
          <span class="amount expense-amount">{{ formatCurrency(item.amount) }}</span>
        </div>
        <div class="list-item-meta">
          <span class="badge expense-badge">{{ item.type === 'recurring' ? item.frequency : 'one-time' }}</span>
          <span class="badge cat-badge">{{ item.category ?? 'Other' }}</span>
          <span v-if="item.assignedTo" class="badge assigned-badge">👤 {{ item.assignedTo }}</span>
          <span v-if="item.notes" class="meta">📝 {{ item.notes }}</span>
        </div>
        <div v-if="item.type === 'recurring' && item.dueDate" class="list-item-date">
          <font-awesome-icon :icon="['fas', 'calendar-day']" class="date-icon expense-date-icon" />
          Next due: {{ formatDate(getNextDueDate(item.dueDate, item.frequency)) }}
        </div>
        <div v-else-if="item.dueDate" class="list-item-date">
          <font-awesome-icon :icon="['fas', 'calendar']" class="date-icon expense-date-icon" />
          Due: {{ formatDate(item.dueDate) }}
        </div>
        <div class="list-item-created">
          Created {{ formatDateTime(item.createdAt) }}
          <span v-if="item.assignedTo" class="created-by">by {{ item.assignedTo }}</span>
        </div>
        <div class="list-item-actions">
          <RouterLink :to="`/finances/expenses/${item.id}/edit`" class="btn-edit">Edit</RouterLink>
          <button class="btn-delete" @click="deleteExpense(item.id)">Remove</button>
        </div>
      </div>
    </div>
    <p v-else-if="store.expenses.length && expenseSearchQuery" class="empty">
      No expenses match "{{ expenseSearchQuery }}".
    </p>
    <p v-else-if="store.expenses.length" class="empty">
      No expenses match the current filter.
    </p>
    <p v-else class="empty">No expense entries yet.</p>
  </div>
</template>

<style scoped>
h2 { margin: 0; font-size: 1.1rem; }

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.list { display: flex; flex-direction: column; gap: 0.5rem; }
.list-item {
  padding: 0.75rem; border: 1px solid var(--color-border); border-radius: 8px; display: flex;
  flex-direction: column; gap: 0.4rem; background: var(--color-surface);
}
.list-item-main { display: flex; justify-content: space-between; align-items: center; }
.list-item-meta { display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center; }
.list-item-actions { display: flex; gap: 0.5rem; justify-content: flex-end; }
.income-amount { font-weight: 700; color: var(--color-income); }
.expense-amount { font-weight: 700; color: var(--color-expense); }
.badge {
  font-size: 0.75rem; padding: 0.15rem 0.5rem;
  border-radius: 4px; text-transform: capitalize;
}
.income-badge { background: var(--color-income-bg); color: var(--color-income); }
.expense-badge { background: var(--color-expense-bg); color: var(--color-expense); }
.meta { font-size: 0.8rem; color: var(--color-text-muted); }
.list-item-date { font-size: 0.85rem; color: var(--color-text); display: flex; align-items: center; gap: 0.4rem; }
.income-date-icon { color: var(--color-income); font-size: 0.85rem; }
.expense-date-icon { color: var(--color-expense); font-size: 0.85rem; }
.list-item-created { font-size: 0.75rem; color: var(--color-text-muted); }
.created-by { margin-left: 0.25rem; }
.cat-badge { background: var(--color-cat-bg); color: var(--color-cat-text); }
.assigned-badge { background: var(--color-assigned-bg); color: var(--color-assigned-text); }
.empty { color: var(--color-text-muted); font-style: italic; }
</style>


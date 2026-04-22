<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFinancesStore } from '@/stores/finances'
import { useSortFilter } from '@/composables/useSortFilter'
import { useSnackbar } from '@/composables/useSnackbar'
import FilterSortBar from '@/components/FilterSortBar.vue'
import SearchBar from '@/components/SearchBar.vue'
import { formatDate, formatDateTime } from '@/lib/formatDate'
import type { Frequency } from '@/types/finance'

const store = useFinancesStore()
const snackbar = useSnackbar()

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

// Sort & filter
const {
  sortBy,
  sortField,
  sortDirection,
  activeFilters,
  activeCategoryFilters,
  filtered: sortedExpenses,
  toggleFilter,
  toggleCategoryFilter,
  clearFilters,
  hasFilter,
  hasCategoryFilter,
} = useSortFilter(() => store.expenses)

// Search
const searchQuery = ref('')
const filteredExpenses = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
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
  <div class="page">
    <div class="page-header">
      <h1>Expenses</h1>
      <RouterLink to="/expenses/add" class="btn">
        <font-awesome-icon :icon="['fas', 'plus']" /> Add Expense
      </RouterLink>
    </div>

    <!-- Expense List -->
    <h2>All Expenses</h2>

    <SearchBar
      v-if="store.expenses.length"
      v-model="searchQuery"
      placeholder="Search expenses..."
    />

    <FilterSortBar
      v-if="store.expenses.length"
      :sort-by="sortBy"
      :sort-field="sortField"
      :sort-direction="sortDirection"
      :active-filters="activeFilters"
      :active-category-filters="activeCategoryFilters"
      :has-filter="hasFilter"
      :has-category-filter="hasCategoryFilter"
      type="expense"
      @update:sort-by="sortBy = $event"
      @update:sort-field="sortField = $event"
      @update:sort-direction="sortDirection = $event"
      @toggle-filter="toggleFilter"
      @toggle-category-filter="toggleCategoryFilter"
      @clear-filters="clearFilters"
    />

    <div v-if="filteredExpenses.length" class="list">
      <div v-for="item in filteredExpenses" :key="item.id" class="list-item">
        <div class="list-item-main">
          <strong>{{ item.description }}</strong>
          <span class="amount">{{ formatCurrency(item.amount) }}</span>
        </div>
        <div class="list-item-meta">
          <span class="badge">{{ item.type === 'recurring' ? item.frequency : 'one-time' }}</span>
          <span class="badge cat-badge">{{ item.category ?? 'Other' }}</span>
          <span v-if="item.assignedTo" class="badge assigned-badge"
            >👤 {{ item.assignedTo }}</span
          >
          <span v-if="item.notes" class="meta">📝 {{ item.notes }}</span>
        </div>
        <div v-if="item.type === 'recurring' && item.dueDate" class="list-item-date">
          <font-awesome-icon :icon="['fas', 'calendar-day']" class="date-icon" />
          Next due: {{ formatDate(getNextDueDate(item.dueDate, item.frequency)) }}
        </div>
        <div v-else-if="item.dueDate" class="list-item-date">
          <font-awesome-icon :icon="['fas', 'calendar']" class="date-icon" />
          Due: {{ formatDate(item.dueDate) }}
        </div>
        <div class="list-item-created">
          Created {{ formatDateTime(item.createdAt) }}
          <span v-if="item.assignedTo" class="created-by">by {{ item.assignedTo }}</span>
        </div>
        <div class="list-item-actions">
          <RouterLink :to="`/expenses/${item.id}/edit`" class="btn-edit">Edit</RouterLink>
          <button class="btn-delete" @click="deleteExpense(item.id)">Remove</button>
        </div>
      </div>
    </div>
    <p v-else-if="store.expenses.length && searchQuery" class="empty">
      No expenses match "{{ searchQuery }}".
    </p>
    <p v-else-if="store.expenses.length" class="empty">
      No expenses match the current filter.
    </p>
    <p v-else class="empty">No expense entries yet.</p>
  </div>
</template>

<style scoped>
.page { max-width: 600px; margin: 0 auto; }
h1 { margin: 0; }
h2 { margin-top: 2rem; margin-bottom: 0.75rem; font-size: 1.1rem; }

.page-header {
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
.amount { font-weight: 700; color: var(--color-expense); }
.badge {
  font-size: 0.75rem; background: var(--color-expense-bg); color: var(--color-expense); padding: 0.15rem 0.5rem;
  border-radius: 4px; text-transform: capitalize;
}
.meta { font-size: 0.8rem; color: var(--color-text-muted); }
.list-item-date { font-size: 0.85rem; color: var(--color-text); display: flex; align-items: center; gap: 0.4rem; }
.date-icon { color: var(--color-expense); font-size: 0.85rem; }
.list-item-created { font-size: 0.75rem; color: var(--color-text-muted); }
.created-by { margin-left: 0.25rem; }
.cat-badge { background: var(--color-cat-bg); color: var(--color-cat-text); }
.assigned-badge { background: var(--color-assigned-bg); color: var(--color-assigned-text); }
.empty { color: var(--color-text-muted); font-style: italic; }
</style>


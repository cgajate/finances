<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useFinancesStore } from '@/stores/finances'
import { useDualSortFilter } from '@/composables/useDualSortFilter'
import { useDeleteWithUndo } from '@/composables/useDeleteWithUndo'
import { useSearchFilter } from '@/composables/useSearchFilter'
import FilterSortBar from '@/components/FilterSortBar.vue'
import SearchBar from '@/components/SearchBar.vue'
import EmptyState from '@/components/EmptyState.vue'
import { formatDate, formatDateTime } from '@/lib/formatDate'
import { formatCurrency } from '@/lib/formatCurrency'
import { getNextDueDate } from '@/lib/dateUtils'
import type { Income, Expense } from '@/types/finance'

const route = useRoute()
const store = useFinancesStore()
const { deleteIncome, deleteExpense } = useDeleteWithUndo()

const activeTab = computed(() => (route.query.tab as string) || 'income')

const { income, expense } = useDualSortFilter(
  () => store.incomes,
  () => store.expenses,
)

// Income search
const { searchQuery: incomeSearchQuery, filtered: filteredIncomes } = useSearchFilter<Income>(
  () => income.filtered,
  (item) => [
    item.description,
    String(item.amount),
    item.category,
    item.type,
    item.type === 'recurring' ? item.notes : '',
    item.type === 'recurring' ? item.frequency : 'one-time',
    item.date,
  ],
)

// Expense search
const { searchQuery: expenseSearchQuery, filtered: filteredExpenses } = useSearchFilter<Expense>(
  () => expense.filtered,
  (item) => [
    item.description,
    String(item.amount),
    item.category,
    item.type,
    item.notes,
    item.type === 'recurring' ? item.frequency : 'one-time',
    item.dueDate,
    item.assignedTo,
  ],
)
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
      :sort-by="income.sortBy"
      :sort-field="income.sortField"
      :sort-direction="income.sortDirection"
      :active-filters="income.activeFilters"
      :active-category-filters="income.activeCategoryFilters"
      :has-filter="income.hasFilter"
      :has-category-filter="income.hasCategoryFilter"
      type="income"
      @update:sort-by="income.sortBy = $event"
      @update:sort-field="income.sortField = $event"
      @update:sort-direction="income.sortDirection = $event"
      @toggle-filter="income.toggleFilter"
      @toggle-category-filter="income.toggleCategoryFilter"
      @clear-filters="income.clearFilters"
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
          <span v-if="item.type === 'recurring' && item.notes" class="meta"><font-awesome-icon :icon="['fas', 'note-sticky']" /> {{ item.notes }}</span>
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
          <RouterLink :to="`/finances/income/${item.id}/edit`" class="btn-edit" :aria-label="`Edit ${item.description}`">Edit</RouterLink>
          <button class="btn-delete" :aria-label="`Remove ${item.description}`" @click="deleteIncome(item.id)">Remove</button>
        </div>
      </div>
    </div>
    <EmptyState v-else-if="store.incomes.length && incomeSearchQuery" :message="`No income matches &quot;${incomeSearchQuery}&quot;.`" />
    <EmptyState v-else-if="store.incomes.length" message="No income matches the current filter." />
    <EmptyState v-else message="No income entries yet." />
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
      :sort-by="expense.sortBy"
      :sort-field="expense.sortField"
      :sort-direction="expense.sortDirection"
      :active-filters="expense.activeFilters"
      :active-category-filters="expense.activeCategoryFilters"
      :has-filter="expense.hasFilter"
      :has-category-filter="expense.hasCategoryFilter"
      type="expense"
      @update:sort-by="expense.sortBy = $event"
      @update:sort-field="expense.sortField = $event"
      @update:sort-direction="expense.sortDirection = $event"
      @toggle-filter="expense.toggleFilter"
      @toggle-category-filter="expense.toggleCategoryFilter"
      @clear-filters="expense.clearFilters"
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
          <span v-if="item.assignedTo" class="badge assigned-badge"><font-awesome-icon :icon="['fas', 'user']" /> {{ item.assignedTo }}</span>
          <span v-if="item.notes" class="meta"><font-awesome-icon :icon="['fas', 'note-sticky']" /> {{ item.notes }}</span>
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
          <RouterLink :to="`/finances/expenses/${item.id}/edit`" class="btn-edit" :aria-label="`Edit ${item.description}`">Edit</RouterLink>
          <button class="btn-delete" :aria-label="`Remove ${item.description}`" @click="deleteExpense(item.id)">Remove</button>
        </div>
      </div>
    </div>
    <EmptyState v-else-if="store.expenses.length && expenseSearchQuery" :message="`No expenses match &quot;${expenseSearchQuery}&quot;.`" />
    <EmptyState v-else-if="store.expenses.length" message="No expenses match the current filter." />
    <EmptyState v-else message="No expense entries yet." />
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
</style>


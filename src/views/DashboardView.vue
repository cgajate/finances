<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFinancesStore } from '@/stores/finances'
import { useBudgetsStore } from '@/stores/budgets'
import { useSavingsGoalsStore } from '@/stores/savingsGoals'
import { useSortFilter } from '@/composables/useSortFilter'
import { useSearch } from '@/composables/useSearch'
import FilterSortBar from '@/components/FilterSortBar.vue'
import { formatCurrency } from '@/lib/formatCurrency'
import SearchBar from '@/components/SearchBar.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import EmptyState from '@/components/EmptyState.vue'

const store = useFinancesStore()
const budgetsStore = useBudgetsStore()
const savingsStore = useSavingsGoalsStore()

// Global search
const { query: searchQuery, results: searchResults, resultCount, clearSearch } = useSearch()

const {
  sortBy: incomeSortBy,
  sortField: incomeSortField,
  sortDirection: incomeSortDirection,
  activeFilters: incomeActiveFilters,
  activeCategoryFilters: incomeActiveCategoryFilters,
  filtered: filteredIncomes,
  toggleFilter: incomeToggleFilter,
  toggleCategoryFilter: incomeToggleCategoryFilter,
  clearFilters: incomeClearFilters,
  hasFilter: incomeHasFilter,
  hasCategoryFilter: incomeHasCategoryFilter,
} = useSortFilter(() => store.incomes)

const {
  sortBy: expenseSortBy,
  sortField: expenseSortField,
  sortDirection: expenseSortDirection,
  activeFilters: expenseActiveFilters,
  activeCategoryFilters: expenseActiveCategoryFilters,
  filtered: filteredExpenses,
  toggleFilter: expenseToggleFilter,
  toggleCategoryFilter: expenseToggleCategoryFilter,
  clearFilters: expenseClearFilters,
  hasFilter: expenseHasFilter,
  hasCategoryFilter: expenseHasCategoryFilter,
} = useSortFilter(() => store.expenses)

const incomeExpanded = ref(false)
const expenseExpanded = ref(false)

const displayedIncomes = computed(() => {
  if (incomeExpanded.value) return filteredIncomes.value
  return filteredIncomes.value.slice(0, 5)
})

const displayedExpenses = computed(() => {
  if (expenseExpanded.value) return filteredExpenses.value
  return filteredExpenses.value.slice(0, 5)
})


function formatFrequency(freq: string): string {
  return freq.replace('-', '-')
}
</script>

<template>
  <div class="dashboard">
    <h1>Family Finances</h1>

    <!-- Global Search -->
    <SearchBar v-model="searchQuery" placeholder="Search all income & expenses..." />

    <!-- Search Results -->
    <div v-if="searchQuery.trim()" class="search-results">
      <h2>Search Results ({{ resultCount }})</h2>
      <div v-if="searchResults.length" class="search-list">
        <div v-for="r in searchResults" :key="r.id" class="search-item">
          <div class="search-item-main">
            <span class="badge" :class="r.kind === 'income' ? 'badge-income' : 'badge-expense'">{{ r.kind }}</span>
            <strong>{{ r.description }}</strong>
            <span class="amount" :class="r.kind === 'income' ? '' : 'expense'">{{ formatCurrency(r.amount) }}</span>
          </div>
          <div class="search-item-meta">
            <span class="badge cat-badge">{{ r.category }}</span>
          </div>
        </div>
      </div>
      <EmptyState v-else :message="`No results for &quot;${searchQuery}&quot;.`" />
    </div>

    <template v-if="!searchQuery.trim()">
    <div class="summary-cards">
      <div class="card income-card">
        <span class="card-label">Monthly Income</span>
        <span class="card-value">{{ formatCurrency(store.totalMonthlyIncome) }}</span>
      </div>
      <div class="card expense-card">
        <span class="card-label">Monthly Expenses</span>
        <span class="card-value">{{ formatCurrency(store.totalMonthlyExpenses) }}</span>
      </div>
      <div class="card net-card" :class="{ negative: store.netMonthly < 0 }">
        <span class="card-label">Net Monthly</span>
        <span class="card-value">{{ formatCurrency(store.netMonthly) }}</span>
      </div>
    </div>

    <div class="quick-lists">
      <!-- Income Section -->
      <section>
        <h2>Income ({{ filteredIncomes.length }}<span v-if="incomeActiveFilters.length"> filtered</span>)</h2>

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

        <ul v-if="displayedIncomes.length">
          <li v-for="item in displayedIncomes" :key="item.id">
            <strong>{{ item.description }}</strong>
            <span class="amount">{{ formatCurrency(item.amount) }}</span>
            <span class="badge">{{ item.type === 'recurring' ? formatFrequency(item.frequency) : 'one-time' }}</span>
          </li>
        </ul>
        <EmptyState v-else-if="store.incomes.length" message="No income matches the current filter." />
        <EmptyState v-else message="No income added yet." />

        <div class="section-actions">
          <button
            v-if="filteredIncomes.length > 5"
            class="btn-toggle"
            @click="incomeExpanded = !incomeExpanded"
          >
            {{ incomeExpanded ? 'Show Less' : `View All (${filteredIncomes.length})` }}
            <font-awesome-icon :icon="['fas', incomeExpanded ? 'chevron-up' : 'chevron-down']" />
          </button>
          <RouterLink to="/finances?tab=income" class="btn">Manage Income <font-awesome-icon :icon="['fas', 'arrow-right']" /></RouterLink>
        </div>
      </section>

      <!-- Expenses Section -->
      <section>
        <h2>Expenses ({{ filteredExpenses.length }}<span v-if="expenseActiveFilters.length"> filtered</span>)</h2>

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

        <ul v-if="displayedExpenses.length">
          <li v-for="item in displayedExpenses" :key="item.id">
            <strong>{{ item.description }}</strong>
            <span class="amount expense">{{ formatCurrency(item.amount) }}</span>
            <span class="badge">{{ item.type === 'recurring' ? formatFrequency(item.frequency) : 'one-time' }}</span>
          </li>
        </ul>
        <EmptyState v-else-if="store.expenses.length" message="No expenses match the current filter." />
        <EmptyState v-else message="No expenses added yet." />

        <div class="section-actions">
          <button
            v-if="filteredExpenses.length > 5"
            class="btn-toggle"
            @click="expenseExpanded = !expenseExpanded"
          >
            {{ expenseExpanded ? 'Show Less' : `View All (${filteredExpenses.length})` }}
            <font-awesome-icon :icon="['fas', expenseExpanded ? 'chevron-up' : 'chevron-down']" />
          </button>
          <RouterLink to="/finances?tab=expenses" class="btn">Manage Expenses <font-awesome-icon :icon="['fas', 'arrow-right']" /></RouterLink>
        </div>
      </section>
    </div>

    <!-- Budget Progress -->
    <section v-if="budgetsStore.budgetStatus.length" class="budget-section">
      <h2>Budget Progress</h2>
      <div class="budget-bars">
        <div
          v-for="bs in budgetsStore.budgetStatus"
          :key="bs.category"
          class="budget-row"
        >
          <div class="budget-info">
            <span class="budget-cat">{{ bs.category }}</span>
            <span
              class="budget-amt"
              :class="{ 'budget-warning': bs.status === 'warning', 'budget-over': bs.status === 'over' }"
            >
              {{ formatCurrency(bs.spent) }} / {{ formatCurrency(bs.limit) }}
            </span>
          </div>
          <ProgressBar
            :percent="bs.percent"
            :variant="bs.status as 'ok' | 'warning' | 'over'"
            :height="8"
          />
        </div>
      </div>
      <RouterLink to="/budgets" class="btn">Manage Budgets <font-awesome-icon :icon="['fas', 'arrow-right']" /></RouterLink>
    </section>

    <!-- Savings Goals -->
    <section v-if="savingsStore.activeGoals.length" class="savings-section">
      <h2><font-awesome-icon :icon="['fas', 'bullseye']" /> Savings Goals</h2>
      <div class="savings-goals">
        <div v-for="goal in savingsStore.activeGoals" :key="goal.id" class="savings-goal-row">
          <div class="savings-goal-info">
            <span class="savings-goal-name">{{ goal.name }}</span>
            <span class="savings-goal-amt">
              {{ formatCurrency(goal.savedAmount) }} / {{ formatCurrency(goal.targetAmount) }}
            </span>
          </div>
          <ProgressBar
            :percent="Math.min(Math.round((goal.savedAmount / goal.targetAmount) * 100), 100)"
            variant="primary"
            :height="8"
          />
        </div>
      </div>
      <RouterLink to="/savings" class="btn">Manage Goals <font-awesome-icon :icon="['fas', 'arrow-right']" /></RouterLink>
    </section>
    </template>
  </div>
</template>

<style scoped>
.dashboard {
  max-width: 800px;
  margin: 0 auto;
}

h1 {
  margin-bottom: 1.5rem;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.card {
  padding: 1.25rem;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.card-label {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.8;
}

.card-value {
  font-size: 1.5rem;
  font-weight: 700;
}

.income-card { background: var(--color-income-bg); color: var(--color-income); }
.expense-card { background: var(--color-expense-bg); color: var(--color-expense); }
.net-card { background: var(--color-primary-light); color: var(--color-primary-text); }
.net-card.negative { background: var(--color-warning-bg); color: var(--color-warning); }

.quick-lists section { margin-bottom: 2rem; }
h2 { font-size: 1.1rem; margin-bottom: 0.75rem; }

ul { list-style: none; padding: 0; margin: 0 0 1rem 0; }
li {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.75rem; border-bottom: 1px solid var(--color-border-light); flex-wrap: wrap;
}
li strong { flex: 1; min-width: 120px; }
.amount { font-weight: 600; color: var(--color-income); }
.amount.expense { color: var(--color-expense); }
.badge {
  font-size: 0.75rem; background: var(--color-badge-bg); padding: 0.2rem 0.5rem;
  border-radius: 4px; text-transform: capitalize; color: var(--color-badge-text);
}

.section-actions {
  display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;
}
.budget-section .btn { margin-top: 1rem; }

.btn-toggle:hover { background: var(--color-primary-light); }

.budget-section {
  margin-top: 2rem;
  padding: 1.5rem;
  border-radius: 12px;
  background: var(--color-bg-secondary);
}

.budget-bars { display: flex; flex-direction: column; gap: 0.75rem; }
.budget-row { display: flex; flex-direction: column; gap: 0.25rem; }
.budget-info { display: flex; justify-content: space-between; align-items: center; }
.budget-cat { font-weight: 500; font-size: 0.9rem; }
.budget-amt { font-size: 0.85rem; font-weight: 600; color: var(--color-income); }
.budget-warning { color: var(--color-warning); }
.budget-over { color: var(--color-expense); }
.budget-section .btn { margin-top: 1rem; }

.savings-section {
  margin-top: 2rem;
  padding: 1.5rem;
  border-radius: 12px;
  background: var(--color-bg-secondary);
}
.savings-goals { display: flex; flex-direction: column; gap: 0.75rem; }
.savings-goal-row { display: flex; flex-direction: column; gap: 0.25rem; }
.savings-goal-info { display: flex; justify-content: space-between; align-items: center; }
.savings-goal-name { font-weight: 500; font-size: 0.9rem; }
.savings-goal-amt { font-size: 0.85rem; font-weight: 600; color: var(--color-primary); }
.savings-section .btn { margin-top: 1rem; }.search-results { margin-bottom: 2rem; }
.search-list { display: flex; flex-direction: column; gap: 0.5rem; }
.search-item {
  padding: 0.75rem; border: 1px solid var(--color-border); border-radius: 8px;
  display: flex; flex-direction: column; gap: 0.4rem; background: var(--color-surface);
}
.search-item-main { display: flex; align-items: center; gap: 0.5rem; }
.search-item-main strong { flex: 1; }
.search-item-meta { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.badge-income { background: var(--color-income-bg); color: var(--color-income); }
.badge-expense { background: var(--color-expense-bg); color: var(--color-expense); }
.cat-badge { background: var(--color-cat-bg); color: var(--color-cat-text); }
</style>

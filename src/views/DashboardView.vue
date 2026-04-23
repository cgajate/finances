<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFinancesStore } from '@/stores/finances'
import { useBudgetsStore } from '@/stores/budgets'
import { useSavingsGoalsStore } from '@/stores/savingsGoals'
import { useDualSortFilter } from '@/composables/useDualSortFilter'
import { useSearch } from '@/composables/useSearch'
import FilterSortBar from '@/components/FilterSortBar.vue'
import SummaryCard from '@/components/SummaryCard.vue'
import BudgetProgressRow from '@/components/BudgetProgressRow.vue'
import SavingsGoalRow from '@/components/SavingsGoalRow.vue'
import DashboardSearchResults from '@/components/DashboardSearchResults.vue'
import { formatCurrency } from '@/lib/formatCurrency'
import SearchBar from '@/components/SearchBar.vue'
import EmptyState from '@/components/EmptyState.vue'

const store = useFinancesStore()
const budgetsStore = useBudgetsStore()
const savingsStore = useSavingsGoalsStore()

// Global search
const { query: searchQuery, results: searchResults, resultCount, clearSearch } = useSearch()

const { income, expense } = useDualSortFilter(
  () => store.incomes,
  () => store.expenses,
)

const incomeExpanded = ref(false)
const expenseExpanded = ref(false)

const displayedIncomes = computed(() => {
  if (incomeExpanded.value) return income.filtered
  return income.filtered.slice(0, 5)
})

const displayedExpenses = computed(() => {
  if (expenseExpanded.value) return expense.filtered
  return expense.filtered.slice(0, 5)
})</script>

<template>
  <div class="dashboard">
    <h1>Family Finances</h1>

    <!-- Global Search -->
    <SearchBar v-model="searchQuery" placeholder="Search all income & expenses..." />

    <!-- Search Results -->
    <div aria-live="polite">
      <DashboardSearchResults
        v-if="searchQuery.trim()"
        :query="searchQuery"
        :results="searchResults"
        :count="resultCount"
      />
    </div>

    <template v-if="!searchQuery.trim()">
    <div class="summary-cards">
      <SummaryCard label="Monthly Income" :value="store.totalMonthlyIncome" variant="income" />
      <SummaryCard label="Monthly Expenses" :value="store.totalMonthlyExpenses" variant="expense" />
      <SummaryCard label="Net Monthly" :value="store.netMonthly" variant="net" :negative="store.netMonthly < 0" />
    </div>

    <div class="quick-lists">
      <!-- Income Section -->
      <section>
        <h2>Income ({{ income.filtered.length }}<span v-if="income.activeFilters.length"> filtered</span>)</h2>

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

        <ul v-if="displayedIncomes.length">
          <li v-for="item in displayedIncomes" :key="item.id">
            <strong>{{ item.description }}</strong>
            <span class="amount">{{ formatCurrency(item.amount) }}</span>
            <span class="badge">{{ item.type === 'recurring' ? item.frequency : 'one-time' }}</span>
          </li>
        </ul>
        <EmptyState v-else-if="store.incomes.length" message="No income matches the current filter." />
        <EmptyState v-else message="No income added yet." />

        <div class="section-actions">
          <button
            v-if="income.filtered.length > 5"
            class="btn-toggle"
            @click="incomeExpanded = !incomeExpanded"
          >
            {{ incomeExpanded ? 'Show Less' : `View All (${income.filtered.length})` }}
            <font-awesome-icon :icon="['fas', incomeExpanded ? 'chevron-up' : 'chevron-down']" />
          </button>
          <RouterLink to="/finances?tab=income" class="btn">Manage Income <font-awesome-icon :icon="['fas', 'arrow-right']" /></RouterLink>
        </div>
      </section>

      <!-- Expenses Section -->
      <section>
        <h2>Expenses ({{ expense.filtered.length }}<span v-if="expense.activeFilters.length"> filtered</span>)</h2>

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

        <ul v-if="displayedExpenses.length">
          <li v-for="item in displayedExpenses" :key="item.id">
            <strong>{{ item.description }}</strong>
            <span class="amount expense">{{ formatCurrency(item.amount) }}</span>
            <span class="badge">{{ item.type === 'recurring' ? item.frequency : 'one-time' }}</span>
          </li>
        </ul>
        <EmptyState v-else-if="store.expenses.length" message="No expenses match the current filter." />
        <EmptyState v-else message="No expenses added yet." />

        <div class="section-actions">
          <button
            v-if="expense.filtered.length > 5"
            class="btn-toggle"
            @click="expenseExpanded = !expenseExpanded"
          >
            {{ expenseExpanded ? 'Show Less' : `View All (${expense.filtered.length})` }}
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
        <BudgetProgressRow
          v-for="bs in budgetsStore.budgetStatus"
          :key="bs.category"
          :status="bs"
        />
      </div>
      <RouterLink to="/budgets" class="btn">Manage Budgets <font-awesome-icon :icon="['fas', 'arrow-right']" /></RouterLink>
    </section>

    <!-- Savings Goals -->
    <section v-if="savingsStore.activeGoals.length" class="savings-section">
      <h2><font-awesome-icon :icon="['fas', 'bullseye']" /> Savings Goals</h2>
      <div class="savings-goals">
        <SavingsGoalRow
          v-for="goal in savingsStore.activeGoals"
          :key="goal.id"
          :goal="goal"
        />
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

.budget-section .btn,
.savings-section .btn { margin-top: 1rem; }

.btn-toggle:hover { background: var(--color-primary-light); }

.budget-section,
.savings-section {
  margin-top: 2rem;
  padding: 1.5rem;
  border-radius: 12px;
  background: var(--color-bg-secondary);
}

.budget-bars,
.savings-goals { display: flex; flex-direction: column; gap: 0.75rem; }
</style>

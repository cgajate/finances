<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFinancesStore } from '@/stores/finances'
import { useSortFilter } from '@/composables/useSortFilter'
import FilterSortBar from '@/components/FilterSortBar.vue'

const store = useFinancesStore()

const {
  sortBy: incomeSortBy,
  activeFilters: incomeActiveFilters,
  filtered: filteredIncomes,
  toggleFilter: incomeToggleFilter,
  clearFilters: incomeClearFilters,
  hasFilter: incomeHasFilter,
} = useSortFilter(store.incomes)

const {
  sortBy: expenseSortBy,
  activeFilters: expenseActiveFilters,
  filtered: filteredExpenses,
  toggleFilter: expenseToggleFilter,
  clearFilters: expenseClearFilters,
  hasFilter: expenseHasFilter,
} = useSortFilter(store.expenses)

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

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

function formatFrequency(freq: string): string {
  return freq.replace('-', '-')
}
</script>

<template>
  <div class="dashboard">
    <h1>Family Finances</h1>

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
          :active-filters="incomeActiveFilters"
          :has-filter="incomeHasFilter"
          @update:sort-by="incomeSortBy = $event"
          @toggle-filter="incomeToggleFilter"
          @clear-filters="incomeClearFilters"
        />

        <ul v-if="displayedIncomes.length">
          <li v-for="item in displayedIncomes" :key="item.id">
            <strong>{{ item.description }}</strong>
            <span class="amount">{{ formatCurrency(item.amount) }}</span>
            <span class="badge">{{ item.type === 'recurring' ? formatFrequency(item.frequency) : 'one-time' }}</span>
          </li>
        </ul>
        <p v-else-if="store.incomes.length" class="empty">No income matches the current filter.</p>
        <p v-else class="empty">No income added yet.</p>

        <div class="section-actions">
          <button
            v-if="filteredIncomes.length > 5"
            class="btn-toggle"
            @click="incomeExpanded = !incomeExpanded"
          >
            {{ incomeExpanded ? 'Show Less ↑' : `View All (${filteredIncomes.length}) ↓` }}
          </button>
          <RouterLink to="/income" class="btn">Manage Income →</RouterLink>
        </div>
      </section>

      <!-- Expenses Section -->
      <section>
        <h2>Expenses ({{ filteredExpenses.length }}<span v-if="expenseActiveFilters.length"> filtered</span>)</h2>

        <FilterSortBar
          v-if="store.expenses.length"
          :sort-by="expenseSortBy"
          :active-filters="expenseActiveFilters"
          :has-filter="expenseHasFilter"
          @update:sort-by="expenseSortBy = $event"
          @toggle-filter="expenseToggleFilter"
          @clear-filters="expenseClearFilters"
        />

        <ul v-if="displayedExpenses.length">
          <li v-for="item in displayedExpenses" :key="item.id">
            <strong>{{ item.description }}</strong>
            <span class="amount expense">{{ formatCurrency(item.amount) }}</span>
            <span class="badge">{{ item.type === 'recurring' ? formatFrequency(item.frequency) : 'one-time' }}</span>
          </li>
        </ul>
        <p v-else-if="store.expenses.length" class="empty">No expenses match the current filter.</p>
        <p v-else class="empty">No expenses added yet.</p>

        <div class="section-actions">
          <button
            v-if="filteredExpenses.length > 5"
            class="btn-toggle"
            @click="expenseExpanded = !expenseExpanded"
          >
            {{ expenseExpanded ? 'Show Less ↑' : `View All (${filteredExpenses.length}) ↓` }}
          </button>
          <RouterLink to="/expenses" class="btn">Manage Expenses →</RouterLink>
        </div>
      </section>
    </div>
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

.income-card { background: #e8f5e9; color: #2e7d32; }
.expense-card { background: #fce4ec; color: #c62828; }
.net-card { background: #e3f2fd; color: #1565c0; }
.net-card.negative { background: #fff3e0; color: #e65100; }

.quick-lists section { margin-bottom: 2rem; }
h2 { font-size: 1.1rem; margin-bottom: 0.75rem; }

ul { list-style: none; padding: 0; margin: 0 0 1rem 0; }
li {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.75rem; border-bottom: 1px solid #eee; flex-wrap: wrap;
}
li strong { flex: 1; min-width: 120px; }
.amount { font-weight: 600; color: #2e7d32; }
.amount.expense { color: #c62828; }
.badge {
  font-size: 0.75rem; background: #f0f0f0; padding: 0.2rem 0.5rem;
  border-radius: 4px; text-transform: capitalize;
}
.empty { color: #999; font-style: italic; }

.section-actions {
  display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;
}
.btn {
  display: inline-block; padding: 0.5rem 1rem; background: #1976d2;
  color: white; border-radius: 8px; text-decoration: none; font-size: 0.9rem;
}
.btn-toggle {
  padding: 0.5rem 1rem; background: none; color: #1976d2;
  border: 1px solid #1976d2; border-radius: 8px; font-size: 0.9rem;
  cursor: pointer; font-weight: 500;
}
.btn-toggle:hover { background: #e3f2fd; }
</style>

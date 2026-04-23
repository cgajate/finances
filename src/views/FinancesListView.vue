<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useFinancesStore } from '@/stores/finances'
import { useDualSortFilter } from '@/composables/useDualSortFilter'
import { useDeleteWithUndo } from '@/composables/useDeleteWithUndo'
import { useSearchFilter } from '@/composables/useSearchFilter'
import FilterSortBar from '@/components/FilterSortBar.vue'
import FinanceListItem from '@/components/FinanceListItem.vue'
import SearchBar from '@/components/SearchBar.vue'
import EmptyState from '@/components/EmptyState.vue'
import { formatCurrency } from '@/lib/formatCurrency'
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
      <FinanceListItem
        v-for="item in filteredIncomes"
        :key="item.id"
        :item="item"
        kind="income"
        @delete="deleteIncome"
      />
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
      <FinanceListItem
        v-for="item in filteredExpenses"
        :key="item.id"
        :item="item"
        kind="expense"
        @delete="deleteExpense"
      />
    </div>
    <EmptyState v-else-if="store.expenses.length && expenseSearchQuery" :message="`No expenses match &quot;${expenseSearchQuery}&quot;.`" />
    <EmptyState v-else-if="store.expenses.length" message="No expenses match the current filter." />
    <EmptyState v-else message="No expense entries yet." />
  </div>
</template>

<style scoped>
h2 { margin: 0; font-size: 1.1rem; }
</style>


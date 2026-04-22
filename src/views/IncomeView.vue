<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFinancesStore } from '@/stores/finances'
import { useSortFilter } from '@/composables/useSortFilter'
import { useSnackbar } from '@/composables/useSnackbar'
import FilterSortBar from '@/components/FilterSortBar.vue'
import SearchBar from '@/components/SearchBar.vue'

const store = useFinancesStore()
const snackbar = useSnackbar()

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

// Sort & filter
const {
  sortBy,
  sortField,
  sortDirection,
  activeFilters,
  activeCategoryFilters,
  filtered: sortedIncomes,
  toggleFilter,
  toggleCategoryFilter,
  clearFilters,
  hasFilter,
  hasCategoryFilter,
} = useSortFilter(() => store.incomes)

// Search
const searchQuery = ref('')
const filteredIncomes = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
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

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h1>Income</h1>
      <RouterLink to="/income/add" class="btn">
        <font-awesome-icon :icon="['fas', 'plus']" /> Add Income
      </RouterLink>
    </div>

    <!-- Income List -->
    <h2>All Income</h2>

    <SearchBar v-if="store.incomes.length" v-model="searchQuery" placeholder="Search income..." />

    <FilterSortBar
      v-if="store.incomes.length"
      :sort-by="sortBy"
      :sort-field="sortField"
      :sort-direction="sortDirection"
      :active-filters="activeFilters"
      :active-category-filters="activeCategoryFilters"
      :has-filter="hasFilter"
      :has-category-filter="hasCategoryFilter"
      type="income"
      @update:sort-by="sortBy = $event"
      @update:sort-field="sortField = $event"
      @update:sort-direction="sortDirection = $event"
      @toggle-filter="toggleFilter"
      @toggle-category-filter="toggleCategoryFilter"
      @clear-filters="clearFilters"
    />

    <div v-if="filteredIncomes.length" class="list">
      <div v-for="item in filteredIncomes" :key="item.id" class="list-item">
        <div class="list-item-main">
          <strong>{{ item.description }}</strong>
          <span class="amount">{{ formatCurrency(item.amount) }}</span>
        </div>
        <div class="list-item-meta">
          <span class="badge">{{ item.type === 'recurring' ? item.frequency : 'one-time' }}</span>
          <span class="badge cat-badge">{{ item.category ?? 'Other' }}</span>
          <span v-if="item.type === 'recurring' && item.date" class="meta">📅 {{ item.date }}</span>
          <span v-if="item.type === 'adhoc'" class="meta">📅 {{ item.date }}</span>
          <span v-if="item.type === 'recurring' && item.notes" class="meta">📝 {{ item.notes }}</span>
        </div>
        <div class="list-item-actions">
          <RouterLink :to="`/income/${item.id}/edit`" class="btn-edit">Edit</RouterLink>
          <button class="btn-delete" @click="deleteIncome(item.id)">Remove</button>
        </div>
      </div>
    </div>
    <p v-else-if="store.incomes.length && searchQuery" class="empty">
      No income matches "{{ searchQuery }}".
    </p>
    <p v-else-if="store.incomes.length" class="empty">No income matches the current filter.</p>
    <p v-else class="empty">No income entries yet.</p>
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
.amount { font-weight: 700; color: var(--color-income); }
.badge {
  font-size: 0.75rem; background: var(--color-income-bg); color: var(--color-income); padding: 0.15rem 0.5rem;
  border-radius: 4px; text-transform: capitalize;
}
.meta { font-size: 0.8rem; color: var(--color-text-muted); }
.cat-badge { background: var(--color-cat-bg); color: var(--color-cat-text); }
.empty { color: var(--color-text-muted); font-style: italic; }
</style>


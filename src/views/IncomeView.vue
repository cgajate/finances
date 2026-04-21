<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useFinancesStore } from '@/stores/finances'
import { useCurrencyInput } from '@/composables/useCurrencyInput'
import { useSortFilter } from '@/composables/useSortFilter'
import { useSnackbar } from '@/composables/useSnackbar'
import { useCategoriesStore } from '@/stores/categories'
import FilterSortBar from '@/components/FilterSortBar.vue'
import type { Frequency } from '@/types/finance'
import type { IncomeCategory } from '@/types/finance'

const store = useFinancesStore()
const snackbar = useSnackbar()
const categoriesStore = useCategoriesStore()
const { activeIncomeCategories } = storeToRefs(categoriesStore)

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

const tab = ref<'recurring' | 'adhoc'>('recurring')

// Sort & filter
const { sortBy, activeFilters, filtered: sortedIncomes, toggleFilter, clearFilters, hasFilter } = useSortFilter(() => store.incomes)

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

// Recurring form
const rAmount = ref<number | null>(null)
const rCurrency = useCurrencyInput(rAmount)
const rFrequency = ref<Frequency>('monthly')
const rDescription = ref('')
const rNotes = ref('')
const rDate = ref('')
const rCategory = ref<IncomeCategory>('Other')

// Adhoc form
const aAmount = ref<number | null>(null)
const aCurrency = useCurrencyInput(aAmount)
const aDescription = ref('')
const aDate = ref('')
const aCategory = ref<IncomeCategory>('Other')

function addRecurring() {
  if (!rAmount.value || !rDescription.value) return
  if (rFrequency.value === 'yearly' && !rDate.value) return
  try {
    store.addRecurringIncome({
      amount: rAmount.value,
      frequency: rFrequency.value,
      description: rDescription.value,
      notes: rNotes.value,
      date: rDate.value || null,
      category: rCategory.value,
    })
    snackbar.show(`Added recurring income "${rDescription.value}"`, { duration: 8000 })
    rCurrency.reset()
    rDescription.value = ''
    rNotes.value = ''
    rDate.value = ''
    rFrequency.value = 'monthly'
    rCategory.value = 'Other'
  } catch {
    snackbar.show('Failed to add recurring income. Please try again.', { duration: 8000 })
  }
}

function addAdhoc() {
  if (!aAmount.value || !aDescription.value || !aDate.value) return
  try {
    store.addAdhocIncome({
      amount: aAmount.value,
      description: aDescription.value,
      date: aDate.value,
      category: aCategory.value,
    })
    snackbar.show(`Added income "${aDescription.value}"`, { duration: 8000 })
    aCurrency.reset()
    aDescription.value = ''
    aDate.value = ''
    aCategory.value = 'Other'
  } catch {
    snackbar.show('Failed to add income. Please try again.', { duration: 8000 })
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

const frequencies: { value: Frequency; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'bi-weekly', label: 'Bi-Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
]
</script>

<template>
  <div class="page">
    <h1>Income</h1>

    <div class="tabs">
      <button :class="{ active: tab === 'recurring' }" @click="tab = 'recurring'">
        Recurring
      </button>
      <button :class="{ active: tab === 'adhoc' }" @click="tab = 'adhoc'">Ad-hoc</button>
    </div>

    <!-- Recurring Income Form -->
    <form v-if="tab === 'recurring'" class="form" @submit.prevent="addRecurring">
      <div class="field">
        <label>Description *</label>
        <input v-model="rDescription" type="text" placeholder="e.g. Salary" required />
      </div>
      <div class="field">
        <label>Amount *</label>
        <input
          type="text"
          inputmode="decimal"
          placeholder="$0.00"
          :value="rCurrency.display.value"
          @input="rCurrency.onInput"
          @blur="rCurrency.onBlur"
          @focus="rCurrency.onFocus"
          required
        />
      </div>
      <div class="field">
        <label>Frequency *</label>
        <select v-model="rFrequency">
          <option v-for="f in frequencies" :key="f.value" :value="f.value">{{ f.label }}</option>
        </select>
      </div>
      <div class="field">
        <label>Category</label>
        <select v-model="rCategory">
          <option v-for="cat in activeIncomeCategories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
      </div>
      <div class="field">
        <label>{{ rFrequency === 'yearly' ? 'Date *' : 'Date (optional)' }}</label>
        <input v-model="rDate" type="date" :required="rFrequency === 'yearly'" />
      </div>
      <div class="field">
        <label>Notes</label>
        <textarea v-model="rNotes" rows="2" placeholder="Additional details..."></textarea>
      </div>
      <button type="submit" class="btn-submit">Add Recurring Income</button>
    </form>

    <!-- Adhoc Income Form -->
    <form v-if="tab === 'adhoc'" class="form" @submit.prevent="addAdhoc">
      <div class="field">
        <label>Description *</label>
        <input v-model="aDescription" type="text" placeholder="e.g. Freelance gig" required />
      </div>
      <div class="field">
        <label>Amount *</label>
        <input
          type="text"
          inputmode="decimal"
          placeholder="$0.00"
          :value="aCurrency.display.value"
          @input="aCurrency.onInput"
          @blur="aCurrency.onBlur"
          @focus="aCurrency.onFocus"
          required
        />
      </div>
      <div class="field">
        <label>Category</label>
        <select v-model="aCategory">
          <option v-for="cat in activeIncomeCategories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
      </div>
      <div class="field">
        <label>Date *</label>
        <input v-model="aDate" type="date" required />
      </div>
      <button type="submit" class="btn-submit">Add Ad-hoc Income</button>
    </form>

    <!-- Income List -->
    <h2>All Income</h2>

    <div v-if="store.incomes.length" class="search-bar">
      <input
        v-model="searchQuery"
        type="text"
        class="search-input"
        placeholder="🔍 Search income..."
      />
      <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''">✕</button>
    </div>

    <FilterSortBar
      v-if="store.incomes.length"
      :sort-by="sortBy"
      :active-filters="activeFilters"
      :has-filter="hasFilter"
      @update:sort-by="sortBy = $event"
      @toggle-filter="toggleFilter"
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
    <p v-else-if="store.incomes.length && searchQuery" class="empty">No income matches "{{ searchQuery }}".</p>
    <p v-else-if="store.incomes.length" class="empty">No income matches the current filter.</p>
    <p v-else class="empty">No income entries yet.</p>
  </div>
</template>

<style scoped>
.page { max-width: 600px; margin: 0 auto; }
h1 { margin-bottom: 1rem; }
h2 { margin-top: 2rem; margin-bottom: 0.75rem; font-size: 1.1rem; }

.tabs { display: flex; gap: 0; margin-bottom: 1.5rem; }
.tabs button {
  flex: 1; padding: 0.6rem; border: 2px solid var(--color-primary); background: var(--color-surface); color: var(--color-primary);
  font-weight: 600; cursor: pointer; font-size: 0.95rem;
}
.tabs button:first-child { border-radius: 8px 0 0 8px; }
.tabs button:last-child { border-radius: 0 8px 8px 0; }
.tabs button.active { background: var(--color-primary); color: var(--color-header-text); }

.form { display: flex; flex-direction: column; gap: 1rem; }
.field { display: flex; flex-direction: column; gap: 0.25rem; }
.field label { font-size: 0.85rem; font-weight: 600; color: var(--color-text-secondary); }
.field input, .field select, .field textarea {
  padding: 0.6rem; border: 1px solid var(--color-input-border); border-radius: 8px; font-size: 1rem;
  background: var(--color-input-bg); color: var(--color-input-text);
}
.field textarea { resize: vertical; }

.btn-submit {
  padding: 0.75rem; background: var(--color-income); color: white; border: none; border-radius: 8px;
  font-size: 1rem; font-weight: 600; cursor: pointer;
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
.btn-edit {
  padding: 0.3rem 0.75rem; background: var(--color-primary); color: white;
  border: none; border-radius: 6px; font-size: 0.8rem; cursor: pointer;
  text-decoration: none; display: inline-block;
}
.btn-delete {
  padding: 0.3rem 0.75rem; background: var(--color-btn-delete); color: white;
  border: none; border-radius: 6px; font-size: 0.8rem; cursor: pointer;
}
.empty { color: var(--color-text-muted); font-style: italic; }

.search-bar {
  position: relative;
  margin-bottom: 0.75rem;
}
.search-input {
  width: 100%;
  padding: 0.6rem 2.2rem 0.6rem 0.75rem;
  border: 1px solid var(--color-input-border);
  border-radius: 8px;
  font-size: 0.95rem;
  box-sizing: border-box;
  background: var(--color-input-bg);
  color: var(--color-input-text);
}
.search-clear {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 1rem;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 0.2rem;
}
.search-clear:hover { color: var(--color-text); }
</style>


<script setup lang="ts">
import { ref } from 'vue'
import { useFinancesStore } from '@/stores/finances'
import { useCurrencyInput } from '@/composables/useCurrencyInput'
import { useSortFilter } from '@/composables/useSortFilter'
import FilterSortBar from '@/components/FilterSortBar.vue'
import type { Frequency } from '@/types/finance'
import { EXPENSE_CATEGORIES, type ExpenseCategory } from '@/types/finance'

const store = useFinancesStore()

const tab = ref<'recurring' | 'adhoc'>('recurring')

// Sort & filter
const { sortBy, activeFilters, filtered: filteredExpenses, toggleFilter, clearFilters, hasFilter } = useSortFilter(store.expenses)

// Recurring form
const rAmount = ref<number | null>(null)
const rCurrency = useCurrencyInput(rAmount)
const rFrequency = ref<Frequency>('monthly')
const rDescription = ref('')
const rNotes = ref('')
const rDueDate = ref('')
const rCategory = ref<ExpenseCategory>('Other')

// Adhoc form
const aAmount = ref<number | null>(null)
const aCurrency = useCurrencyInput(aAmount)
const aDescription = ref('')
const aNotes = ref('')
const aDueDate = ref('')
const aCategory = ref<ExpenseCategory>('Other')

function addRecurring() {
  if (!rAmount.value || !rDescription.value) return
  if (rFrequency.value === 'yearly' && !rDueDate.value) return
  store.addRecurringExpense({
    amount: rAmount.value,
    frequency: rFrequency.value,
    description: rDescription.value,
    notes: rNotes.value,
    dueDate: rDueDate.value || null,
    category: rCategory.value,
  })
  rCurrency.reset()
  rDescription.value = ''
  rNotes.value = ''
  rDueDate.value = ''
  rFrequency.value = 'monthly'
  rCategory.value = 'Other'
}

function addAdhoc() {
  if (!aAmount.value || !aDescription.value) return
  store.addAdhocExpense({
    amount: aAmount.value,
    description: aDescription.value,
    notes: aNotes.value,
    dueDate: aDueDate.value || null,
    category: aCategory.value,
  })
  aCurrency.reset()
  aDescription.value = ''
  aNotes.value = ''
  aDueDate.value = ''
  aCategory.value = 'Other'
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
    <h1>Expenses</h1>

    <div class="tabs">
      <button :class="{ active: tab === 'recurring' }" @click="tab = 'recurring'">
        Recurring
      </button>
      <button :class="{ active: tab === 'adhoc' }" @click="tab = 'adhoc'">Ad-hoc</button>
    </div>

    <!-- Recurring Expense Form -->
    <form v-if="tab === 'recurring'" class="form" @submit.prevent="addRecurring">
      <div class="field">
        <label>Description *</label>
        <input v-model="rDescription" type="text" placeholder="e.g. Rent" required />
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
          <option v-for="cat in EXPENSE_CATEGORIES" :key="cat" :value="cat">{{ cat }}</option>
        </select>
      </div>
      <div class="field">
        <label>{{ rFrequency === 'yearly' ? 'Due Date *' : 'Due Date (optional)' }}</label>
        <input v-model="rDueDate" type="date" :required="rFrequency === 'yearly'" />
      </div>
      <div class="field">
        <label>Notes</label>
        <textarea v-model="rNotes" rows="2" placeholder="Additional details..."></textarea>
      </div>
      <button type="submit" class="btn-submit">Add Recurring Expense</button>
    </form>

    <!-- Adhoc Expense Form -->
    <form v-if="tab === 'adhoc'" class="form" @submit.prevent="addAdhoc">
      <div class="field">
        <label>Description *</label>
        <input v-model="aDescription" type="text" placeholder="e.g. Car repair" required />
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
          <option v-for="cat in EXPENSE_CATEGORIES" :key="cat" :value="cat">{{ cat }}</option>
        </select>
      </div>
      <div class="field">
        <label>Due Date (optional)</label>
        <input v-model="aDueDate" type="date" />
      </div>
      <div class="field">
        <label>Notes</label>
        <textarea v-model="aNotes" rows="2" placeholder="Additional details..."></textarea>
      </div>
      <button type="submit" class="btn-submit">Add Ad-hoc Expense</button>
    </form>

    <!-- Expense List -->
    <h2>All Expenses</h2>

    <FilterSortBar
      v-if="store.expenses.length"
      :sort-by="sortBy"
      :active-filters="activeFilters"
      :has-filter="hasFilter"
      @update:sort-by="sortBy = $event"
      @toggle-filter="toggleFilter"
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
          <span v-if="item.dueDate" class="meta">📅 Due: {{ item.dueDate }}</span>
          <span v-if="item.notes" class="meta">📝 {{ item.notes }}</span>
        </div>
        <div class="list-item-actions">
          <RouterLink :to="`/expenses/${item.id}/edit`" class="btn-edit">Edit</RouterLink>
          <button class="btn-delete" @click="store.removeExpense(item.id)">Remove</button>
        </div>
      </div>
    </div>
    <p v-else-if="store.expenses.length" class="empty">No expenses match the current filter.</p>
    <p v-else class="empty">No expense entries yet.</p>
  </div>
</template>

<style scoped>
.page { max-width: 600px; margin: 0 auto; }
h1 { margin-bottom: 1rem; }
h2 { margin-top: 2rem; margin-bottom: 0.75rem; font-size: 1.1rem; }


.tabs { display: flex; gap: 0; margin-bottom: 1.5rem; }
.tabs button {
  flex: 1; padding: 0.6rem; border: 2px solid #c62828; background: white; color: #c62828;
  font-weight: 600; cursor: pointer; font-size: 0.95rem;
}
.tabs button:first-child { border-radius: 8px 0 0 8px; }
.tabs button:last-child { border-radius: 0 8px 8px 0; }
.tabs button.active { background: #c62828; color: white; }

.form { display: flex; flex-direction: column; gap: 1rem; }
.field { display: flex; flex-direction: column; gap: 0.25rem; }
.field label { font-size: 0.85rem; font-weight: 600; color: #555; }
.field input, .field select, .field textarea {
  padding: 0.6rem; border: 1px solid #ccc; border-radius: 8px; font-size: 1rem;
}
.field textarea { resize: vertical; }

.btn-submit {
  padding: 0.75rem; background: #c62828; color: white; border: none; border-radius: 8px;
  font-size: 1rem; font-weight: 600; cursor: pointer;
}

.list { display: flex; flex-direction: column; gap: 0.5rem; }
.list-item {
  padding: 0.75rem; border: 1px solid #e0e0e0; border-radius: 8px; display: flex;
  flex-direction: column; gap: 0.4rem;
}
.list-item-main { display: flex; justify-content: space-between; align-items: center; }
.list-item-meta { display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center; }
.list-item-actions { display: flex; gap: 0.5rem; justify-content: flex-end; }
.amount { font-weight: 700; color: #c62828; }
.badge {
  font-size: 0.75rem; background: #fce4ec; color: #c62828; padding: 0.15rem 0.5rem;
  border-radius: 4px; text-transform: capitalize;
}
.meta { font-size: 0.8rem; color: #777; }
.cat-badge { background: #e3f2fd; color: #1565c0; }
.btn-edit {
  padding: 0.3rem 0.75rem; background: #1976d2; color: white;
  border: none; border-radius: 6px; font-size: 0.8rem; cursor: pointer;
  text-decoration: none; display: inline-block;
}
.btn-delete {
  padding: 0.3rem 0.75rem; background: #ef5350; color: white;
  border: none; border-radius: 6px; font-size: 0.8rem; cursor: pointer;
}
.empty { color: #999; font-style: italic; }
</style>


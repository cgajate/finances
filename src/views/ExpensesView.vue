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
import type { ExpenseCategory } from '@/types/finance'

const store = useFinancesStore()
const snackbar = useSnackbar()
const categoriesStore = useCategoriesStore()
const { activeExpenseCategories } = storeToRefs(categoriesStore)

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

const tab = ref<'recurring' | 'adhoc'>('recurring')

// Sort & filter
const { sortBy, activeFilters, filtered: sortedExpenses, toggleFilter, clearFilters, hasFilter } = useSortFilter(() => store.expenses)

// Search
const searchQuery = ref('')
const filteredExpenses = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return sortedExpenses.value
  return sortedExpenses.value.filter((item) => {
    const freq = item.type === 'recurring' ? item.frequency : 'one-time'
    return [item.description, String(item.amount), item.category, item.type, item.notes, freq, item.dueDate, item.assignedTo]
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
const rDueDate = ref('')
const rCategory = ref<ExpenseCategory>('Other')
const rAssignedTo = ref('')

// Adhoc form
const aAmount = ref<number | null>(null)
const aCurrency = useCurrencyInput(aAmount)
const aDescription = ref('')
const aNotes = ref('')
const aDueDate = ref('')
const aCategory = ref<ExpenseCategory>('Other')
const aAssignedTo = ref('')

function addRecurring() {
  if (!rAmount.value || !rDescription.value) return
  if (rFrequency.value === 'yearly' && !rDueDate.value) return
  try {
    store.addRecurringExpense({
      amount: rAmount.value,
      frequency: rFrequency.value,
      description: rDescription.value,
      notes: rNotes.value,
      dueDate: rDueDate.value || null,
      category: rCategory.value,
      assignedTo: rAssignedTo.value,
    })
    snackbar.show(`Added recurring expense "${rDescription.value}"`, { duration: 8000 })
    rCurrency.reset()
    rDescription.value = ''
    rNotes.value = ''
    rDueDate.value = ''
    rFrequency.value = 'monthly'
    rCategory.value = 'Other'
    rAssignedTo.value = ''
  } catch {
    snackbar.show('Failed to add recurring expense. Please try again.', { duration: 8000 })
  }
}

function addAdhoc() {
  if (!aAmount.value || !aDescription.value) return
  try {
    store.addAdhocExpense({
      amount: aAmount.value,
      description: aDescription.value,
      notes: aNotes.value,
      dueDate: aDueDate.value || null,
      category: aCategory.value,
      assignedTo: aAssignedTo.value,
    })
    snackbar.show(`Added expense "${aDescription.value}"`, { duration: 8000 })
    aCurrency.reset()
    aDescription.value = ''
    aNotes.value = ''
    aDueDate.value = ''
    aCategory.value = 'Other'
    aAssignedTo.value = ''
  } catch {
    snackbar.show('Failed to add expense. Please try again.', { duration: 8000 })
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
          <option v-for="cat in activeExpenseCategories" :key="cat" :value="cat">{{ cat }}</option>
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
      <div class="field">
        <label>Assigned To</label>
        <input v-model="rAssignedTo" type="text" placeholder="e.g. Mom, Dad" list="family-members" />
        <datalist id="family-members">
          <option v-for="m in store.familyMembers" :key="m" :value="m" />
        </datalist>
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
          <option v-for="cat in activeExpenseCategories" :key="cat" :value="cat">{{ cat }}</option>
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
      <div class="field">
        <label>Assigned To</label>
        <input v-model="aAssignedTo" type="text" placeholder="e.g. Mom, Dad" list="family-members" />
      </div>
      <button type="submit" class="btn-submit">Add Ad-hoc Expense</button>
    </form>

    <!-- Expense List -->
    <h2>All Expenses</h2>

    <div v-if="store.expenses.length" class="search-bar">
      <input
        v-model="searchQuery"
        type="text"
        class="search-input"
        placeholder="🔍 Search expenses..."
      />
      <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''">✕</button>
    </div>

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
          <span v-if="item.assignedTo" class="badge assigned-badge">👤 {{ item.assignedTo }}</span>
          <span v-if="item.dueDate" class="meta">📅 Due: {{ item.dueDate }}</span>
          <span v-if="item.notes" class="meta">📝 {{ item.notes }}</span>
        </div>
        <div class="list-item-actions">
          <RouterLink :to="`/expenses/${item.id}/edit`" class="btn-edit">Edit</RouterLink>
          <button class="btn-delete" @click="deleteExpense(item.id)">Remove</button>
        </div>
      </div>
    </div>
    <p v-else-if="store.expenses.length && searchQuery" class="empty">No expenses match "{{ searchQuery }}".</p>
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
  flex: 1; padding: 0.6rem; border: 2px solid var(--color-expense); background: var(--color-surface); color: var(--color-expense);
  font-weight: 600; cursor: pointer; font-size: 0.95rem;
}
.tabs button:first-child { border-radius: 8px 0 0 8px; }
.tabs button:last-child { border-radius: 0 8px 8px 0; }
.tabs button.active { background: var(--color-expense); color: white; }

.form { display: flex; flex-direction: column; gap: 1rem; }
.field { display: flex; flex-direction: column; gap: 0.25rem; }
.field label { font-size: 0.85rem; font-weight: 600; color: var(--color-text-secondary); }
.field input, .field select, .field textarea {
  padding: 0.6rem; border: 1px solid var(--color-input-border); border-radius: 8px; font-size: 1rem;
  background: var(--color-input-bg); color: var(--color-input-text);
}
.field textarea { resize: vertical; }

.btn-submit {
  padding: 0.75rem; background: var(--color-expense); color: white; border: none; border-radius: 8px;
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
.amount { font-weight: 700; color: var(--color-expense); }
.badge {
  font-size: 0.75rem; background: var(--color-expense-bg); color: var(--color-expense); padding: 0.15rem 0.5rem;
  border-radius: 4px; text-transform: capitalize;
}
.meta { font-size: 0.8rem; color: var(--color-text-muted); }
.cat-badge { background: var(--color-cat-bg); color: var(--color-cat-text); }
.assigned-badge { background: var(--color-assigned-bg); color: var(--color-assigned-text); }
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


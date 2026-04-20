<script setup lang="ts">
import { ref } from 'vue'
import { useFinancesStore } from '@/stores/finances'
import { useCurrencyInput } from '@/composables/useCurrencyInput'
import { useSortFilter } from '@/composables/useSortFilter'
import FilterSortBar from '@/components/FilterSortBar.vue'
import type { Frequency } from '@/types/finance'

const store = useFinancesStore()

const tab = ref<'recurring' | 'adhoc'>('recurring')

// Sort & filter
const { sortBy, activeFilters, filtered: filteredIncomes, toggleFilter, clearFilters, hasFilter } = useSortFilter(store.incomes)

// Recurring form
const rAmount = ref<number | null>(null)
const rCurrency = useCurrencyInput(rAmount)
const rFrequency = ref<Frequency>('monthly')
const rDescription = ref('')
const rNotes = ref('')
const rDate = ref('')

// Adhoc form
const aAmount = ref<number | null>(null)
const aCurrency = useCurrencyInput(aAmount)
const aDescription = ref('')
const aDate = ref('')

function addRecurring() {
  if (!rAmount.value || !rDescription.value) return
  if (rFrequency.value === 'yearly' && !rDate.value) return
  store.addRecurringIncome({
    amount: rAmount.value,
    frequency: rFrequency.value,
    description: rDescription.value,
    notes: rNotes.value,
    date: rDate.value || null,
  })
  rCurrency.reset()
  rDescription.value = ''
  rNotes.value = ''
  rDate.value = ''
  rFrequency.value = 'monthly'
}

function addAdhoc() {
  if (!aAmount.value || !aDescription.value || !aDate.value) return
  store.addAdhocIncome({
    amount: aAmount.value,
    description: aDescription.value,
    date: aDate.value,
  })
  aCurrency.reset()
  aDescription.value = ''
  aDate.value = ''
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
        <label>Date *</label>
        <input v-model="aDate" type="date" required />
      </div>
      <button type="submit" class="btn-submit">Add Ad-hoc Income</button>
    </form>

    <!-- Income List -->
    <h2>All Income</h2>

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
          <span v-if="item.type === 'recurring' && item.date" class="meta">📅 {{ item.date }}</span>
          <span v-if="item.type === 'adhoc'" class="meta">📅 {{ item.date }}</span>
          <span v-if="item.type === 'recurring' && item.notes" class="meta">📝 {{ item.notes }}</span>
        </div>
        <div class="list-item-actions">
          <RouterLink :to="`/income/${item.id}/edit`" class="btn-edit">Edit</RouterLink>
          <button class="btn-delete" @click="store.removeIncome(item.id)">Remove</button>
        </div>
      </div>
    </div>
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
  flex: 1; padding: 0.6rem; border: 2px solid #1976d2; background: white; color: #1976d2;
  font-weight: 600; cursor: pointer; font-size: 0.95rem;
}
.tabs button:first-child { border-radius: 8px 0 0 8px; }
.tabs button:last-child { border-radius: 0 8px 8px 0; }
.tabs button.active { background: #1976d2; color: white; }

.form { display: flex; flex-direction: column; gap: 1rem; }
.field { display: flex; flex-direction: column; gap: 0.25rem; }
.field label { font-size: 0.85rem; font-weight: 600; color: #555; }
.field input, .field select, .field textarea {
  padding: 0.6rem; border: 1px solid #ccc; border-radius: 8px; font-size: 1rem;
}
.field textarea { resize: vertical; }

.btn-submit {
  padding: 0.75rem; background: #2e7d32; color: white; border: none; border-radius: 8px;
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
.amount { font-weight: 700; color: #2e7d32; }
.badge {
  font-size: 0.75rem; background: #e8f5e9; color: #2e7d32; padding: 0.15rem 0.5rem;
  border-radius: 4px; text-transform: capitalize;
}
.meta { font-size: 0.8rem; color: #777; }
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


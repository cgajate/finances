<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useFinancesStore } from '@/stores/finances'
import { useCurrencyInput } from '@/composables/useCurrencyInput'
import { useSnackbar } from '@/composables/useSnackbar'
import { useCategoriesStore } from '@/stores/categories'
import type { Frequency, ExpenseCategory } from '@/types/finance'

const router = useRouter()
const store = useFinancesStore()
const snackbar = useSnackbar()
const categoriesStore = useCategoriesStore()
const { activeExpenseCategories } = storeToRefs(categoriesStore)

const tab = ref<'recurring' | 'adhoc'>('recurring')

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
    <button class="btn-back" @click="router.push('/expenses')">
      <font-awesome-icon :icon="['fas', 'arrow-left']" /> Back
    </button>
    <h1>Add Expense</h1>

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
      <button type="submit" class="btn-submit btn-submit--expense">Add Recurring Expense</button>
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
      <button type="submit" class="btn-submit btn-submit--expense">Add Ad-hoc Expense</button>
    </form>
  </div>
</template>

<style scoped>
.page { max-width: 600px; margin: 0 auto; }
h1 { margin-bottom: 1rem; }

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
</style>


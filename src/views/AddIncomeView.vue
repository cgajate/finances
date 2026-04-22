<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useFinancesStore } from '@/stores/finances'
import { useCurrencyInput } from '@/composables/useCurrencyInput'
import { useSnackbar } from '@/composables/useSnackbar'
import { useCategoriesStore } from '@/stores/categories'
import type { Frequency, IncomeCategory } from '@/types/finance'
import { FREQUENCY_OPTIONS } from '@/types/finance'
import TabBar from '@/components/TabBar.vue'

const router = useRouter()
const store = useFinancesStore()
const snackbar = useSnackbar()
const categoriesStore = useCategoriesStore()
const { activeIncomeCategories } = storeToRefs(categoriesStore)

const tab = ref<'recurring' | 'adhoc'>('recurring')
const formTabs = [
  { value: 'recurring', label: 'Recurring' },
  { value: 'adhoc', label: 'Ad-hoc' },
]

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

const frequencies = FREQUENCY_OPTIONS
</script>

<template>
  <div>
    <div class="page-header">
      <button class="btn-back" @click="router.push('/finances?tab=income')">
        <font-awesome-icon :icon="['fas', 'arrow-left']" />
      </button>
      <h2>Add Income</h2>
    </div>

    <TabBar :tabs="formTabs" v-model="tab" />

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
  </div>
</template>

<style scoped>
h2 { margin: 0; }

.page-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}


.form { display: flex; flex-direction: column; gap: 1rem; }
.field { display: flex; flex-direction: column; gap: 0.25rem; }
.field label { font-size: 0.85rem; font-weight: 600; color: var(--color-text-secondary); }
.field input, .field select, .field textarea {
  padding: 0.6rem; border: 1px solid var(--color-input-border); border-radius: 8px; font-size: 1rem;
  background: var(--color-input-bg); color: var(--color-input-text);
}
.field textarea { resize: vertical; }
</style>


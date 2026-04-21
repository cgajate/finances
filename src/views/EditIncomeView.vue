<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFinancesStore } from '@/stores/finances'
import { useCurrencyInput } from '@/composables/useCurrencyInput'
import { useSnackbar } from '@/composables/useSnackbar'
import type { Frequency } from '@/types/finance'
import { INCOME_CATEGORIES, type IncomeCategory } from '@/types/finance'

const route = useRoute()
const router = useRouter()
const store = useFinancesStore()
const snackbar = useSnackbar()

const id = route.params.id as string
const itemType = ref<'recurring' | 'adhoc'>('recurring')
const description = ref('')
const amount = ref<number | null>(null)
const currency = useCurrencyInput(amount)
const frequency = ref<Frequency>('monthly')
const date = ref('')
const notes = ref('')
const category = ref<IncomeCategory>('Other')
const notFound = ref(false)

onMounted(() => {
  const item = store.getIncomeById(id)
  if (!item) {
    notFound.value = true
    return
  }
  itemType.value = item.type
  description.value = item.description
  amount.value = item.amount
  currency.setFromValue(item.amount)
  category.value = item.category ?? 'Other'
  if (item.type === 'recurring') {
    frequency.value = item.frequency
    date.value = item.date ?? ''
    notes.value = item.notes
  } else {
    date.value = item.date
  }
})

function save() {
  if (!description.value || !amount.value) return
  if (frequency.value === 'yearly' && !date.value) return
  if (itemType.value === 'recurring') {
    store.updateIncome(id, {
      description: description.value,
      amount: amount.value,
      frequency: frequency.value,
      date: date.value || null,
      notes: notes.value,
      category: category.value,
    })
  } else {
    store.updateIncome(id, {
      description: description.value,
      amount: amount.value,
      date: date.value,
      category: category.value,
    })
  }
  router.push('/income')
}

function cancel() {
  router.push('/income')
}

function remove() {
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
  router.push('/income')
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
    <h1>Edit Income</h1>

    <div v-if="notFound" class="not-found">
      <p>Income entry not found.</p>
      <button class="btn-back" @click="router.push('/income')">← Back to Income</button>
    </div>

    <form v-else class="form" @submit.prevent="save">
      <div class="field">
        <label>Description *</label>
        <input v-model="description" type="text" required />
      </div>
      <div class="field">
        <label>Amount *</label>
        <input
          type="text"
          inputmode="decimal"
          placeholder="$0.00"
          :value="currency.display.value"
          @input="currency.onInput"
          @blur="currency.onBlur"
          @focus="currency.onFocus"
          required
        />
      </div>
      <div v-if="itemType === 'recurring'" class="field">
        <label>Frequency</label>
        <select v-model="frequency">
          <option v-for="f in frequencies" :key="f.value" :value="f.value">{{ f.label }}</option>
        </select>
      </div>
      <div class="field">
        <label>Category</label>
        <select v-model="category">
          <option v-for="cat in INCOME_CATEGORIES" :key="cat" :value="cat">{{ cat }}</option>
        </select>
      </div>
      <div class="field">
        <label>{{ itemType === 'adhoc' || frequency === 'yearly' ? 'Date *' : 'Date (optional)' }}</label>
        <input v-model="date" type="date" :required="itemType === 'adhoc' || frequency === 'yearly'" />
      </div>
      <div v-if="itemType === 'recurring'" class="field">
        <label>Notes</label>
        <textarea v-model="notes" rows="3" placeholder="Additional details..."></textarea>
      </div>

      <div class="actions">
        <button type="submit" class="btn-save">Save Changes</button>
        <button type="button" class="btn-cancel" @click="cancel">Cancel</button>
      </div>

      <button type="button" class="btn-delete" @click="remove">Delete This Income</button>
    </form>
  </div>
</template>

<style scoped>
.page { max-width: 600px; margin: 0 auto; }
h1 { margin-bottom: 1.5rem; }

.form { display: flex; flex-direction: column; gap: 1rem; }
.field { display: flex; flex-direction: column; gap: 0.25rem; }
.field label { font-size: 0.85rem; font-weight: 600; color: var(--color-text-secondary); }
.field input, .field select, .field textarea {
  padding: 0.6rem; border: 1px solid var(--color-input-border); border-radius: 8px; font-size: 1rem;
  background: var(--color-input-bg); color: var(--color-input-text);
}
.field textarea { resize: vertical; }

.actions { display: flex; gap: 0.75rem; margin-top: 0.5rem; }
.btn-save {
  flex: 1; padding: 0.75rem; background: var(--color-income); color: white; border: none; border-radius: 8px;
  font-size: 1rem; font-weight: 600; cursor: pointer;
}
.btn-cancel {
  flex: 1; padding: 0.75rem; background: var(--color-text-muted); color: white; border: none; border-radius: 8px;
  font-size: 1rem; font-weight: 600; cursor: pointer;
}
.btn-delete {
  margin-top: 1.5rem; padding: 0.6rem; background: none; color: var(--color-btn-delete); border: 1px solid var(--color-btn-delete);
  border-radius: 8px; font-size: 0.9rem; cursor: pointer; width: 100%;
}
.btn-delete:hover { background: var(--color-expense-bg); }
.btn-back {
  padding: 0.5rem 1rem; background: var(--color-primary); color: white; border: none; border-radius: 8px;
  font-size: 0.9rem; cursor: pointer;
}
.not-found { text-align: center; padding: 2rem 0; }
.not-found p { margin-bottom: 1rem; color: var(--color-text-muted); }
</style>

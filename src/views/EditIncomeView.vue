<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useFinancesStore } from '@/stores/finances'
import { useCurrencyInput } from '@/composables/useCurrencyInput'
import { useSnackbar } from '@/composables/useSnackbar'
import { useCategoriesStore } from '@/stores/categories'
import type { Frequency } from '@/types/finance'
import type { IncomeCategory } from '@/types/finance'
import { FREQUENCY_OPTIONS } from '@/types/finance'

const route = useRoute()
const router = useRouter()
const store = useFinancesStore()
const snackbar = useSnackbar()
const categoriesStore = useCategoriesStore()
const { activeIncomeCategories } = storeToRefs(categoriesStore)

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
  router.push('/finances?tab=income')
}

function cancel() {
  router.push('/finances?tab=income')
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
  router.push('/finances?tab=income')
}

const frequencies = FREQUENCY_OPTIONS
</script>

<template>
  <div>
    <div class="page-header">
      <button class="btn-back" @click="router.push('/finances?tab=income')">
        <font-awesome-icon :icon="['fas', 'arrow-left']" />
      </button>
      <h2>Edit Income</h2>
    </div>

    <div v-if="notFound" class="not-found">
      <p>Income entry not found.</p>
      <button class="btn-back" @click="router.push('/finances?tab=income')">← Back to Income</button>
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
          <option v-for="cat in categoriesStore.activeIncomeCategories" :key="cat" :value="cat">{{ cat }}</option>
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

      <button type="button" class="btn-delete--outline" @click="remove">Delete This Income</button>
    </form>
  </div>
</template>

<style scoped>
/* View-specific styles only — form, layout, page-header, actions, not-found are global */
</style>

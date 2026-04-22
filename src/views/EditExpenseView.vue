<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useFinancesStore } from '@/stores/finances'
import { useSnackbar } from '@/composables/useSnackbar'
import { useCategoriesStore } from '@/stores/categories'
import type { Frequency } from '@/types/finance'
import type { ExpenseCategory } from '@/types/finance'
import { FREQUENCY_OPTIONS } from '@/types/finance'
import PageHeader from '@/components/PageHeader.vue'
import CurrencyInput from '@/components/CurrencyInput.vue'

const route = useRoute()
const router = useRouter()
const store = useFinancesStore()
const snackbar = useSnackbar()
const categoriesStore = useCategoriesStore()
const { activeExpenseCategories } = storeToRefs(categoriesStore)

const id = route.params.id as string
const itemType = ref<'recurring' | 'adhoc'>('recurring')
const description = ref('')
const amount = ref<number | null>(null)
const frequency = ref<Frequency>('monthly')
const dueDate = ref('')
const notes = ref('')
const category = ref<ExpenseCategory>('Other')
const assignedTo = ref('')
const notFound = ref(false)

onMounted(() => {
  const item = store.getExpenseById(id)
  if (!item) {
    notFound.value = true
    return
  }
  itemType.value = item.type
  description.value = item.description
  amount.value = item.amount
  notes.value = item.notes
  category.value = item.category ?? 'Other'
  assignedTo.value = item.assignedTo ?? ''
  dueDate.value = item.dueDate ?? ''
  if (item.type === 'recurring') {
    frequency.value = item.frequency
  }
})

function save() {
  if (!description.value || !amount.value) return
  if (frequency.value === 'yearly' && !dueDate.value) return
  if (itemType.value === 'recurring') {
    store.updateExpense(id, {
      description: description.value,
      amount: amount.value,
      frequency: frequency.value,
      dueDate: dueDate.value || null,
      notes: notes.value,
      category: category.value,
      assignedTo: assignedTo.value,
    })
  } else {
    store.updateExpense(id, {
      description: description.value,
      amount: amount.value,
      dueDate: dueDate.value || null,
      notes: notes.value,
      category: category.value,
      assignedTo: assignedTo.value,
    })
  }
  router.push('/finances?tab=expenses')
}

function cancel() {
  router.push('/finances?tab=expenses')
}

function remove() {
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
  router.push('/finances?tab=expenses')
}

const frequencies = FREQUENCY_OPTIONS
</script>

<template>
  <div>
    <PageHeader title="Edit Expense" back-to="/finances?tab=expenses" />

    <div v-if="notFound" class="not-found">
      <p>Expense entry not found.</p>
      <button class="btn-back" @click="router.push('/finances?tab=expenses')">← Back to Expenses</button>
    </div>

    <form v-else class="form" @submit.prevent="save">
      <div class="field">
        <label>Description *</label>
        <input v-model="description" type="text" required />
      </div>
      <div class="field">
        <label>Amount *</label>
        <CurrencyInput v-model="amount" :required="true" />
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
          <option v-for="cat in activeExpenseCategories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
      </div>
      <div class="field">
        <label>{{ frequency === 'yearly' ? 'Due Date *' : 'Due Date (optional)' }}</label>
        <input v-model="dueDate" type="date" :required="frequency === 'yearly'" />
      </div>
      <div class="field">
        <label>Notes</label>
        <textarea v-model="notes" rows="3" placeholder="Additional details..."></textarea>
      </div>
      <div class="field">
        <label>Assigned To</label>
        <input v-model="assignedTo" type="text" placeholder="e.g. Mom, Dad" list="edit-family-members" />
        <datalist id="edit-family-members">
          <option v-for="m in store.familyMembers" :key="m" :value="m" />
        </datalist>
      </div>

      <div class="actions">
        <button type="submit" class="btn-save">Save Changes</button>
        <button type="button" class="btn-cancel" @click="cancel">Cancel</button>
      </div>

      <button type="button" class="btn-delete--outline" @click="remove">Delete This Expense</button>
    </form>
  </div>
</template>

<style scoped>
/* View-specific styles only — form, layout, page-header, actions, not-found are global */
</style>


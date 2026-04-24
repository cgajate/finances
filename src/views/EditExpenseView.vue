<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useFinancesStore } from '@/stores/finances'
import { useDeleteWithUndo } from '@/composables/useDeleteWithUndo'
import { useCategoriesStore } from '@/stores/categories'
import type { Frequency } from '@/types/finance'
import type { ExpenseCategory, RecurringExpense } from '@/types/finance'
import { FREQUENCY_OPTIONS } from '@/types/finance'
import PageHeader from '@/components/PageHeader.vue'
import CurrencyInput from '@/components/CurrencyInput.vue'
import MonthlyOverrides from '@/components/MonthlyOverrides.vue'

const route = useRoute()
const router = useRouter()
const store = useFinancesStore()
const { deleteExpense } = useDeleteWithUndo()
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

function remove() {
  deleteExpense(id)
  router.push('/finances?tab=expenses')
}

const frequencies = FREQUENCY_OPTIONS

const currentOverrides = computed(() => {
  const item = store.getExpenseById(id)
  if (!item || item.type !== 'recurring') return undefined
  return (item as RecurringExpense).overrides
})
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
        <label for="edit-exp-desc">Description *</label>
        <input id="edit-exp-desc" v-model="description" type="text" required />
      </div>
      <div class="field">
        <label for="edit-exp-amount">Amount *</label>
        <CurrencyInput id="edit-exp-amount" v-model="amount" :required="true" />
      </div>
      <div v-if="itemType === 'recurring'" class="field">
        <label for="edit-exp-freq">Frequency</label>
        <select id="edit-exp-freq" v-model="frequency">
          <option v-for="f in frequencies" :key="f.value" :value="f.value">{{ f.label }}</option>
        </select>
      </div>
      <div class="field">
        <label for="edit-exp-cat">Category</label>
        <select id="edit-exp-cat" v-model="category">
          <option v-for="cat in activeExpenseCategories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
      </div>
      <div class="field">
        <label for="edit-exp-due">{{ frequency === 'yearly' ? 'Due Date *' : 'Due Date (optional)' }}</label>
        <input id="edit-exp-due" v-model="dueDate" type="date" :required="frequency === 'yearly'" />
      </div>
      <div class="field">
        <label for="edit-exp-notes">Notes</label>
        <textarea id="edit-exp-notes" v-model="notes" rows="3" placeholder="Additional details..."></textarea>
      </div>
      <div class="field">
        <label for="edit-exp-assigned">Assigned To</label>
        <input id="edit-exp-assigned" v-model="assignedTo" type="text" placeholder="e.g. Mom, Dad" list="edit-family-members" />
        <datalist id="edit-family-members">
          <option v-for="m in store.familyMembers" :key="m" :value="m" />
        </datalist>
      </div>

      <MonthlyOverrides
        v-if="itemType === 'recurring' && amount"
        :base-amount="amount"
        :overrides="currentOverrides"
        @set-override="(month, amt) => store.setExpenseOverride(id, month, amt)"
        @remove-override="(month) => store.removeExpenseOverride(id, month)"
      />

      <div class="actions">
        <button type="submit" class="btn-save">Save</button>
        <button type="button" class="btn-delete--filled" @click="remove">Remove</button>
      </div>
    </form>
  </div>
</template>

<style scoped>
/* View-specific styles only — form, layout, page-header, actions, not-found are global */
</style>


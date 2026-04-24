<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useFinancesStore } from '@/stores/finances'
import { useApprovalsStore } from '@/stores/approvals'
import { useAuth } from '@/composables/useAuth'
import { useSnackbar } from '@/composables/useSnackbar'
import { useCategoriesStore } from '@/stores/categories'
import type { Frequency, ExpenseCategory } from '@/types/finance'
import { FREQUENCY_OPTIONS } from '@/types/finance'
import TabBar from '@/components/TabBar.vue'
import PageHeader from '@/components/PageHeader.vue'
import CurrencyInput from '@/components/CurrencyInput.vue'

const store = useFinancesStore()
const approvalsStore = useApprovalsStore()
const { userId } = useAuth()
const snackbar = useSnackbar()
const categoriesStore = useCategoriesStore()
const { activeExpenseCategories } = storeToRefs(categoriesStore)

const tab = ref<'recurring' | 'adhoc'>('recurring')
const formTabs = [
  { value: 'recurring', label: 'Recurring' },
  { value: 'adhoc', label: 'Ad-hoc' },
]

// Recurring form
const rAmount = ref<number | null>(null)
const rFrequency = ref<Frequency>('monthly')
const rDescription = ref('')
const rNotes = ref('')
const rDueDate = ref('')
const rCategory = ref<ExpenseCategory>('Other')
const rAssignedTo = ref('')

// Adhoc form
const aAmount = ref<number | null>(null)
const aDescription = ref('')
const aNotes = ref('')
const aDueDate = ref('')
const aCategory = ref<ExpenseCategory>('Other')
const aAssignedTo = ref('')

function addRecurring() {
  if (!rAmount.value || !rDescription.value) return
  if (rFrequency.value === 'yearly' && !rDueDate.value) return
  try {
    const expenseId = store.addRecurringExpense({
      amount: rAmount.value,
      frequency: rFrequency.value,
      description: rDescription.value,
      notes: rNotes.value,
      dueDate: rDueDate.value || null,
      category: rCategory.value,
      assignedTo: rAssignedTo.value,
    })

    if (approvalsStore.requiresApproval(rAmount.value)) {
      approvalsStore.submitForApproval({
        expenseId,
        amount: rAmount.value,
        description: rDescription.value,
        requestedBy: userId.value || 'anonymous',
      })
      store.updateExpenseApprovalStatus(expenseId, 'pending')
      snackbar.show(`Expense "${rDescription.value}" submitted for approval`, { duration: 8000 })
    } else {
      snackbar.show(`Added recurring expense "${rDescription.value}"`, { duration: 8000 })
    }

    rAmount.value = null
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
    const expenseId = store.addAdhocExpense({
      amount: aAmount.value,
      description: aDescription.value,
      notes: aNotes.value,
      dueDate: aDueDate.value || null,
      category: aCategory.value,
      assignedTo: aAssignedTo.value,
    })

    if (approvalsStore.requiresApproval(aAmount.value)) {
      approvalsStore.submitForApproval({
        expenseId,
        amount: aAmount.value,
        description: aDescription.value,
        requestedBy: userId.value || 'anonymous',
      })
      store.updateExpenseApprovalStatus(expenseId, 'pending')
      snackbar.show(`Expense "${aDescription.value}" submitted for approval`, { duration: 8000 })
    } else {
      snackbar.show(`Added expense "${aDescription.value}"`, { duration: 8000 })
    }

    aAmount.value = null
    aDescription.value = ''
    aNotes.value = ''
    aDueDate.value = ''
    aCategory.value = 'Other'
    aAssignedTo.value = ''
  } catch {
    snackbar.show('Failed to add expense. Please try again.', { duration: 8000 })
  }
}

const frequencies = FREQUENCY_OPTIONS
</script>

<template>
  <div>
    <PageHeader title="Add Expense" back-to="/finances?tab=expenses" />

    <TabBar :tabs="formTabs" v-model="tab" color="var(--color-expense)" />

    <!-- Recurring Expense Form -->
    <form v-if="tab === 'recurring'" class="form" @submit.prevent="addRecurring">
      <div class="field">
        <label for="r-exp-desc">Description *</label>
        <input id="r-exp-desc" v-model="rDescription" type="text" placeholder="e.g. Rent" required />
      </div>
      <div class="field">
        <label for="r-exp-amount">Amount *</label>
        <CurrencyInput id="r-exp-amount" v-model="rAmount" :required="true" />
      </div>
      <div class="field">
        <label for="r-exp-freq">Frequency *</label>
        <select id="r-exp-freq" v-model="rFrequency">
          <option v-for="f in frequencies" :key="f.value" :value="f.value">{{ f.label }}</option>
        </select>
      </div>
      <div class="field">
        <label for="r-exp-cat">Category</label>
        <select id="r-exp-cat" v-model="rCategory">
          <option v-for="cat in activeExpenseCategories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
      </div>
      <div class="field">
        <label for="r-exp-due">{{ rFrequency === 'yearly' ? 'Due Date *' : 'Due Date (optional)' }}</label>
        <input id="r-exp-due" v-model="rDueDate" type="date" :required="rFrequency === 'yearly'" />
      </div>
      <div class="field">
        <label for="r-exp-notes">Notes</label>
        <textarea id="r-exp-notes" v-model="rNotes" rows="2" placeholder="Additional details..."></textarea>
      </div>
      <div class="field">
        <label for="r-exp-assigned">Assigned To</label>
        <input id="r-exp-assigned" v-model="rAssignedTo" type="text" placeholder="e.g. Mom, Dad" list="family-members" />
        <datalist id="family-members">
          <option v-for="m in store.familyMembers" :key="m" :value="m" />
        </datalist>
      </div>
      <button type="submit" class="btn-submit btn-submit--expense">Add Recurring Expense</button>
    </form>

    <!-- Adhoc Expense Form -->
    <form v-if="tab === 'adhoc'" class="form" @submit.prevent="addAdhoc">
      <div class="field">
        <label for="a-exp-desc">Description *</label>
        <input id="a-exp-desc" v-model="aDescription" type="text" placeholder="e.g. Car repair" required />
      </div>
      <div class="field">
        <label for="a-exp-amount">Amount *</label>
        <CurrencyInput id="a-exp-amount" v-model="aAmount" :required="true" />
      </div>
      <div class="field">
        <label for="a-exp-cat">Category</label>
        <select id="a-exp-cat" v-model="aCategory">
          <option v-for="cat in activeExpenseCategories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
      </div>
      <div class="field">
        <label for="a-exp-due">Due Date (optional)</label>
        <input id="a-exp-due" v-model="aDueDate" type="date" />
      </div>
      <div class="field">
        <label for="a-exp-notes">Notes</label>
        <textarea id="a-exp-notes" v-model="aNotes" rows="2" placeholder="Additional details..."></textarea>
      </div>
      <div class="field">
        <label for="a-exp-assigned">Assigned To</label>
        <input id="a-exp-assigned" v-model="aAssignedTo" type="text" placeholder="e.g. Mom, Dad" list="family-members" />
      </div>
      <button type="submit" class="btn-submit btn-submit--expense">Add Ad-hoc Expense</button>
    </form>
  </div>
</template>

<style scoped>
/* View-specific styles only — form, layout, and page-header are global */
</style>


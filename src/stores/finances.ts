import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import type { Income, Expense, Frequency, IncomeCategory, ExpenseCategory, RecurringIncome, RecurringExpense } from '@/types/finance'
import { advanceDate, advanceToFuture } from '@/lib/dateUtils'
import { getEffectiveAmount } from '@/lib/overrides'
import { getDb } from '@/lib/firebase'
import { useFirestoreSync } from '@/composables/useFirestoreSync'
import { useActivityFeedStore } from '@/stores/activityFeed'
import { useAuth } from '@/composables/useAuth'
import { generateId } from '@/lib/id'
import { loadFromStorage } from '@/lib/storage'


export const useFinancesStore = defineStore('finances', () => {
  const incomes = ref<Income[]>(loadFromStorage('finances:incomes', []))
  const expenses = ref<Expense[]>(loadFromStorage('finances:expenses', []))
  const familyMembers = ref<string[]>(loadFromStorage('finances:familyMembers', []))

  // Auto-persist to localStorage (offline fallback)
  watch(incomes, (val) => localStorage.setItem('finances:incomes', JSON.stringify(val)), { deep: true })
  watch(expenses, (val) => localStorage.setItem('finances:expenses', JSON.stringify(val)), { deep: true })
  watch(familyMembers, (val) => localStorage.setItem('finances:familyMembers', JSON.stringify(val)), { deep: true })

  // Auto-advance recurring dates past today to their next future occurrence
  function autoAdvanceRecurringDates() {
    let changed = false
    for (const income of incomes.value) {
      if (income.type === 'recurring' && income.date) {
        const advanced = advanceToFuture(income.date, income.frequency)
        if (advanced !== income.date) {
          income.date = advanced
          changed = true
        }
      }
    }
    for (const expense of expenses.value) {
      if (expense.type === 'recurring' && expense.dueDate) {
        const advanced = advanceToFuture(expense.dueDate, expense.frequency)
        if (advanced !== expense.dueDate) {
          expense.dueDate = advanced
          changed = true
        }
      }
    }
    return changed
  }

  autoAdvanceRecurringDates()

  // --- Firestore sync ---
  function enableSync(householdId: string) {
    const db = getDb()
    if (!db) return
    const path = `households/${householdId}`
    useFirestoreSync(db, path, 'incomes', incomes)
    useFirestoreSync(db, path, 'expenses', expenses)
    useFirestoreSync(db, path, 'familyMembers', familyMembers)
  }

  // --- Income actions ---
  function addRecurringIncome(data: {
    amount: number
    frequency: Frequency
    description: string
    notes: string
    date: string | null
    category?: IncomeCategory
  }, userId = 'anonymous') {
    const id = generateId()
    const { displayName, photoURL } = useAuth()
    incomes.value.push({
      id,
      type: 'recurring',
      category: data.category ?? 'Other',
      ...data,
      createdAt: new Date().toISOString(),
      createdBy: displayName.value || userId,
      createdByPhoto: photoURL.value,
    })
    useActivityFeedStore().logActivity(userId, 'add', 'income', id, `Added recurring income "${data.description}"`)
  }

  function addAdhocIncome(data: { amount: number; description: string; date: string; category?: IncomeCategory }, userId = 'anonymous') {
    const id = generateId()
    const { displayName, photoURL } = useAuth()
    incomes.value.push({
      id,
      type: 'adhoc',
      category: data.category ?? 'Other',
      ...data,
      createdAt: new Date().toISOString(),
      createdBy: displayName.value || userId,
      createdByPhoto: photoURL.value,
    })
    useActivityFeedStore().logActivity(userId, 'add', 'income', id, `Added income "${data.description}"`)
  }

  function removeIncome(id: string, userId = 'anonymous') {
    const item = incomes.value.find((i) => i.id === id)
    incomes.value = incomes.value.filter((i) => i.id !== id)
    if (item) {
      useActivityFeedStore().logActivity(userId, 'delete', 'income', id, `Deleted income "${item.description}"`)
    }
  }

  function updateIncome(id: string, data: Record<string, unknown>, userId = 'anonymous') {
    const index = incomes.value.findIndex((i) => i.id === id)
    if (index !== -1) {
      const existing = incomes.value[index]
      if (existing) {
        incomes.value.splice(index, 1, { ...existing, ...data } as Income)
        useActivityFeedStore().logActivity(userId, 'edit', 'income', id, `Edited income "${existing.description}"`)
      }
    }
  }

  function getIncomeById(id: string): Income | undefined {
    return incomes.value.find((i) => i.id === id)
  }

  // --- Expense actions ---
  function addRecurringExpense(data: {
    amount: number
    frequency: Frequency
    description: string
    notes: string
    dueDate: string | null
    category?: ExpenseCategory
    assignedTo?: string
  }, userId = 'anonymous'): string {
    const id = generateId()
    const { displayName, photoURL } = useAuth()
    expenses.value.push({
      id,
      type: 'recurring',
      category: data.category ?? 'Other',
      assignedTo: data.assignedTo ?? '',
      ...data,
      createdAt: new Date().toISOString(),
      createdBy: displayName.value || userId,
      createdByPhoto: photoURL.value,
    })
    if (data.assignedTo) addFamilyMember(data.assignedTo)
    useActivityFeedStore().logActivity(userId, 'add', 'expense', id, `Added recurring expense "${data.description}"`)
    return id
  }

  function addAdhocExpense(data: {
    amount: number
    description: string
    notes: string
    dueDate: string | null
    category?: ExpenseCategory
    assignedTo?: string
  }, userId = 'anonymous'): string {
    const id = generateId()
    const { displayName, photoURL } = useAuth()
    expenses.value.push({
      id,
      type: 'adhoc',
      category: data.category ?? 'Other',
      assignedTo: data.assignedTo ?? '',
      ...data,
      createdAt: new Date().toISOString(),
      createdBy: displayName.value || userId,
      createdByPhoto: photoURL.value,
    })
    if (data.assignedTo) addFamilyMember(data.assignedTo)
    useActivityFeedStore().logActivity(userId, 'add', 'expense', id, `Added expense "${data.description}"`)
    return id
  }

  function removeExpense(id: string, userId = 'anonymous') {
    const item = expenses.value.find((e) => e.id === id)
    expenses.value = expenses.value.filter((e) => e.id !== id)
    if (item) {
      useActivityFeedStore().logActivity(userId, 'delete', 'expense', id, `Deleted expense "${item.description}"`)
    }
  }

  function updateExpense(id: string, data: Record<string, unknown>, userId = 'anonymous') {
    const index = expenses.value.findIndex((e) => e.id === id)
    if (index !== -1) {
      const existing = expenses.value[index]
      if (existing) {
        expenses.value.splice(index, 1, { ...existing, ...data } as Expense)
        useActivityFeedStore().logActivity(userId, 'edit', 'expense', id, `Edited expense "${existing.description}"`)
      }
    }
  }

  function getExpenseById(id: string): Expense | undefined {
    return expenses.value.find((e) => e.id === id)
  }

  // --- Computed ---
  function monthlyEquivalent(amount: number, frequency: Frequency): number {
    switch (frequency) {
      case 'weekly':
        return amount * 52 / 12
      case 'bi-weekly':
        return amount * 26 / 12
      case 'monthly':
        return amount
      case 'quarterly':
        return amount / 3
      case 'yearly':
        return amount / 12
    }
  }

  /** Expenses that count toward financial calculations (excludes pending/rejected) */
  const activeExpenses = computed(() =>
    expenses.value.filter((e) => !e.approvalStatus || e.approvalStatus === 'approved'),
  )

  const totalMonthlyIncome = computed(() => {
    const currentMonth = new Date().toISOString().slice(0, 7)
    return incomes.value.reduce((sum, i) => {
      if (i.type === 'recurring') {
        return sum + monthlyEquivalent(i.amount, i.frequency)
      }
      // Adhoc: only count if its date falls in the current month
      const adhocDate = i.date ?? i.createdAt?.split('T')[0] ?? ''
      if (adhocDate && !adhocDate.startsWith(currentMonth)) return sum
      return sum + i.amount
    }, 0)
  })

  const totalMonthlyExpenses = computed(() => {
    const currentMonth = new Date().toISOString().slice(0, 7)
    return activeExpenses.value.reduce((sum, e) => {
      if (e.type === 'recurring') {
        return sum + monthlyEquivalent(e.amount, e.frequency)
      }
      // Adhoc: only count if its date falls in the current month
      const adhocDate = e.dueDate ?? e.createdAt?.split('T')[0] ?? ''
      if (adhocDate && !adhocDate.startsWith(currentMonth)) return sum
      return sum + e.amount
    }, 0)
  })

  const netMonthly = computed(() => totalMonthlyIncome.value - totalMonthlyExpenses.value)

  /** Current-month spending aggregated by expense category */
  const spendingByCategory = computed(() => {
    const currentMonth = new Date().toISOString().slice(0, 7)
    const map = new Map<ExpenseCategory, number>()
    for (const e of activeExpenses.value) {
      const cat: ExpenseCategory = e.category ?? 'Other'
      if (e.type === 'adhoc') {
        // Include adhoc if its date is in current month or no date at all
        const adhocDate = e.dueDate ?? e.createdAt.split('T')[0]
        if (adhocDate && !adhocDate.startsWith(currentMonth)) continue
      }
      const prev = map.get(cat) ?? 0
      if (e.type === 'recurring') {
        const amt = getEffectiveAmount(e.amount, e.overrides, currentMonth)
        map.set(cat, prev + monthlyEquivalent(amt, e.frequency))
      } else {
        map.set(cat, prev + e.amount)
      }
    }
    return map
  })

  // --- Monthly overrides ---

  /** Set an amount override for a recurring income in a specific month */
  function setIncomeOverride(id: string, month: string, amount: number) {
    const item = incomes.value.find((i) => i.id === id)
    if (!item || item.type !== 'recurring') return
    const rec = item as RecurringIncome
    if (!rec.overrides) rec.overrides = {}
    rec.overrides[month] = amount
  }

  /** Remove an amount override for a recurring income in a specific month */
  function removeIncomeOverride(id: string, month: string) {
    const item = incomes.value.find((i) => i.id === id)
    if (!item || item.type !== 'recurring') return
    const rec = item as RecurringIncome
    if (rec.overrides) {
      delete rec.overrides[month]
      // Clean up empty overrides object
      if (Object.keys(rec.overrides).length === 0) rec.overrides = undefined
    }
  }

  /** Set an amount override for a recurring expense in a specific month */
  function setExpenseOverride(id: string, month: string, amount: number) {
    const item = expenses.value.find((e) => e.id === id)
    if (!item || item.type !== 'recurring') return
    const rec = item as RecurringExpense
    if (!rec.overrides) rec.overrides = {}
    rec.overrides[month] = amount
  }

  /** Remove an amount override for a recurring expense in a specific month */
  function removeExpenseOverride(id: string, month: string) {
    const item = expenses.value.find((e) => e.id === id)
    if (!item || item.type !== 'recurring') return
    const rec = item as RecurringExpense
    if (rec.overrides) {
      delete rec.overrides[month]
      if (Object.keys(rec.overrides).length === 0) rec.overrides = undefined
    }
  }

  // --- Family members ---
  function addFamilyMember(name: string) {
    const trimmed = name.trim()
    if (trimmed && !familyMembers.value.includes(trimmed)) {
      familyMembers.value.push(trimmed)
    }
  }

  function removeFamilyMember(name: string) {
    familyMembers.value = familyMembers.value.filter((m) => m !== name)
  }

  /** Update the approval status on an expense */
  function updateExpenseApprovalStatus(expenseId: string, status: 'pending' | 'approved' | 'rejected') {
    const index = expenses.value.findIndex((e) => e.id === expenseId)
    if (index !== -1) {
      const existing = expenses.value[index]
      if (existing) {
        expenses.value.splice(index, 1, { ...existing, approvalStatus: status })
      }
    }
  }

  return {
    incomes,
    expenses,
    activeExpenses,
    familyMembers,
    addRecurringIncome,
    addAdhocIncome,
    removeIncome,
    updateIncome,
    getIncomeById,
    addRecurringExpense,
    addAdhocExpense,
    removeExpense,
    updateExpense,
    getExpenseById,
    totalMonthlyIncome,
    totalMonthlyExpenses,
    netMonthly,
    spendingByCategory,
    setIncomeOverride,
    removeIncomeOverride,
    setExpenseOverride,
    removeExpenseOverride,
    addFamilyMember,
    removeFamilyMember,
    updateExpenseApprovalStatus,
    enableSync,
  }
})

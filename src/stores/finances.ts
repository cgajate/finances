import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import type { Income, Expense, Frequency, IncomeCategory, ExpenseCategory } from '@/types/finance'
import { getDb } from '@/lib/firebase'
import { useFirestoreSync } from '@/composables/useFirestoreSync'
import { useActivityFeedStore } from '@/stores/activityFeed'

function generateId(): string {
  return crypto.randomUUID()
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw) as T
  } catch {
    // ignore
  }
  return fallback
}

/** Advance a date by one period based on frequency */
function advanceDate(dateStr: string, frequency: Frequency): string {
  const d = new Date(dateStr + 'T00:00:00')
  switch (frequency) {
    case 'weekly':
      d.setDate(d.getDate() + 7)
      break
    case 'bi-weekly':
      d.setDate(d.getDate() + 14)
      break
    case 'monthly':
      d.setMonth(d.getMonth() + 1)
      break
    case 'quarterly':
      d.setMonth(d.getMonth() + 3)
      break
    case 'yearly':
      d.setFullYear(d.getFullYear() + 1)
      break
  }
  return d.toISOString().split('T')[0] ?? dateStr
}

/** Advance a date forward until it is today or in the future */
function advanceToFuture(dateStr: string, frequency: Frequency): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let current = dateStr
  // Safety limit to avoid infinite loops
  for (let i = 0; i < 1000; i++) {
    const d = new Date(current + 'T00:00:00')
    if (d >= today) break
    current = advanceDate(current, frequency)
  }
  return current
}

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
    incomes.value.push({
      id,
      type: 'recurring',
      category: data.category ?? 'Other',
      ...data,
      createdAt: new Date().toISOString(),
    })
    useActivityFeedStore().logActivity(userId, 'add', 'income', id, `Added recurring income "${data.description}"`)
  }

  function addAdhocIncome(data: { amount: number; description: string; date: string; category?: IncomeCategory }, userId = 'anonymous') {
    const id = generateId()
    incomes.value.push({
      id,
      type: 'adhoc',
      category: data.category ?? 'Other',
      ...data,
      createdAt: new Date().toISOString(),
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
  }, userId = 'anonymous') {
    const id = generateId()
    expenses.value.push({
      id,
      type: 'recurring',
      category: data.category ?? 'Other',
      assignedTo: data.assignedTo ?? '',
      ...data,
      createdAt: new Date().toISOString(),
    })
    if (data.assignedTo) addFamilyMember(data.assignedTo)
    useActivityFeedStore().logActivity(userId, 'add', 'expense', id, `Added recurring expense "${data.description}"`)
  }

  function addAdhocExpense(data: {
    amount: number
    description: string
    notes: string
    dueDate: string | null
    category?: ExpenseCategory
    assignedTo?: string
  }, userId = 'anonymous') {
    const id = generateId()
    expenses.value.push({
      id,
      type: 'adhoc',
      category: data.category ?? 'Other',
      assignedTo: data.assignedTo ?? '',
      ...data,
      createdAt: new Date().toISOString(),
    })
    if (data.assignedTo) addFamilyMember(data.assignedTo)
    useActivityFeedStore().logActivity(userId, 'add', 'expense', id, `Added expense "${data.description}"`)
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

  const totalMonthlyIncome = computed(() => {
    return incomes.value.reduce((sum, i) => {
      if (i.type === 'recurring') {
        return sum + monthlyEquivalent(i.amount, i.frequency)
      }
      return sum + i.amount
    }, 0)
  })

  const totalMonthlyExpenses = computed(() => {
    return expenses.value.reduce((sum, e) => {
      if (e.type === 'recurring') {
        return sum + monthlyEquivalent(e.amount, e.frequency)
      }
      return sum + e.amount
    }, 0)
  })

  const netMonthly = computed(() => totalMonthlyIncome.value - totalMonthlyExpenses.value)

  /** Current-month spending aggregated by expense category */
  const spendingByCategory = computed(() => {
    const currentMonth = new Date().toISOString().slice(0, 7)
    const map = new Map<ExpenseCategory, number>()
    for (const e of expenses.value) {
      const cat: ExpenseCategory = e.category ?? 'Other'
      if (e.type === 'adhoc') {
        // Include adhoc if dueDate is in current month or no dueDate
        if (e.dueDate && !e.dueDate.startsWith(currentMonth)) continue
      }
      const prev = map.get(cat) ?? 0
      if (e.type === 'recurring') {
        map.set(cat, prev + monthlyEquivalent(e.amount, e.frequency))
      } else {
        map.set(cat, prev + e.amount)
      }
    }
    return map
  })

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

  return {
    incomes,
    expenses,
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
    addFamilyMember,
    removeFamilyMember,
    enableSync,
  }
})

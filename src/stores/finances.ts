import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import type { Income, Expense, Frequency, IncomeCategory, ExpenseCategory } from '@/types/finance'
import { getDb } from '@/lib/firebase'
import { useFirestoreSync } from '@/composables/useFirestoreSync'

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

export const useFinancesStore = defineStore('finances', () => {
  const incomes = ref<Income[]>(loadFromStorage('finances:incomes', []))
  const expenses = ref<Expense[]>(loadFromStorage('finances:expenses', []))

  // Auto-persist to localStorage (offline fallback)
  watch(incomes, (val) => localStorage.setItem('finances:incomes', JSON.stringify(val)), { deep: true })
  watch(expenses, (val) => localStorage.setItem('finances:expenses', JSON.stringify(val)), { deep: true })

  // --- Firestore sync ---
  function enableSync(householdId: string) {
    const db = getDb()
    if (!db) return
    const path = `households/${householdId}`
    useFirestoreSync(db, path, 'incomes', incomes)
    useFirestoreSync(db, path, 'expenses', expenses)
  }

  // --- Income actions ---
  function addRecurringIncome(data: {
    amount: number
    frequency: Frequency
    description: string
    notes: string
    date: string | null
    category?: IncomeCategory
  }) {
    incomes.value.push({
      id: generateId(),
      type: 'recurring',
      category: data.category ?? 'Other',
      ...data,
      createdAt: new Date().toISOString(),
    })
  }

  function addAdhocIncome(data: { amount: number; description: string; date: string; category?: IncomeCategory }) {
    incomes.value.push({
      id: generateId(),
      type: 'adhoc',
      category: data.category ?? 'Other',
      ...data,
      createdAt: new Date().toISOString(),
    })
  }

  function removeIncome(id: string) {
    incomes.value = incomes.value.filter((i) => i.id !== id)
  }

  function updateIncome(id: string, data: Record<string, unknown>) {
    const index = incomes.value.findIndex((i) => i.id === id)
    if (index !== -1) {
      const existing = incomes.value[index]
      if (existing) {
        incomes.value.splice(index, 1, { ...existing, ...data } as Income)
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
  }) {
    expenses.value.push({
      id: generateId(),
      type: 'recurring',
      category: data.category ?? 'Other',
      ...data,
      createdAt: new Date().toISOString(),
    })
  }

  function addAdhocExpense(data: {
    amount: number
    description: string
    notes: string
    dueDate: string | null
    category?: ExpenseCategory
  }) {
    expenses.value.push({
      id: generateId(),
      type: 'adhoc',
      category: data.category ?? 'Other',
      ...data,
      createdAt: new Date().toISOString(),
    })
  }

  function removeExpense(id: string) {
    expenses.value = expenses.value.filter((e) => e.id !== id)
  }

  function updateExpense(id: string, data: Record<string, unknown>) {
    const index = expenses.value.findIndex((e) => e.id === id)
    if (index !== -1) {
      const existing = expenses.value[index]
      if (existing) {
        expenses.value.splice(index, 1, { ...existing, ...data } as Expense)
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

  return {
    incomes,
    expenses,
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
    enableSync,
  }
})

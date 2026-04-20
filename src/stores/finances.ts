import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import type { Income, Expense, Frequency } from '@/types/finance'

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

  // Auto-persist on any change (deep watch)
  watch(incomes, (val) => localStorage.setItem('finances:incomes', JSON.stringify(val)), { deep: true })
  watch(expenses, (val) => localStorage.setItem('finances:expenses', JSON.stringify(val)), { deep: true })

  // --- Income actions ---
  function addRecurringIncome(data: {
    amount: number
    frequency: Frequency
    description: string
    notes: string
    date: string | null
  }) {
    incomes.value.push({
      id: generateId(),
      type: 'recurring',
      ...data,
      createdAt: new Date().toISOString(),
    })
  }

  function addAdhocIncome(data: { amount: number; description: string; date: string }) {
    incomes.value.push({
      id: generateId(),
      type: 'adhoc',
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
  }) {
    expenses.value.push({
      id: generateId(),
      type: 'recurring',
      ...data,
      createdAt: new Date().toISOString(),
    })
  }

  function addAdhocExpense(data: {
    amount: number
    description: string
    notes: string
    dueDate: string | null
  }) {
    expenses.value.push({
      id: generateId(),
      type: 'adhoc',
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
  }
})

import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useFinancesStore } from '@/stores/finances'
import type { RecurringIncome, RecurringExpense } from '@/types/finance'

describe('finances store — monthly overrides', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  describe('expense overrides', () => {
    it('sets an override for a recurring expense', () => {
      const store = useFinancesStore()
      store.addRecurringExpense({
        amount: 300,
        frequency: 'monthly',
        description: 'PSEG',
        notes: '',
        dueDate: '2026-04-15',
      })
      const id = store.expenses[0]!.id
      store.setExpenseOverride(id, '2026-04', 200)

      const exp = store.expenses[0] as RecurringExpense
      expect(exp.overrides).toEqual({ '2026-04': 200 })
    })

    it('sets multiple overrides for different months', () => {
      const store = useFinancesStore()
      store.addRecurringExpense({
        amount: 300,
        frequency: 'monthly',
        description: 'PSEG',
        notes: '',
        dueDate: '2026-04-15',
      })
      const id = store.expenses[0]!.id
      store.setExpenseOverride(id, '2026-04', 200)
      store.setExpenseOverride(id, '2026-05', 350)

      const exp = store.expenses[0] as RecurringExpense
      expect(exp.overrides).toEqual({ '2026-04': 200, '2026-05': 350 })
    })

    it('overwrites an existing override for the same month', () => {
      const store = useFinancesStore()
      store.addRecurringExpense({
        amount: 300,
        frequency: 'monthly',
        description: 'PSEG',
        notes: '',
        dueDate: null,
      })
      const id = store.expenses[0]!.id
      store.setExpenseOverride(id, '2026-04', 200)
      store.setExpenseOverride(id, '2026-04', 250)

      const exp = store.expenses[0] as RecurringExpense
      expect(exp.overrides?.['2026-04']).toBe(250)
    })

    it('removes an override for a specific month', () => {
      const store = useFinancesStore()
      store.addRecurringExpense({
        amount: 300,
        frequency: 'monthly',
        description: 'PSEG',
        notes: '',
        dueDate: null,
      })
      const id = store.expenses[0]!.id
      store.setExpenseOverride(id, '2026-04', 200)
      store.setExpenseOverride(id, '2026-05', 350)
      store.removeExpenseOverride(id, '2026-04')

      const exp = store.expenses[0] as RecurringExpense
      expect(exp.overrides).toEqual({ '2026-05': 350 })
    })

    it('cleans up overrides object when last override is removed', () => {
      const store = useFinancesStore()
      store.addRecurringExpense({
        amount: 300,
        frequency: 'monthly',
        description: 'PSEG',
        notes: '',
        dueDate: null,
      })
      const id = store.expenses[0]!.id
      store.setExpenseOverride(id, '2026-04', 200)
      store.removeExpenseOverride(id, '2026-04')

      const exp = store.expenses[0] as RecurringExpense
      expect(exp.overrides).toBeUndefined()
    })

    it('does nothing when setting override on adhoc expense', () => {
      const store = useFinancesStore()
      store.addAdhocExpense({
        amount: 100,
        description: 'One-time',
        notes: '',
        dueDate: '2026-04-01',
      })
      const id = store.expenses[0]!.id
      store.setExpenseOverride(id, '2026-04', 50)

      // Should have no overrides field (adhoc)
      expect((store.expenses[0] as any).overrides).toBeUndefined()
    })

    it('does nothing when setting override on non-existent id', () => {
      const store = useFinancesStore()
      store.setExpenseOverride('nonexistent', '2026-04', 200)
      expect(store.expenses).toHaveLength(0)
    })

    it('works with weekly frequency', () => {
      const store = useFinancesStore()
      store.addRecurringExpense({
        amount: 50,
        frequency: 'weekly',
        description: 'Groceries',
        notes: '',
        dueDate: '2026-04-01',
      })
      const id = store.expenses[0]!.id
      store.setExpenseOverride(id, '2026-04', 40)

      const exp = store.expenses[0] as RecurringExpense
      expect(exp.overrides).toEqual({ '2026-04': 40 })
      expect(exp.frequency).toBe('weekly')
    })

    it('works with bi-weekly frequency', () => {
      const store = useFinancesStore()
      store.addRecurringExpense({
        amount: 100,
        frequency: 'bi-weekly',
        description: 'Car wash',
        notes: '',
        dueDate: '2026-04-01',
      })
      const id = store.expenses[0]!.id
      store.setExpenseOverride(id, '2026-04', 80)

      const exp = store.expenses[0] as RecurringExpense
      expect(exp.overrides?.['2026-04']).toBe(80)
    })

    it('works with quarterly frequency', () => {
      const store = useFinancesStore()
      store.addRecurringExpense({
        amount: 600,
        frequency: 'quarterly',
        description: 'Insurance',
        notes: '',
        dueDate: '2026-01-15',
      })
      const id = store.expenses[0]!.id
      store.setExpenseOverride(id, '2026-04', 550)

      const exp = store.expenses[0] as RecurringExpense
      expect(exp.overrides?.['2026-04']).toBe(550)
    })

    it('works with yearly frequency', () => {
      const store = useFinancesStore()
      store.addRecurringExpense({
        amount: 1200,
        frequency: 'yearly',
        description: 'Property Tax',
        notes: '',
        dueDate: '2026-04-15',
      })
      const id = store.expenses[0]!.id
      store.setExpenseOverride(id, '2026-04', 1100)

      const exp = store.expenses[0] as RecurringExpense
      expect(exp.overrides?.['2026-04']).toBe(1100)
    })
  })

  describe('income overrides', () => {
    it('sets an override for a recurring income', () => {
      const store = useFinancesStore()
      store.addRecurringIncome({
        amount: 5000,
        frequency: 'monthly',
        description: 'Salary',
        notes: '',
        date: '2026-04-01',
      })
      const id = store.incomes[0]!.id
      store.setIncomeOverride(id, '2026-04', 4500)

      const inc = store.incomes[0] as RecurringIncome
      expect(inc.overrides).toEqual({ '2026-04': 4500 })
    })

    it('removes an income override and cleans up', () => {
      const store = useFinancesStore()
      store.addRecurringIncome({
        amount: 5000,
        frequency: 'monthly',
        description: 'Salary',
        notes: '',
        date: null,
      })
      const id = store.incomes[0]!.id
      store.setIncomeOverride(id, '2026-04', 4500)
      store.removeIncomeOverride(id, '2026-04')

      const inc = store.incomes[0] as RecurringIncome
      expect(inc.overrides).toBeUndefined()
    })

    it('does nothing when setting override on adhoc income', () => {
      const store = useFinancesStore()
      store.addAdhocIncome({
        amount: 200,
        description: 'Freelance',
        date: '2026-04-01',
      })
      const id = store.incomes[0]!.id
      store.setIncomeOverride(id, '2026-04', 150)

      expect((store.incomes[0] as any).overrides).toBeUndefined()
    })

    it('works with bi-weekly income', () => {
      const store = useFinancesStore()
      store.addRecurringIncome({
        amount: 2500,
        frequency: 'bi-weekly',
        description: 'Paycheck',
        notes: '',
        date: '2026-04-01',
      })
      const id = store.incomes[0]!.id
      store.setIncomeOverride(id, '2026-04', 2200)

      const inc = store.incomes[0] as RecurringIncome
      expect(inc.overrides?.['2026-04']).toBe(2200)
    })
  })
})


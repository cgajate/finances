import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useFinancesStore } from '@/stores/finances'

describe('finances store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  describe('income actions', () => {
    it('starts with empty incomes', () => {
      const store = useFinancesStore()
      expect(store.incomes).toEqual([])
    })

    it('adds recurring income', () => {
      const store = useFinancesStore()
      store.addRecurringIncome({
        amount: 5000,
        frequency: 'monthly',
        description: 'Salary',
        notes: 'Main job',
        date: '2026-01-15',
      })
      expect(store.incomes).toHaveLength(1)
      const inc = store.incomes[0]!
      expect(inc.type).toBe('recurring')
      expect(inc.amount).toBe(5000)
      expect(inc.description).toBe('Salary')
      if (inc.type === 'recurring') {
        expect(inc.frequency).toBe('monthly')
        expect(inc.notes).toBe('Main job')
        expect(inc.date).toBe('2026-01-15')
      }
      expect(inc.id).toBeTruthy()
      expect(inc.createdAt).toBeTruthy()
    })

    it('adds adhoc income', () => {
      const store = useFinancesStore()
      store.addAdhocIncome({
        amount: 200,
        description: 'Freelance',
        date: '2026-03-01',
      })
      expect(store.incomes).toHaveLength(1)
      const inc = store.incomes[0]!
      expect(inc.type).toBe('adhoc')
      expect(inc.amount).toBe(200)
      if (inc.type === 'adhoc') {
        expect(inc.date).toBe('2026-03-01')
      }
    })

    it('removes income by id', () => {
      const store = useFinancesStore()
      store.addAdhocIncome({ amount: 100, description: 'A', date: '2026-01-01' })
      store.addAdhocIncome({ amount: 200, description: 'B', date: '2026-02-01' })
      expect(store.incomes).toHaveLength(2)
      const id = store.incomes[0]!.id
      store.removeIncome(id)
      expect(store.incomes).toHaveLength(1)
      expect(store.incomes[0]!.description).toBe('B')
    })

    it('removeIncome with non-existent id does nothing', () => {
      const store = useFinancesStore()
      store.addAdhocIncome({ amount: 100, description: 'A', date: '2026-01-01' })
      store.removeIncome('non-existent')
      expect(store.incomes).toHaveLength(1)
    })

    it('updates income by id', () => {
      const store = useFinancesStore()
      store.addRecurringIncome({
        amount: 1000,
        frequency: 'monthly',
        description: 'Old',
        notes: '',
        date: null,
      })
      const id = store.incomes[0]!.id
      store.updateIncome(id, { description: 'Updated', amount: 2000 })
      expect(store.incomes[0]!.description).toBe('Updated')
      expect(store.incomes[0]!.amount).toBe(2000)
    })

    it('updateIncome with non-existent id does nothing', () => {
      const store = useFinancesStore()
      store.addAdhocIncome({ amount: 100, description: 'A', date: '2026-01-01' })
      store.updateIncome('non-existent', { description: 'X' })
      expect(store.incomes[0]!.description).toBe('A')
    })

    it('getIncomeById returns the income', () => {
      const store = useFinancesStore()
      store.addAdhocIncome({ amount: 100, description: 'Test', date: '2026-01-01' })
      const id = store.incomes[0]!.id
      expect(store.getIncomeById(id)).toBeDefined()
      expect(store.getIncomeById(id)!.description).toBe('Test')
    })

    it('getIncomeById returns undefined for missing id', () => {
      const store = useFinancesStore()
      expect(store.getIncomeById('nope')).toBeUndefined()
    })
  })

  describe('expense actions', () => {
    it('starts with empty expenses', () => {
      const store = useFinancesStore()
      expect(store.expenses).toEqual([])
    })

    it('adds recurring expense', () => {
      const store = useFinancesStore()
      store.addRecurringExpense({
        amount: 1500,
        frequency: 'monthly',
        description: 'Rent',
        notes: 'Apartment',
        dueDate: '2026-01-01',
      })
      expect(store.expenses).toHaveLength(1)
      const exp = store.expenses[0]!
      expect(exp.type).toBe('recurring')
      expect(exp.amount).toBe(1500)
      if (exp.type === 'recurring') {
        expect(exp.frequency).toBe('monthly')
        expect(exp.dueDate).toBe('2026-01-01')
      }
    })

    it('adds adhoc expense', () => {
      const store = useFinancesStore()
      store.addAdhocExpense({
        amount: 300,
        description: 'Car repair',
        notes: 'Brakes',
        dueDate: null,
      })
      expect(store.expenses).toHaveLength(1)
      expect(store.expenses[0]!.type).toBe('adhoc')
    })

    it('removes expense by id', () => {
      const store = useFinancesStore()
      store.addAdhocExpense({ amount: 100, description: 'A', notes: '', dueDate: null })
      store.addAdhocExpense({ amount: 200, description: 'B', notes: '', dueDate: null })
      const id = store.expenses[0]!.id
      store.removeExpense(id)
      expect(store.expenses).toHaveLength(1)
      expect(store.expenses[0]!.description).toBe('B')
    })

    it('updates expense by id', () => {
      const store = useFinancesStore()
      store.addAdhocExpense({ amount: 100, description: 'Old', notes: '', dueDate: null })
      const id = store.expenses[0]!.id
      store.updateExpense(id, { description: 'New', amount: 999 })
      expect(store.expenses[0]!.description).toBe('New')
      expect(store.expenses[0]!.amount).toBe(999)
    })

    it('updateExpense with non-existent id does nothing', () => {
      const store = useFinancesStore()
      store.addAdhocExpense({ amount: 100, description: 'A', notes: '', dueDate: null })
      store.updateExpense('nope', { description: 'X' })
      expect(store.expenses[0]!.description).toBe('A')
    })

    it('getExpenseById works', () => {
      const store = useFinancesStore()
      store.addAdhocExpense({ amount: 50, description: 'Test', notes: '', dueDate: null })
      const id = store.expenses[0]!.id
      expect(store.getExpenseById(id)!.description).toBe('Test')
      expect(store.getExpenseById('nope')).toBeUndefined()
    })
  })

  describe('computed values', () => {
    it('totalMonthlyIncome for recurring monthly', () => {
      const store = useFinancesStore()
      store.addRecurringIncome({ amount: 3000, frequency: 'monthly', description: 'Salary', notes: '', date: null })
      expect(store.totalMonthlyIncome).toBe(3000)
    })

    it('totalMonthlyIncome for weekly frequency', () => {
      const store = useFinancesStore()
      store.addRecurringIncome({ amount: 100, frequency: 'weekly', description: 'Side gig', notes: '', date: null })
      expect(store.totalMonthlyIncome).toBeCloseTo(100 * 52 / 12)
    })

    it('totalMonthlyIncome for bi-weekly', () => {
      const store = useFinancesStore()
      store.addRecurringIncome({ amount: 2000, frequency: 'bi-weekly', description: 'Pay', notes: '', date: null })
      expect(store.totalMonthlyIncome).toBeCloseTo(2000 * 26 / 12)
    })

    it('totalMonthlyIncome for quarterly', () => {
      const store = useFinancesStore()
      store.addRecurringIncome({ amount: 900, frequency: 'quarterly', description: 'Bonus', notes: '', date: null })
      expect(store.totalMonthlyIncome).toBeCloseTo(300)
    })

    it('totalMonthlyIncome for yearly', () => {
      const store = useFinancesStore()
      store.addRecurringIncome({ amount: 12000, frequency: 'yearly', description: 'Bonus', notes: '', date: null })
      expect(store.totalMonthlyIncome).toBeCloseTo(1000)
    })

    it('totalMonthlyIncome includes adhoc at face value', () => {
      const store = useFinancesStore()
      store.addAdhocIncome({ amount: 500, description: 'Gift', date: '2026-01-01' })
      expect(store.totalMonthlyIncome).toBe(500)
    })

    it('totalMonthlyExpenses for recurring', () => {
      const store = useFinancesStore()
      store.addRecurringExpense({ amount: 1500, frequency: 'monthly', description: 'Rent', notes: '', dueDate: null })
      expect(store.totalMonthlyExpenses).toBe(1500)
    })

    it('totalMonthlyExpenses includes adhoc', () => {
      const store = useFinancesStore()
      store.addAdhocExpense({ amount: 200, description: 'Fix', notes: '', dueDate: null })
      expect(store.totalMonthlyExpenses).toBe(200)
    })

    it('netMonthly is income minus expenses', () => {
      const store = useFinancesStore()
      store.addRecurringIncome({ amount: 5000, frequency: 'monthly', description: 'Salary', notes: '', date: null })
      store.addRecurringExpense({ amount: 2000, frequency: 'monthly', description: 'Rent', notes: '', dueDate: null })
      expect(store.netMonthly).toBe(3000)
    })
  })

  describe('localStorage persistence', () => {
    it('loads from localStorage on init', () => {
      localStorage.setItem('finances:incomes', JSON.stringify([
        { id: '1', type: 'adhoc', amount: 100, description: 'Saved', date: '2026-01-01', createdAt: '2026-01-01' },
      ]))
      setActivePinia(createPinia())
      const store = useFinancesStore()
      expect(store.incomes).toHaveLength(1)
      expect(store.incomes[0]!.description).toBe('Saved')
    })

    it('handles invalid JSON in localStorage', () => {
      localStorage.setItem('finances:incomes', 'not-json')
      setActivePinia(createPinia())
      const store = useFinancesStore()
      expect(store.incomes).toEqual([])
    })
  })

  describe('assignedTo', () => {
    it('stores assignedTo on recurring expense', () => {
      const store = useFinancesStore()
      store.addRecurringExpense({ amount: 100, frequency: 'monthly', description: 'R', notes: '', dueDate: null, assignedTo: 'Dad' })
      expect(store.expenses[0]!.assignedTo).toBe('Dad')
    })

    it('stores assignedTo on adhoc expense', () => {
      const store = useFinancesStore()
      store.addAdhocExpense({ amount: 50, description: 'A', notes: '', dueDate: null, assignedTo: 'Mom' })
      expect(store.expenses[0]!.assignedTo).toBe('Mom')
    })

    it('defaults assignedTo to empty string', () => {
      const store = useFinancesStore()
      store.addRecurringExpense({ amount: 100, frequency: 'monthly', description: 'R', notes: '', dueDate: null })
      expect(store.expenses[0]!.assignedTo).toBe('')
    })

    it('auto-registers assignedTo as a family member', () => {
      const store = useFinancesStore()
      store.addRecurringExpense({ amount: 100, frequency: 'monthly', description: 'R', notes: '', dueDate: null, assignedTo: 'Dad' })
      expect(store.familyMembers).toContain('Dad')
    })

    it('does not duplicate family members', () => {
      const store = useFinancesStore()
      store.addRecurringExpense({ amount: 100, frequency: 'monthly', description: 'R', notes: '', dueDate: null, assignedTo: 'Dad' })
      store.addAdhocExpense({ amount: 50, description: 'A', notes: '', dueDate: null, assignedTo: 'Dad' })
      expect(store.familyMembers.filter((m) => m === 'Dad')).toHaveLength(1)
    })

    it('updates assignedTo via updateExpense', () => {
      const store = useFinancesStore()
      store.addRecurringExpense({ amount: 100, frequency: 'monthly', description: 'R', notes: '', dueDate: null, assignedTo: 'Dad' })
      const id = store.expenses[0]!.id
      store.updateExpense(id, { assignedTo: 'Mom' })
      expect(store.expenses[0]!.assignedTo).toBe('Mom')
    })
  })

  describe('family members', () => {
    it('starts with empty family members', () => {
      const store = useFinancesStore()
      expect(store.familyMembers).toHaveLength(0)
    })

    it('addFamilyMember adds a member', () => {
      const store = useFinancesStore()
      store.addFamilyMember('Alice')
      expect(store.familyMembers).toContain('Alice')
    })

    it('addFamilyMember trims whitespace', () => {
      const store = useFinancesStore()
      store.addFamilyMember('  Bob  ')
      expect(store.familyMembers).toContain('Bob')
    })

    it('addFamilyMember ignores duplicates', () => {
      const store = useFinancesStore()
      store.addFamilyMember('Alice')
      store.addFamilyMember('Alice')
      expect(store.familyMembers).toHaveLength(1)
    })

    it('addFamilyMember ignores empty string', () => {
      const store = useFinancesStore()
      store.addFamilyMember('')
      store.addFamilyMember('  ')
      expect(store.familyMembers).toHaveLength(0)
    })

    it('removeFamilyMember removes a member', () => {
      const store = useFinancesStore()
      store.addFamilyMember('Alice')
      store.addFamilyMember('Bob')
      store.removeFamilyMember('Alice')
      expect(store.familyMembers).toEqual(['Bob'])
    })

    it('loads family members from localStorage', () => {
      localStorage.setItem('finances:familyMembers', JSON.stringify(['Mom', 'Dad']))
      setActivePinia(createPinia())
      const store = useFinancesStore()
      expect(store.familyMembers).toEqual(['Mom', 'Dad'])
    })
  })

  describe('spendingByCategory', () => {
    it('groups adhoc expenses by category for current month', () => {
      const store = useFinancesStore()
      const curMonth = new Date().toISOString().slice(0, 7)
      store.addAdhocExpense({ amount: 100, description: 'Groceries', notes: '', dueDate: `${curMonth}-15`, category: 'Food' })
      store.addAdhocExpense({ amount: 50, description: 'Snack', notes: '', dueDate: `${curMonth}-20`, category: 'Food' })
      expect(store.spendingByCategory.get('Food')).toBe(150)
    })

    it('excludes adhoc expenses from other months', () => {
      const store = useFinancesStore()
      store.addAdhocExpense({ amount: 100, description: 'Old', notes: '', dueDate: '2020-01-15', category: 'Food' })
      expect(store.spendingByCategory.get('Food')).toBeUndefined()
    })

    it('includes adhoc expenses with no dueDate', () => {
      const store = useFinancesStore()
      store.addAdhocExpense({ amount: 100, description: 'NoDue', notes: '', dueDate: null, category: 'Food' })
      expect(store.spendingByCategory.get('Food')).toBe(100)
    })

    it('includes recurring expenses with monthlyEquivalent', () => {
      const store = useFinancesStore()
      store.addRecurringExpense({ amount: 100, frequency: 'weekly', description: 'Gas', notes: '', dueDate: null, category: 'Transport' })
      expect(store.spendingByCategory.get('Transport')).toBeCloseTo(100 * 52 / 12)
    })

    it('defaults category to Other', () => {
      const store = useFinancesStore()
      store.addAdhocExpense({ amount: 100, description: 'X', notes: '', dueDate: null })
      expect(store.spendingByCategory.get('Other')).toBe(100)
    })
  })

  describe('autoAdvanceRecurringDates', () => {
    it('advances past recurring income dates to future', () => {
      localStorage.setItem('finances:incomes', JSON.stringify([
        { id: '1', type: 'recurring', amount: 100, frequency: 'monthly', description: 'Pay', notes: '', date: '2020-01-15', category: 'Salary', createdAt: '2020-01-01' },
      ]))
      setActivePinia(createPinia())
      const store = useFinancesStore()
      const income = store.incomes[0]!
      if (income.type === 'recurring' && income.date) {
        const d = new Date(income.date + 'T00:00:00')
        expect(d.getTime()).toBeGreaterThanOrEqual(new Date().setHours(0, 0, 0, 0))
      }
    })

    it('advances past recurring expense dates to future', () => {
      localStorage.setItem('finances:expenses', JSON.stringify([
        { id: '1', type: 'recurring', amount: 100, frequency: 'weekly', description: 'Gas', notes: '', dueDate: '2020-01-15', category: 'Transport', assignedTo: '', createdAt: '2020-01-01' },
      ]))
      setActivePinia(createPinia())
      const store = useFinancesStore()
      const expense = store.expenses[0]!
      if (expense.type === 'recurring' && expense.dueDate) {
        const d = new Date(expense.dueDate + 'T00:00:00')
        expect(d.getTime()).toBeGreaterThanOrEqual(new Date().setHours(0, 0, 0, 0))
      }
    })

    it('does not advance future dates', () => {
      localStorage.setItem('finances:incomes', JSON.stringify([
        { id: '1', type: 'recurring', amount: 100, frequency: 'monthly', description: 'Pay', notes: '', date: '2099-01-15', category: 'Salary', createdAt: '2026-01-01' },
      ]))
      setActivePinia(createPinia())
      const store = useFinancesStore()
      const income = store.incomes[0]!
      if (income.type === 'recurring') {
        expect(income.date).toBe('2099-01-15')
      }
    })

    it('does not advance recurring without date', () => {
      localStorage.setItem('finances:incomes', JSON.stringify([
        { id: '1', type: 'recurring', amount: 100, frequency: 'monthly', description: 'Pay', notes: '', date: null, category: 'Salary', createdAt: '2026-01-01' },
      ]))
      setActivePinia(createPinia())
      const store = useFinancesStore()
      const income = store.incomes[0]!
      if (income.type === 'recurring') {
        expect(income.date).toBeNull()
      }
    })
  })

  describe('removeExpense edge cases', () => {
    it('removeExpense with non-existent id does nothing', () => {
      const store = useFinancesStore()
      store.addAdhocExpense({ amount: 100, description: 'A', notes: '', dueDate: null })
      store.removeExpense('non-existent')
      expect(store.expenses).toHaveLength(1)
    })
  })
})

import { describe, it, expect } from 'vitest'
import type {
  Frequency,
  RecurringIncome,
  AdhocIncome,
  Income,
  RecurringExpense,
  AdhocExpense,
  Expense,
  ForecastLineItem,
  MonthlyBreakdown,
} from '@/types/finance'

describe('finance types', () => {
  describe('Frequency', () => {
    it('accepts all valid frequency values', () => {
      const values: Frequency[] = ['weekly', 'bi-weekly', 'monthly', 'quarterly', 'yearly']
      expect(values).toHaveLength(5)
    })
  })

  describe('RecurringIncome', () => {
    it('can be constructed with all fields', () => {
      const item: RecurringIncome = {
        id: 'abc',
        type: 'recurring',
        amount: 5000,
        frequency: 'monthly',
        description: 'Salary',
        notes: 'Main job',
        date: '2026-01-15',
        createdAt: '2026-01-01T00:00:00Z',
      }
      expect(item.type).toBe('recurring')
      expect(item.frequency).toBe('monthly')
      expect(item.date).toBe('2026-01-15')
    })

    it('allows null date', () => {
      const item: RecurringIncome = {
        id: 'abc',
        type: 'recurring',
        amount: 100,
        frequency: 'weekly',
        description: 'Test',
        notes: '',
        date: null,
        createdAt: '2026-01-01T00:00:00Z',
      }
      expect(item.date).toBeNull()
    })
  })

  describe('AdhocIncome', () => {
    it('can be constructed with all fields', () => {
      const item: AdhocIncome = {
        id: 'xyz',
        type: 'adhoc',
        amount: 200,
        description: 'Freelance',
        date: '2026-03-01',
        createdAt: '2026-01-01T00:00:00Z',
      }
      expect(item.type).toBe('adhoc')
      expect(item.date).toBe('2026-03-01')
    })
  })

  describe('Income union type', () => {
    it('narrows to recurring via type discriminator', () => {
      const item: Income = {
        id: '1',
        type: 'recurring',
        amount: 1000,
        frequency: 'bi-weekly',
        description: 'Pay',
        notes: '',
        date: null,
        createdAt: '2026-01-01T00:00:00Z',
      }
      if (item.type === 'recurring') {
        expect(item.frequency).toBe('bi-weekly')
      }
    })

    it('narrows to adhoc via type discriminator', () => {
      const item: Income = {
        id: '2',
        type: 'adhoc',
        amount: 500,
        description: 'Gift',
        date: '2026-06-01',
        createdAt: '2026-01-01T00:00:00Z',
      }
      if (item.type === 'adhoc') {
        expect(item.date).toBe('2026-06-01')
      }
    })
  })

  describe('RecurringExpense', () => {
    it('can be constructed with all fields', () => {
      const item: RecurringExpense = {
        id: 'e1',
        type: 'recurring',
        amount: 1500,
        frequency: 'monthly',
        description: 'Rent',
        notes: 'Apartment',
        dueDate: '2026-01-01',
        createdAt: '2026-01-01T00:00:00Z',
      }
      expect(item.type).toBe('recurring')
      expect(item.dueDate).toBe('2026-01-01')
    })

    it('allows null dueDate', () => {
      const item: RecurringExpense = {
        id: 'e1',
        type: 'recurring',
        amount: 100,
        frequency: 'quarterly',
        description: 'Insurance',
        notes: '',
        dueDate: null,
        createdAt: '2026-01-01T00:00:00Z',
      }
      expect(item.dueDate).toBeNull()
    })
  })

  describe('AdhocExpense', () => {
    it('can be constructed with all fields', () => {
      const item: AdhocExpense = {
        id: 'ae1',
        type: 'adhoc',
        amount: 300,
        description: 'Car repair',
        notes: 'Brakes',
        dueDate: '2026-02-15',
        createdAt: '2026-01-01T00:00:00Z',
      }
      expect(item.type).toBe('adhoc')
      expect(item.notes).toBe('Brakes')
    })

    it('allows null dueDate', () => {
      const item: AdhocExpense = {
        id: 'ae2',
        type: 'adhoc',
        amount: 50,
        description: 'Misc',
        notes: '',
        dueDate: null,
        createdAt: '2026-01-01T00:00:00Z',
      }
      expect(item.dueDate).toBeNull()
    })
  })

  describe('Expense union type', () => {
    it('narrows to recurring via type discriminator', () => {
      const item: Expense = {
        id: '1',
        type: 'recurring',
        amount: 800,
        frequency: 'yearly',
        description: 'Tax',
        notes: '',
        dueDate: '2026-04-15',
        createdAt: '2026-01-01T00:00:00Z',
      }
      if (item.type === 'recurring') {
        expect(item.frequency).toBe('yearly')
      }
    })

    it('narrows to adhoc via type discriminator', () => {
      const item: Expense = {
        id: '2',
        type: 'adhoc',
        amount: 150,
        description: 'Plumber',
        notes: 'Leak fix',
        dueDate: null,
        createdAt: '2026-01-01T00:00:00Z',
      }
      if (item.type === 'adhoc') {
        expect(item.notes).toBe('Leak fix')
      }
    })
  })

  describe('ForecastLineItem', () => {
    it('can be constructed for recurring', () => {
      const item: ForecastLineItem = {
        id: 'f1',
        description: 'Salary',
        amount: 5000,
        source: 'recurring',
        frequency: 'monthly',
      }
      expect(item.source).toBe('recurring')
      expect(item.frequency).toBe('monthly')
    })

    it('can be constructed for adhoc without frequency', () => {
      const item: ForecastLineItem = {
        id: 'f2',
        description: 'Gift',
        amount: 200,
        source: 'adhoc',
      }
      expect(item.source).toBe('adhoc')
      expect(item.frequency).toBeUndefined()
    })
  })

  describe('MonthlyBreakdown', () => {
    it('can be constructed with all fields', () => {
      const breakdown: MonthlyBreakdown = {
        month: '2026-04',
        label: 'April 2026',
        incomeItems: [{ id: '1', description: 'Sal', amount: 5000, source: 'recurring', frequency: 'monthly' }],
        expenseItems: [{ id: '2', description: 'Rent', amount: 1500, source: 'recurring', frequency: 'monthly' }],
        totalIncome: 5000,
        totalExpenses: 1500,
        net: 3500,
        cumulativeSavings: 3500,
      }
      expect(breakdown.month).toBe('2026-04')
      expect(breakdown.net).toBe(3500)
      expect(breakdown.incomeItems).toHaveLength(1)
      expect(breakdown.expenseItems).toHaveLength(1)
    })

    it('works with empty items', () => {
      const breakdown: MonthlyBreakdown = {
        month: '2026-05',
        label: 'May 2026',
        incomeItems: [],
        expenseItems: [],
        totalIncome: 0,
        totalExpenses: 0,
        net: 0,
        cumulativeSavings: 0,
      }
      expect(breakdown.incomeItems).toHaveLength(0)
      expect(breakdown.net).toBe(0)
    })
  })
})


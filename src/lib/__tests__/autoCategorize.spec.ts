import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { autoCategorize } from '@/lib/autoCategorize'

const DEFAULT_EXPENSE_CATS = [
  'Housing', 'Food', 'Transport', 'Utilities',
  'Entertainment', 'Healthcare', 'Education', 'Savings', 'Other',
]

const DEFAULT_INCOME_CATS = ['Salary', 'Freelance', 'Investment', 'Gift', 'Other']

describe('autoCategorize', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('expenses', () => {
    it('categorizes grocery stores as Food', () => {
      expect(autoCategorize('WALMART GROCERY', true, DEFAULT_EXPENSE_CATS, DEFAULT_INCOME_CATS)).toBe('Food')
    })

    it('categorizes Starbucks as Food', () => {
      expect(autoCategorize('STARBUCKS #12345', true, DEFAULT_EXPENSE_CATS, DEFAULT_INCOME_CATS)).toBe('Food')
    })

    it('categorizes rent as Housing', () => {
      expect(autoCategorize('RENT PAYMENT', true, DEFAULT_EXPENSE_CATS, DEFAULT_INCOME_CATS)).toBe('Housing')
    })

    it('categorizes gas station as Transport', () => {
      expect(autoCategorize('SHELL GAS STATION', true, DEFAULT_EXPENSE_CATS, DEFAULT_INCOME_CATS)).toBe('Transport')
    })

    it('categorizes Uber as Transport', () => {
      expect(autoCategorize('UBER TRIP', true, DEFAULT_EXPENSE_CATS, DEFAULT_INCOME_CATS)).toBe('Transport')
    })

    it('categorizes Netflix as Entertainment', () => {
      expect(autoCategorize('NETFLIX.COM', true, DEFAULT_EXPENSE_CATS, DEFAULT_INCOME_CATS)).toBe('Entertainment')
    })

    it('categorizes Comcast as Utilities', () => {
      expect(autoCategorize('COMCAST CABLE', true, DEFAULT_EXPENSE_CATS, DEFAULT_INCOME_CATS)).toBe('Utilities')
    })

    it('categorizes pharmacy as Healthcare', () => {
      expect(autoCategorize('CVS PHARMACY', true, DEFAULT_EXPENSE_CATS, DEFAULT_INCOME_CATS)).toBe('Healthcare')
    })

    it('categorizes tuition as Education', () => {
      expect(autoCategorize('TUITION PAYMENT', true, DEFAULT_EXPENSE_CATS, DEFAULT_INCOME_CATS)).toBe('Education')
    })

    it('categorizes transfer as Savings', () => {
      expect(autoCategorize('TRANSFER TO SAVINGS', true, DEFAULT_EXPENSE_CATS, DEFAULT_INCOME_CATS)).toBe('Savings')
    })

    it('returns Other for unknown description', () => {
      expect(autoCategorize('RANDOM PURCHASE XYZ', true, DEFAULT_EXPENSE_CATS, DEFAULT_INCOME_CATS)).toBe('Other')
    })

    it('is case insensitive', () => {
      expect(autoCategorize('netflix subscription', true, DEFAULT_EXPENSE_CATS, DEFAULT_INCOME_CATS)).toBe('Entertainment')
    })

    it('skips category if not in active list', () => {
      const limitedCats = ['Food', 'Other']
      expect(autoCategorize('NETFLIX.COM', true, limitedCats, DEFAULT_INCOME_CATS)).toBe('Other')
    })
  })

  describe('income', () => {
    it('categorizes payroll as Salary', () => {
      expect(autoCategorize('PAYROLL DIRECT DEPOSIT', false, DEFAULT_EXPENSE_CATS, DEFAULT_INCOME_CATS)).toBe('Salary')
    })

    it('categorizes freelance as Freelance', () => {
      expect(autoCategorize('FREELANCE PAYMENT', false, DEFAULT_EXPENSE_CATS, DEFAULT_INCOME_CATS)).toBe('Freelance')
    })

    it('categorizes dividend as Investment', () => {
      expect(autoCategorize('DIVIDEND PAYMENT', false, DEFAULT_EXPENSE_CATS, DEFAULT_INCOME_CATS)).toBe('Investment')
    })

    it('categorizes gift as Gift', () => {
      expect(autoCategorize('BIRTHDAY GIFT', false, DEFAULT_EXPENSE_CATS, DEFAULT_INCOME_CATS)).toBe('Gift')
    })

    it('returns Other for unknown income', () => {
      expect(autoCategorize('MISC DEPOSIT', false, DEFAULT_EXPENSE_CATS, DEFAULT_INCOME_CATS)).toBe('Other')
    })

    it('categorizes venmo as Other', () => {
      expect(autoCategorize('VENMO PAYMENT', false, DEFAULT_EXPENSE_CATS, DEFAULT_INCOME_CATS)).toBe('Other')
    })

    it('skips category if not in active list', () => {
      const limitedCats = ['Other']
      expect(autoCategorize('PAYROLL', false, DEFAULT_EXPENSE_CATS, limitedCats)).toBe('Other')
    })
  })
})


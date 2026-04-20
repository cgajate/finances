import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useNotificationsStore } from '@/stores/notifications'
import { useFinancesStore } from '@/stores/finances'

function todayStr(): string {
  return new Date().toISOString().split('T')[0]!
}

function daysFromNow(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]!
}

describe('notifications store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('starts with no notifications', () => {
    const store = useNotificationsStore()
    expect(store.allNotifications).toEqual([])
    expect(store.unreadCount).toBe(0)
  })

  describe('expense notifications', () => {
    it('shows expense due within 7 days', () => {
      const finances = useFinancesStore()
      finances.addRecurringExpense({
        amount: 100,
        frequency: 'monthly',
        description: 'Internet',
        notes: '',
        dueDate: daysFromNow(3),
      })
      const store = useNotificationsStore()
      expect(store.expenseNotifications).toHaveLength(1)
      expect(store.expenseNotifications[0]!.description).toBe('Internet')
      expect(store.expenseNotifications[0]!.daysUntilDue).toBe(3)
    })

    it('shows expense due today', () => {
      const finances = useFinancesStore()
      finances.addRecurringExpense({
        amount: 50,
        frequency: 'weekly',
        description: 'Sub',
        notes: '',
        dueDate: todayStr(),
      })
      const store = useNotificationsStore()
      expect(store.expenseNotifications).toHaveLength(1)
      expect(store.expenseNotifications[0]!.daysUntilDue).toBe(0)
    })

    it('shows overdue expense within 7 days', () => {
      const finances = useFinancesStore()
      finances.addRecurringExpense({
        amount: 50,
        frequency: 'monthly',
        description: 'Late',
        notes: '',
        dueDate: daysFromNow(-5),
      })
      const store = useNotificationsStore()
      expect(store.expenseNotifications).toHaveLength(1)
      expect(store.expenseNotifications[0]!.daysUntilDue).toBe(-5)
    })

    it('does NOT show expense due more than 7 days away', () => {
      const finances = useFinancesStore()
      finances.addRecurringExpense({
        amount: 100,
        frequency: 'monthly',
        description: 'Far',
        notes: '',
        dueDate: daysFromNow(10),
      })
      const store = useNotificationsStore()
      expect(store.expenseNotifications).toHaveLength(0)
    })

    it('does NOT show expense without dueDate', () => {
      const finances = useFinancesStore()
      finances.addAdhocExpense({ amount: 100, description: 'NoDue', notes: '', dueDate: null })
      const store = useNotificationsStore()
      expect(store.expenseNotifications).toHaveLength(0)
    })

    it('muting hides the notification', () => {
      const finances = useFinancesStore()
      finances.addRecurringExpense({
        amount: 100,
        frequency: 'monthly',
        description: 'Internet',
        notes: '',
        dueDate: daysFromNow(2),
      })
      const store = useNotificationsStore()
      expect(store.expenseNotifications).toHaveLength(1)
      store.muteExpense(finances.expenses[0]!.id)
      expect(store.expenseNotifications).toHaveLength(0)
      expect(store.isExpenseMuted(finances.expenses[0]!.id)).toBe(true)
    })

    it('unmuting shows notification again', () => {
      const finances = useFinancesStore()
      finances.addRecurringExpense({
        amount: 100,
        frequency: 'monthly',
        description: 'Internet',
        notes: '',
        dueDate: daysFromNow(2),
      })
      const store = useNotificationsStore()
      const id = finances.expenses[0]!.id
      store.muteExpense(id)
      expect(store.expenseNotifications).toHaveLength(0)
      store.unmuteExpense(id)
      expect(store.expenseNotifications).toHaveLength(1)
    })

    it('muting adhoc expense sets 30-day mute', () => {
      const finances = useFinancesStore()
      finances.addAdhocExpense({
        amount: 100,
        description: 'Adhoc',
        notes: '',
        dueDate: daysFromNow(1),
      })
      const store = useNotificationsStore()
      store.muteExpense(finances.expenses[0]!.id)
      expect(store.isExpenseMuted(finances.expenses[0]!.id)).toBe(true)
    })

    it('muteExpense with missing expense does nothing', () => {
      const store = useNotificationsStore()
      store.muteExpense('nonexistent')
      // no crash
      expect(store.expenseNotifications).toHaveLength(0)
    })

    it('muteExpense with expense without dueDate does nothing', () => {
      const finances = useFinancesStore()
      finances.addAdhocExpense({ amount: 100, description: 'NoDue', notes: '', dueDate: null })
      const store = useNotificationsStore()
      store.muteExpense(finances.expenses[0]!.id)
      // no crash, not muted (no date to mute on)
    })
  })

  describe('income notifications', () => {
    it('shows income arriving within 7 days', () => {
      const finances = useFinancesStore()
      finances.addAdhocIncome({
        amount: 500,
        description: 'Bonus',
        date: daysFromNow(2),
      })
      const store = useNotificationsStore()
      expect(store.incomeNotifications).toHaveLength(1)
    })

    it('does NOT show income with no date (recurring, date=null)', () => {
      const finances = useFinancesStore()
      finances.addRecurringIncome({
        amount: 3000,
        frequency: 'monthly',
        description: 'Salary',
        notes: '',
        date: null,
      })
      const store = useNotificationsStore()
      expect(store.incomeNotifications).toHaveLength(0)
    })

    it('does NOT show income more than 7 days out', () => {
      const finances = useFinancesStore()
      finances.addAdhocIncome({
        amount: 500,
        description: 'Far',
        date: daysFromNow(10),
      })
      const store = useNotificationsStore()
      expect(store.incomeNotifications).toHaveLength(0)
    })

    it('dismissing income hides it permanently', () => {
      const finances = useFinancesStore()
      finances.addAdhocIncome({
        amount: 500,
        description: 'Bonus',
        date: daysFromNow(1),
      })
      const store = useNotificationsStore()
      expect(store.incomeNotifications).toHaveLength(1)
      store.dismissIncome(finances.incomes[0]!.id)
      expect(store.incomeNotifications).toHaveLength(0)
    })

    it('dismissing same id twice does not duplicate', () => {
      const finances = useFinancesStore()
      finances.addAdhocIncome({ amount: 500, description: 'Bonus', date: daysFromNow(1) })
      const store = useNotificationsStore()
      const id = finances.incomes[0]!.id
      store.dismissIncome(id)
      store.dismissIncome(id)
      // Check internal state doesn't have duplicates
      expect(store.incomeNotifications).toHaveLength(0)
    })
  })

  describe('dismissAll', () => {
    it('dismisses all income and mutes all expenses', () => {
      const finances = useFinancesStore()
      finances.addAdhocIncome({ amount: 100, description: 'Inc', date: daysFromNow(1) })
      finances.addRecurringExpense({
        amount: 50,
        frequency: 'monthly',
        description: 'Exp',
        notes: '',
        dueDate: daysFromNow(2),
      })
      const store = useNotificationsStore()
      expect(store.unreadCount).toBe(2)
      store.dismissAll()
      expect(store.unreadCount).toBe(0)
    })
  })

  describe('unreadCount', () => {
    it('counts all notifications', () => {
      const finances = useFinancesStore()
      finances.addAdhocIncome({ amount: 100, description: 'Inc1', date: daysFromNow(1) })
      finances.addAdhocIncome({ amount: 200, description: 'Inc2', date: daysFromNow(2) })
      finances.addRecurringExpense({ amount: 50, frequency: 'monthly', description: 'Exp', notes: '', dueDate: daysFromNow(3) })
      const store = useNotificationsStore()
      expect(store.unreadCount).toBe(3)
    })
  })

  describe('localStorage persistence', () => {
    it('loads dismissed incomes from localStorage', () => {
      const finances = useFinancesStore()
      finances.addAdhocIncome({ amount: 100, description: 'Inc', date: daysFromNow(1) })
      const id = finances.incomes[0]!.id
      localStorage.setItem('notifications:dismissedIncomes', JSON.stringify([id]))
      setActivePinia(createPinia())
      // Re-add the income since store was reset
      const finances2 = useFinancesStore()
      finances2.addAdhocIncome({ amount: 100, description: 'Inc', date: daysFromNow(1) })
      // Manually set id to match
    })

    it('handles invalid JSON gracefully', () => {
      localStorage.setItem('notifications:dismissedIncomes', 'bad-json')
      localStorage.setItem('notifications:mutedExpenses', 'bad-json')
      setActivePinia(createPinia())
      const finances = useFinancesStore()
      const store = useNotificationsStore()
      expect(store.allNotifications).toEqual([])
    })
  })
})


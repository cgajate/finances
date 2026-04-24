import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import NotificationPanel from '@/components/NotificationPanel.vue'
import { useFinancesStore } from '@/stores/finances'
import { useNotificationsStore } from '@/stores/notifications'
import { useBudgetsStore } from '@/stores/budgets'

function daysFromNow(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]!
}

describe('NotificationPanel', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    localStorage.clear()
    pinia = createPinia()
    setActivePinia(pinia)
  })

  function mountPanel() {
    return mount(NotificationPanel, {
      global: { plugins: [pinia] },
    })
  }

  it('renders the bell button', () => {
    const wrapper = mountPanel()
    expect(wrapper.find('.bell-btn').exists()).toBe(true)
  })

  it('does not show badge when no notifications', () => {
    const wrapper = mountPanel()
    expect(wrapper.find('.badge').exists()).toBe(false)
  })

  it('shows badge with count when there are notifications', () => {
    const finances = useFinancesStore()
    finances.addAdhocIncome({ amount: 100, description: 'Inc', date: daysFromNow(1) })
    const wrapper = mountPanel()
    expect(wrapper.find('.badge').exists()).toBe(true)
    expect(wrapper.find('.badge').text()).toBe('1')
  })

  it('opens panel on bell click', async () => {
    const wrapper = mountPanel()
    expect(wrapper.find('.panel').exists()).toBe(false)
    await wrapper.find('.bell-btn').trigger('click')
    expect(wrapper.find('.panel').exists()).toBe(true)
  })

  it('closes panel on backdrop click', async () => {
    const wrapper = mountPanel()
    await wrapper.find('.bell-btn').trigger('click')
    expect(wrapper.find('.panel').exists()).toBe(true)
    await wrapper.find('.backdrop').trigger('click')
    expect(wrapper.find('.panel').exists()).toBe(false)
  })

  it('shows empty message when no notifications', async () => {
    const wrapper = mountPanel()
    await wrapper.find('.bell-btn').trigger('click')
    expect(wrapper.find('.empty').exists()).toBe(true)
    expect(wrapper.text()).toContain('No notifications')
  })

  it('shows expense notification with mute button', async () => {
    const finances = useFinancesStore()
    finances.addRecurringExpense({
      amount: 50,
      frequency: 'monthly',
      description: 'Internet',
      notes: '',
      dueDate: daysFromNow(2),
    })
    const wrapper = mountPanel()
    await wrapper.find('.bell-btn').trigger('click')
    expect(wrapper.text()).toContain('Internet')
    expect(wrapper.find('.mute-btn').exists()).toBe(true)
  })

  it('shows income notification with dismiss button', async () => {
    const finances = useFinancesStore()
    finances.addAdhocIncome({ amount: 200, description: 'Bonus', date: daysFromNow(1) })
    const wrapper = mountPanel()
    await wrapper.find('.bell-btn').trigger('click')
    expect(wrapper.text()).toContain('Bonus')
    expect(wrapper.find('.dismiss-btn').exists()).toBe(true)
  })

  it('shows Dismiss All button when there are notifications', async () => {
    const finances = useFinancesStore()
    finances.addAdhocIncome({ amount: 200, description: 'Bonus', date: daysFromNow(1) })
    const wrapper = mountPanel()
    await wrapper.find('.bell-btn').trigger('click')
    expect(wrapper.find('.dismiss-all').exists()).toBe(true)
  })

  it('does not show Dismiss All when no notifications', async () => {
    const wrapper = mountPanel()
    await wrapper.find('.bell-btn').trigger('click')
    expect(wrapper.find('.dismiss-all').exists()).toBe(false)
  })

  it('closes panel when bell is clicked again (toggle)', async () => {
    const wrapper = mountPanel()
    await wrapper.find('.bell-btn').trigger('click')
    expect(wrapper.find('.panel').exists()).toBe(true)
    await wrapper.find('.bell-btn').trigger('click')
    expect(wrapper.find('.panel').exists()).toBe(false)
  })

  it('closes panel on Escape keydown', async () => {
    const wrapper = mountPanel()
    await wrapper.find('.bell-btn').trigger('click')
    expect(wrapper.find('.panel').exists()).toBe(true)
    await wrapper.find('.panel').trigger('keydown.escape')
    expect(wrapper.find('.panel').exists()).toBe(false)
  })

  it('calls muteExpense when mute button is clicked', async () => {
    const finances = useFinancesStore()
    finances.addRecurringExpense({
      amount: 50,
      frequency: 'monthly',
      description: 'Internet',
      notes: '',
      dueDate: daysFromNow(2),
    })
    const notifications = useNotificationsStore()
    const spy = vi.spyOn(notifications, 'muteExpense')
    const wrapper = mountPanel()
    await wrapper.find('.bell-btn').trigger('click')
    await wrapper.find('.mute-btn').trigger('click')
    expect(spy).toHaveBeenCalled()
  })

  it('calls dismissIncome when dismiss button is clicked on income', async () => {
    const finances = useFinancesStore()
    finances.addAdhocIncome({ amount: 200, description: 'Bonus', date: daysFromNow(1) })
    const notifications = useNotificationsStore()
    const spy = vi.spyOn(notifications, 'dismissIncome')
    const wrapper = mountPanel()
    await wrapper.find('.bell-btn').trigger('click')
    await wrapper.find('.dismiss-btn').trigger('click')
    expect(spy).toHaveBeenCalled()
  })

  it('calls dismissAll and closes panel when Dismiss All is clicked', async () => {
    const finances = useFinancesStore()
    finances.addAdhocIncome({ amount: 200, description: 'Bonus', date: daysFromNow(1) })
    const notifications = useNotificationsStore()
    const spy = vi.spyOn(notifications, 'dismissAll')
    const wrapper = mountPanel()
    await wrapper.find('.bell-btn').trigger('click')
    await wrapper.find('.dismiss-all').trigger('click')
    expect(spy).toHaveBeenCalled()
    expect(wrapper.find('.panel').exists()).toBe(false)
  })

  it('renders budget-over notification', async () => {
    const finances = useFinancesStore()
    const budgets = useBudgetsStore()
    finances.addAdhocExpense({ amount: 200, description: 'Groceries', notes: '', dueDate: null, category: 'Food' })
    budgets.setBudget('Food', 100)
    const wrapper = mountPanel()
    await wrapper.find('.bell-btn').trigger('click')
    expect(wrapper.text()).toContain('Food budget exceeded')
  })

  it('renders budget-warning notification', async () => {
    const finances = useFinancesStore()
    const budgets = useBudgetsStore()
    finances.addAdhocExpense({ amount: 85, description: 'Groceries', notes: '', dueDate: null, category: 'Food' })
    budgets.setBudget('Food', 100)
    const wrapper = mountPanel()
    await wrapper.find('.bell-btn').trigger('click')
    expect(wrapper.text()).toContain('Food budget at')
  })

  it('calls dismissBudget when dismiss button is clicked on budget notification', async () => {
    const finances = useFinancesStore()
    const budgets = useBudgetsStore()
    finances.addAdhocExpense({ amount: 200, description: 'Groceries', notes: '', dueDate: null, category: 'Food' })
    budgets.setBudget('Food', 100)
    const notifications = useNotificationsStore()
    const spy = vi.spyOn(notifications, 'dismissBudget')
    const wrapper = mountPanel()
    await wrapper.find('.bell-btn').trigger('click')
    await wrapper.find('.dismiss-btn').trigger('click')
    expect(spy).toHaveBeenCalled()
  })

  it('close() exposed method closes the panel', async () => {
    const wrapper = mountPanel()
    await wrapper.find('.bell-btn').trigger('click')
    expect(wrapper.find('.panel').exists()).toBe(true)
    ;(wrapper.vm as any).close()
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.panel').exists()).toBe(false)
  })

  it('dueLabel shows overdue text for negative days', async () => {
    const finances = useFinancesStore()
    finances.addRecurringExpense({
      amount: 50,
      frequency: 'monthly',
      description: 'Late Bill',
      notes: '',
      dueDate: daysFromNow(-3),
    })
    const wrapper = mountPanel()
    await wrapper.find('.bell-btn').trigger('click')
    expect(wrapper.text()).toContain('3 days overdue')
  })

  it('dueLabel shows "Due today" for 0 days', async () => {
    const finances = useFinancesStore()
    finances.addRecurringExpense({
      amount: 50,
      frequency: 'monthly',
      description: 'Today Bill',
      notes: '',
      dueDate: daysFromNow(0),
    })
    const wrapper = mountPanel()
    await wrapper.find('.bell-btn').trigger('click')
    expect(wrapper.text()).toContain('Due today')
  })

  it('dueLabel shows "Due tomorrow" for 1 day', async () => {
    const finances = useFinancesStore()
    finances.addRecurringExpense({
      amount: 50,
      frequency: 'monthly',
      description: 'Tomorrow Bill',
      notes: '',
      dueDate: daysFromNow(1),
    })
    const wrapper = mountPanel()
    await wrapper.find('.bell-btn').trigger('click')
    expect(wrapper.text()).toContain('Due tomorrow')
  })

  it('dueLabel shows "Due in X days" for days > 1', async () => {
    const finances = useFinancesStore()
    finances.addRecurringExpense({
      amount: 50,
      frequency: 'monthly',
      description: 'Future Bill',
      notes: '',
      dueDate: daysFromNow(5),
    })
    const wrapper = mountPanel()
    await wrapper.find('.bell-btn').trigger('click')
    expect(wrapper.text()).toContain('Due in 5 days')
  })

  it('dueLabel shows singular "day" for 1 day overdue', async () => {
    const finances = useFinancesStore()
    finances.addRecurringExpense({
      amount: 50,
      frequency: 'monthly',
      description: 'Yesterday Bill',
      notes: '',
      dueDate: daysFromNow(-1),
    })
    const wrapper = mountPanel()
    await wrapper.find('.bell-btn').trigger('click')
    expect(wrapper.text()).toContain('1 day overdue')
  })

  it('applies overdue class when daysUntilDue is negative', async () => {
    const finances = useFinancesStore()
    finances.addRecurringExpense({
      amount: 50,
      frequency: 'monthly',
      description: 'Overdue Bill',
      notes: '',
      dueDate: daysFromNow(-2),
    })
    const wrapper = mountPanel()
    await wrapper.find('.bell-btn').trigger('click')
    expect(wrapper.find('.due-label.overdue').exists()).toBe(true)
  })
})

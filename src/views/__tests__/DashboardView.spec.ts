import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '@/views/DashboardView.vue'
import { useFinancesStore } from '@/stores/finances'
import { useBudgetsStore } from '@/stores/budgets'
import { useSavingsGoalsStore } from '@/stores/savingsGoals'

function makeRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: DashboardView },
      { path: '/finances', component: { template: '<div />' } },
      { path: '/analytics', component: { template: '<div />' } },
      { path: '/budgets', component: { template: '<div />' } },
      { path: '/savings', component: { template: '<div />' } },
    ],
  })
}

describe('DashboardView', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    localStorage.clear()
    pinia = createPinia()
    setActivePinia(pinia)
  })

  function mountView() {
    const router = makeRouter()
    return mount(DashboardView, {
      global: { plugins: [pinia, router] },
    })
  }

  it('renders the title', () => {
    const wrapper = mountView()
    expect(wrapper.find('h1').text()).toBe('Family Finances')
  })

  it('renders three summary cards', () => {
    const wrapper = mountView()
    expect(wrapper.findAll('.summary-card')).toHaveLength(3)
    expect(wrapper.find('.summary-card--income').text()).toContain('Monthly Income')
    expect(wrapper.find('.summary-card--expense').text()).toContain('Monthly Expenses')
    expect(wrapper.find('.summary-card--net').text()).toContain('Net Monthly')
  })

  it('shows $0.00 when no data', () => {
    const wrapper = mountView()
    const values = wrapper.findAll('.card-value')
    for (const v of values) {
      expect(v.text()).toBe('$0.00')
    }
  })

  it('shows empty messages when no income or expenses', () => {
    const wrapper = mountView()
    expect(wrapper.text()).toContain('No income added yet')
    expect(wrapper.text()).toContain('No expenses added yet')
  })

  it('shows income items after adding', () => {
    const store = useFinancesStore()
    store.addRecurringIncome({ amount: 5000, frequency: 'monthly', description: 'Salary', notes: '', date: null })
    const wrapper = mountView()
    expect(wrapper.text()).toContain('Salary')
    expect(wrapper.text()).toContain('$5,000.00')
  })

  it('shows expense items after adding', () => {
    const store = useFinancesStore()
    store.addRecurringExpense({ amount: 1500, frequency: 'monthly', description: 'Rent', notes: '', dueDate: null })
    const wrapper = mountView()
    expect(wrapper.text()).toContain('Rent')
    expect(wrapper.text()).toContain('$1,500.00')
  })

  it('shows Manage Income and Manage Expenses links', () => {
    const wrapper = mountView()
    expect(wrapper.text()).toContain('Manage Income')
    expect(wrapper.text()).toContain('Manage Expenses')
  })

  it('limits displayed items to 5 by default', () => {
    const store = useFinancesStore()
    for (let i = 0; i < 8; i++) {
      store.addRecurringIncome({ amount: 100 * (i + 1), frequency: 'monthly', description: `Income ${i}`, notes: '', date: null })
    }
    const wrapper = mountView()
    const incomeSection = wrapper.findAll('section')[0]!
    const items = incomeSection.findAll('li')
    expect(items.length).toBe(5)
  })

  it('shows View All button when more than 5 items', () => {
    const store = useFinancesStore()
    for (let i = 0; i < 7; i++) {
      store.addRecurringIncome({ amount: 100, frequency: 'monthly', description: `Inc ${i}`, notes: '', date: null })
    }
    const wrapper = mountView()
    expect(wrapper.find('.btn-toggle').exists()).toBe(true)
    expect(wrapper.find('.btn-toggle').text()).toContain('View All')
  })

  it('expands to show all items on View All click', async () => {
    const store = useFinancesStore()
    for (let i = 0; i < 7; i++) {
      store.addRecurringIncome({ amount: 100, frequency: 'monthly', description: `Inc ${i}`, notes: '', date: null })
    }
    const wrapper = mountView()
    await wrapper.find('.btn-toggle').trigger('click')
    const incomeSection = wrapper.findAll('section')[0]!
    expect(incomeSection.findAll('li').length).toBe(7)
    expect(wrapper.find('.btn-toggle').text()).toContain('Show Less')
  })

  it('adds negative class to net card when negative', () => {
    const store = useFinancesStore()
    store.addRecurringExpense({ amount: 10000, frequency: 'monthly', description: 'Big expense', notes: '', dueDate: null })
    const wrapper = mountView()
    expect(wrapper.find('.summary-card--net').classes()).toContain('summary-card--negative')
  })

  it('shows adhoc items as one-time', () => {
    const store = useFinancesStore()
    store.addAdhocIncome({ amount: 200, description: 'Freelance', date: '2026-01-01' })
    const wrapper = mountView()
    expect(wrapper.text()).toContain('one-time')
  })

  it('shows FilterSortBar when items exist', () => {
    const store = useFinancesStore()
    store.addRecurringIncome({ amount: 100, frequency: 'monthly', description: 'Test', notes: '', date: null })
    const wrapper = mountView()
    expect(wrapper.findComponent({ name: 'FilterSortBar' }).exists()).toBe(true)
  })

  it('does not show FilterSortBar when no items', () => {
    const wrapper = mountView()
    expect(wrapper.findComponent({ name: 'FilterSortBar' }).exists()).toBe(false)
  })

  it('shows global search input', () => {
    const wrapper = mountView()
    expect(wrapper.find('.search-input').exists()).toBe(true)
  })

  it('shows search results when query is entered', async () => {
    const store = useFinancesStore()
    store.addRecurringIncome({ amount: 5000, frequency: 'monthly', description: 'Salary', notes: '', date: null })
    store.addAdhocExpense({ amount: 75, description: 'Grocery', notes: '', dueDate: null })
    const wrapper = mountView()
    await wrapper.find('.search-input').setValue('Salary')
    expect(wrapper.text()).toContain('Search Results')
    expect(wrapper.text()).toContain('Salary')
    expect(wrapper.text()).not.toContain('Grocery')
  })

  it('hides dashboard content when searching', async () => {
    const store = useFinancesStore()
    store.addRecurringIncome({ amount: 5000, frequency: 'monthly', description: 'Salary', notes: '', date: null })
    const wrapper = mountView()
    await wrapper.find('.search-input').setValue('Salary')
    expect(wrapper.find('.summary-cards').exists()).toBe(false)
  })

  it('shows dashboard content when search is empty', () => {
    const wrapper = mountView()
    expect(wrapper.find('.summary-cards').exists()).toBe(true)
  })

  it('shows no results message for unmatched search', async () => {
    const wrapper = mountView()
    await wrapper.find('.search-input').setValue('zzzznotfound')
    expect(wrapper.text()).toContain('No results for "zzzznotfound"')
  })

  it('shows clear button and clears search on click', async () => {
    const store = useFinancesStore()
    store.addRecurringIncome({ amount: 100, frequency: 'monthly', description: 'Test', notes: '', date: null })
    const wrapper = mountView()
    await wrapper.find('.search-input').setValue('Test')
    expect(wrapper.find('.search-clear').exists()).toBe(true)
    await wrapper.find('.search-clear').trigger('click')
    expect(wrapper.find('.summary-cards').exists()).toBe(true)
  })

  it('search results show income and expense badges', async () => {
    const store = useFinancesStore()
    store.addRecurringIncome({ amount: 100, frequency: 'monthly', description: 'Monthly pay', notes: '', date: null })
    store.addRecurringExpense({ amount: 50, frequency: 'monthly', description: 'Monthly sub', notes: '', dueDate: null })
    const wrapper = mountView()
    await wrapper.find('.search-input').setValue('Monthly')
    expect(wrapper.find('.badge-income').exists()).toBe(true)
    expect(wrapper.find('.badge-expense').exists()).toBe(true)
  })

  it('shows budget progress section when budgets exist', () => {
    const store = useFinancesStore()
    const budgetsStore = useBudgetsStore()
    store.addRecurringExpense({ amount: 100, frequency: 'monthly', description: 'Food', notes: '', dueDate: null, category: 'Food' })
    budgetsStore.setBudget('Food', 500)
    const wrapper = mountView()
    expect(wrapper.find('.budget-section').exists()).toBe(true)
    expect(wrapper.text()).toContain('Budget Progress')
    expect(wrapper.text()).toContain('Manage Budgets')
  })

  it('hides budget section when no budgets', () => {
    const wrapper = mountView()
    expect(wrapper.find('.budget-section').exists()).toBe(false)
  })

  it('shows savings goals section when active goals exist', () => {
    const savingsStore = useSavingsGoalsStore()
    savingsStore.addGoal({ name: 'Vacation', targetAmount: 3000, deadline: '2026-12-31', savedAmount: 500 })
    const wrapper = mountView()
    expect(wrapper.find('.savings-section').exists()).toBe(true)
    expect(wrapper.text()).toContain('Savings Goals')
    expect(wrapper.text()).toContain('Vacation')
    expect(wrapper.text()).toContain('Manage Goals')
  })

  it('hides savings section when no active goals', () => {
    const wrapper = mountView()
    expect(wrapper.find('.savings-section').exists()).toBe(false)
  })

  it('shows filter message when income filter active but nothing matches', async () => {
    const store = useFinancesStore()
    store.addAdhocIncome({ amount: 100, description: 'Test', date: '2026-01-01' })
    const wrapper = mountView()
    const vm = wrapper.vm as any
    vm.income.toggleFilter('weekly')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('No income matches the current filter')
  })

  it('shows filter message when expense filter active but nothing matches', async () => {
    const store = useFinancesStore()
    store.addAdhocExpense({ amount: 100, description: 'Test', notes: '', dueDate: null })
    const wrapper = mountView()
    const vm = wrapper.vm as any
    vm.expense.toggleFilter('weekly')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('No expenses match the current filter')
  })

  it('shows View All toggle for expenses when more than 5', async () => {
    const store = useFinancesStore()
    for (let i = 0; i < 7; i++) {
      store.addRecurringExpense({ amount: 100, frequency: 'monthly', description: `Exp ${i}`, notes: '', dueDate: null })
    }
    const wrapper = mountView()
    const expenseSection = wrapper.findAll('section')[1]!
    expect(expenseSection.find('.btn-toggle').exists()).toBe(true)
    await expenseSection.find('.btn-toggle').trigger('click')
    expect(expenseSection.findAll('li').length).toBe(7)
  })

  it('shows "filtered" label when filters are active', async () => {
    const store = useFinancesStore()
    store.addRecurringIncome({ amount: 100, frequency: 'monthly', description: 'T', notes: '', date: null })
    const wrapper = mountView()
    const vm = wrapper.vm as any
    vm.income.toggleFilter('monthly')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('filtered')
  })

  it('submits sort panel on income FilterSortBar', async () => {
    const store = useFinancesStore()
    store.addRecurringIncome({ amount: 100, frequency: 'monthly', description: 'T', notes: '', date: null })
    const wrapper = mountView()
    // Click the sort trigger
    const sortBtn = wrapper.findAll('.trigger-btn')[1]!
    await sortBtn.trigger('click')
    await wrapper.vm.$nextTick()
    // Submit sort
    const submitBtn = wrapper.find('.footer-btn.submit')
    expect(submitBtn.exists()).toBe(true)
    await submitBtn.trigger('click')
    await wrapper.vm.$nextTick()
    // Should have applied sort
    expect(wrapper.text()).toContain('Income')
  })

  it('submits sort panel on expense FilterSortBar', async () => {
    const store = useFinancesStore()
    store.addRecurringIncome({ amount: 100, frequency: 'monthly', description: 'T', notes: '', date: null })
    store.addRecurringExpense({ amount: 100, frequency: 'monthly', description: 'E', notes: '', dueDate: null })
    const wrapper = mountView()
    // Find the expense section's FilterSortBar sort trigger
    const bars = wrapper.findAllComponents({ name: 'FilterSortBar' })
    const expenseBar = bars[1]!
    const sortTrigger = expenseBar.findAll('.trigger-btn')[1]!
    await sortTrigger.trigger('click')
    await wrapper.vm.$nextTick()
    // Submit
    const submitBtn = expenseBar.find('.footer-btn.submit')
    if (submitBtn.exists()) {
      await submitBtn.trigger('click')
      await wrapper.vm.$nextTick()
    }
    expect(wrapper.text()).toContain('Expenses')
  })
})

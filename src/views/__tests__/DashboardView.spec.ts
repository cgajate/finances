import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '@/views/DashboardView.vue'
import { useFinancesStore } from '@/stores/finances'

function makeRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: DashboardView },
      { path: '/finances', component: { template: '<div />' } },
      { path: '/analytics', component: { template: '<div />' } },
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
    expect(wrapper.findAll('.card')).toHaveLength(3)
    expect(wrapper.find('.income-card').text()).toContain('Monthly Income')
    expect(wrapper.find('.expense-card').text()).toContain('Monthly Expenses')
    expect(wrapper.find('.net-card').text()).toContain('Net Monthly')
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
    expect(wrapper.find('.net-card').classes()).toContain('negative')
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
})


import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import IncomeView from '@/views/IncomeView.vue'
import { useFinancesStore } from '@/stores/finances'

function makeRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/income', component: IncomeView },
      { path: '/income/:id/edit', component: { template: '<div />' } },
    ],
  })
}

describe('IncomeView', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    localStorage.clear()
    pinia = createPinia()
    setActivePinia(pinia)
  })

  function mountView() {
    const router = makeRouter()
    return mount(IncomeView, {
      global: { plugins: [pinia, router] },
    })
  }

  it('renders the title', () => {
    const wrapper = mountView()
    expect(wrapper.find('h1').text()).toBe('Income')
  })

  it('shows recurring tab active by default', () => {
    const wrapper = mountView()
    const tabs = wrapper.findAll('.tabs button')
    expect(tabs[0]!.classes()).toContain('active')
    expect(tabs[1]!.classes()).not.toContain('active')
  })

  it('switches to adhoc tab on click', async () => {
    const wrapper = mountView()
    const tabs = wrapper.findAll('.tabs button')
    await tabs[1]!.trigger('click')
    expect(tabs[1]!.classes()).toContain('active')
    expect(wrapper.text()).toContain('Ad-hoc Income')
  })

  it('shows recurring form with all fields', () => {
    const wrapper = mountView()
    expect(wrapper.text()).toContain('Description')
    expect(wrapper.text()).toContain('Amount')
    expect(wrapper.text()).toContain('Frequency')
    expect(wrapper.text()).toContain('Date')
    expect(wrapper.text()).toContain('Notes')
    expect(wrapper.find('.btn-submit').text()).toContain('Add Recurring Income')
  })

  it('shows adhoc form with correct fields', async () => {
    const wrapper = mountView()
    await wrapper.findAll('.tabs button')[1]!.trigger('click')
    expect(wrapper.find('.btn-submit').text()).toContain('Add Ad-hoc Income')
  })

  it('shows empty message when no income', () => {
    const wrapper = mountView()
    expect(wrapper.text()).toContain('No income entries yet')
  })

  it('shows income items in list', () => {
    const store = useFinancesStore()
    store.addRecurringIncome({ amount: 3000, frequency: 'monthly', description: 'Salary', notes: 'Main', date: '2026-01-15' })
    const wrapper = mountView()
    expect(wrapper.text()).toContain('Salary')
    expect(wrapper.text()).toContain('$3,000.00')
    expect(wrapper.text()).toContain('monthly')
  })

  it('shows adhoc income as one-time', () => {
    const store = useFinancesStore()
    store.addAdhocIncome({ amount: 200, description: 'Freelance', date: '2026-03-01' })
    const wrapper = mountView()
    expect(wrapper.text()).toContain('one-time')
  })

  it('shows edit and remove buttons for each item', () => {
    const store = useFinancesStore()
    store.addRecurringIncome({ amount: 100, frequency: 'monthly', description: 'Test', notes: '', date: null })
    const wrapper = mountView()
    expect(wrapper.find('.btn-edit').exists()).toBe(true)
    expect(wrapper.find('.btn-delete').exists()).toBe(true)
  })

  it('removes income on Remove click', async () => {
    const store = useFinancesStore()
    store.addRecurringIncome({ amount: 100, frequency: 'monthly', description: 'ToRemove', notes: '', date: null })
    const wrapper = mountView()
    expect(wrapper.text()).toContain('ToRemove')
    await wrapper.find('.btn-delete').trigger('click')
    expect(store.incomes).toHaveLength(0)
  })

  it('shows date label as "Date *" when yearly is selected', async () => {
    const wrapper = mountView()
    const select = wrapper.find('select')
    await select.setValue('yearly')
    expect(wrapper.text()).toContain('Date *')
  })

  it('shows date label as "Date (optional)" normally', () => {
    const wrapper = mountView()
    expect(wrapper.text()).toContain('Date (optional)')
  })

  it('shows notes and date metadata', () => {
    const store = useFinancesStore()
    store.addRecurringIncome({ amount: 100, frequency: 'monthly', description: 'X', notes: 'Some note', date: '2026-06-01' })
    const wrapper = mountView()
    expect(wrapper.text()).toContain('Some note')
    expect(wrapper.text()).toContain('2026-06-01')
  })

  it('shows FilterSortBar when items exist', () => {
    const store = useFinancesStore()
    store.addRecurringIncome({ amount: 100, frequency: 'monthly', description: 'T', notes: '', date: null })
    const wrapper = mountView()
    expect(wrapper.findComponent({ name: 'FilterSortBar' }).exists()).toBe(true)
  })

  it('does not show FilterSortBar when no items', () => {
    const wrapper = mountView()
    expect(wrapper.findComponent({ name: 'FilterSortBar' }).exists()).toBe(false)
  })
})


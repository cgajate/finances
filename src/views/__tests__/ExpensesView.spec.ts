import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import ExpensesView from '@/views/ExpensesView.vue'
import { useFinancesStore } from '@/stores/finances'

function makeRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/expenses', component: ExpensesView },
      { path: '/expenses/:id/edit', component: { template: '<div />' } },
    ],
  })
}

describe('ExpensesView', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    localStorage.clear()
    pinia = createPinia()
    setActivePinia(pinia)
  })

  function mountView() {
    const router = makeRouter()
    return mount(ExpensesView, {
      global: { plugins: [pinia, router] },
    })
  }

  it('renders the title', () => {
    const wrapper = mountView()
    expect(wrapper.find('h1').text()).toBe('Expenses')
  })

  it('shows recurring tab active by default', () => {
    const wrapper = mountView()
    const tabs = wrapper.findAll('.tabs button')
    expect(tabs[0]!.classes()).toContain('active')
  })

  it('switches to adhoc tab', async () => {
    const wrapper = mountView()
    await wrapper.findAll('.tabs button')[1]!.trigger('click')
    expect(wrapper.text()).toContain('Add Ad-hoc Expense')
  })

  it('shows recurring form fields', () => {
    const wrapper = mountView()
    expect(wrapper.text()).toContain('Description')
    expect(wrapper.text()).toContain('Amount')
    expect(wrapper.text()).toContain('Frequency')
    expect(wrapper.text()).toContain('Due Date')
    expect(wrapper.text()).toContain('Notes')
    expect(wrapper.find('.btn-submit').text()).toContain('Add Recurring Expense')
  })

  it('shows empty message when no expenses', () => {
    const wrapper = mountView()
    expect(wrapper.text()).toContain('No expense entries yet')
  })

  it('shows expense items in list', () => {
    const store = useFinancesStore()
    store.addRecurringExpense({ amount: 1500, frequency: 'monthly', description: 'Rent', notes: 'Apt', dueDate: '2026-01-01' })
    const wrapper = mountView()
    expect(wrapper.text()).toContain('Rent')
    expect(wrapper.text()).toContain('$1,500.00')
    expect(wrapper.text()).toContain('monthly')
  })

  it('shows adhoc expense as one-time', () => {
    const store = useFinancesStore()
    store.addAdhocExpense({ amount: 300, description: 'Car fix', notes: '', dueDate: null })
    const wrapper = mountView()
    expect(wrapper.text()).toContain('one-time')
  })

  it('shows due date and notes metadata', () => {
    const store = useFinancesStore()
    store.addRecurringExpense({ amount: 100, frequency: 'monthly', description: 'X', notes: 'A note', dueDate: '2026-05-01' })
    const wrapper = mountView()
    expect(wrapper.text()).toContain('2026-05-01')
    expect(wrapper.text()).toContain('A note')
  })

  it('shows edit and remove buttons', () => {
    const store = useFinancesStore()
    store.addAdhocExpense({ amount: 50, description: 'Test', notes: '', dueDate: null })
    const wrapper = mountView()
    expect(wrapper.find('.btn-edit').exists()).toBe(true)
    expect(wrapper.find('.btn-delete').exists()).toBe(true)
  })

  it('removes expense on Remove click', async () => {
    const store = useFinancesStore()
    store.addAdhocExpense({ amount: 50, description: 'Gone', notes: '', dueDate: null })
    const wrapper = mountView()
    await wrapper.find('.btn-delete').trigger('click')
    expect(store.expenses).toHaveLength(0)
  })

  it('shows "Due Date *" when yearly selected', async () => {
    const wrapper = mountView()
    await wrapper.find('select').setValue('yearly')
    expect(wrapper.text()).toContain('Due Date *')
  })

  it('shows "Due Date (optional)" normally', () => {
    const wrapper = mountView()
    expect(wrapper.text()).toContain('Due Date (optional)')
  })

  it('shows FilterSortBar when items exist', () => {
    const store = useFinancesStore()
    store.addAdhocExpense({ amount: 50, description: 'T', notes: '', dueDate: null })
    const wrapper = mountView()
    expect(wrapper.findComponent({ name: 'FilterSortBar' }).exists()).toBe(true)
  })
})


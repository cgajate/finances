import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import ExpensesView from '@/views/ExpensesView.vue'
import { useFinancesStore } from '@/stores/finances'
import { useSnackbar } from '@/composables/useSnackbar'

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
    useSnackbar().dismissAll()
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

  it('shows assigned-to badge when expense has assignedTo', () => {
    const store = useFinancesStore()
    store.addRecurringExpense({ amount: 100, frequency: 'monthly', description: 'Rent', notes: '', dueDate: null, assignedTo: 'Dad' })
    const wrapper = mountView()
    expect(wrapper.find('.assigned-badge').exists()).toBe(true)
    expect(wrapper.text()).toContain('Dad')
  })

  it('does not show assigned-to badge when assignedTo is empty', () => {
    const store = useFinancesStore()
    store.addRecurringExpense({ amount: 100, frequency: 'monthly', description: 'Rent', notes: '', dueDate: null })
    const wrapper = mountView()
    expect(wrapper.find('.assigned-badge').exists()).toBe(false)
  })

  it('shows Assigned To input in recurring form', () => {
    const wrapper = mountView()
    expect(wrapper.text()).toContain('Assigned To')
  })

  it('shows search input when items exist', () => {
    const store = useFinancesStore()
    store.addAdhocExpense({ amount: 50, description: 'T', notes: '', dueDate: null })
    const wrapper = mountView()
    expect(wrapper.find('.search-input').exists()).toBe(true)
  })

  it('does not show search input when no items', () => {
    const wrapper = mountView()
    expect(wrapper.find('.search-input').exists()).toBe(false)
  })

  it('filters expense list by search query', async () => {
    const store = useFinancesStore()
    store.addRecurringExpense({ amount: 1500, frequency: 'monthly', description: 'Rent', notes: '', dueDate: null })
    store.addAdhocExpense({ amount: 75, description: 'Grocery', notes: '', dueDate: null })
    const wrapper = mountView()
    expect(wrapper.findAll('.list-item')).toHaveLength(2)
    await wrapper.find('.search-input').setValue('Rent')
    expect(wrapper.findAll('.list-item')).toHaveLength(1)
    expect(wrapper.text()).toContain('Rent')
    expect(wrapper.text()).not.toContain('Grocery')
  })

  it('shows no-match message when search has no results', async () => {
    const store = useFinancesStore()
    store.addAdhocExpense({ amount: 50, description: 'Test', notes: '', dueDate: null })
    const wrapper = mountView()
    await wrapper.find('.search-input').setValue('zzzznotfound')
    expect(wrapper.text()).toContain('No expenses match "zzzznotfound"')
  })

  it('clears search on clear button click', async () => {
    const store = useFinancesStore()
    store.addAdhocExpense({ amount: 50, description: 'Test', notes: '', dueDate: null })
    store.addAdhocExpense({ amount: 100, description: 'Other', notes: '', dueDate: null })
    const wrapper = mountView()
    await wrapper.find('.search-input').setValue('Test')
    expect(wrapper.findAll('.list-item')).toHaveLength(1)
    await wrapper.find('.search-clear').trigger('click')
    expect(wrapper.findAll('.list-item')).toHaveLength(2)
  })

  it('searches by assignedTo field', async () => {
    const store = useFinancesStore()
    store.addRecurringExpense({ amount: 100, frequency: 'monthly', description: 'Electric', notes: '', dueDate: null, assignedTo: 'Dad' })
    store.addRecurringExpense({ amount: 200, frequency: 'monthly', description: 'Water', notes: '', dueDate: null, assignedTo: 'Mom' })
    const wrapper = mountView()
    await wrapper.find('.search-input').setValue('Dad')
    expect(wrapper.findAll('.list-item')).toHaveLength(1)
    expect(wrapper.text()).toContain('Electric')
  })

  it('shows snackbar with undo after removing expense', async () => {
    const store = useFinancesStore()
    store.addAdhocExpense({ amount: 50, description: 'Groceries', notes: '', dueDate: null })
    const wrapper = mountView()
    await wrapper.find('.btn-delete').trigger('click')
    expect(store.expenses).toHaveLength(0)
    const snackbar = useSnackbar()
    expect(snackbar.items.value.length).toBeGreaterThan(0)
    expect(snackbar.items.value[0]!.message).toContain('Groceries')
  })

  it('undo restores the deleted expense', async () => {
    const store = useFinancesStore()
    store.addAdhocExpense({ amount: 50, description: 'Groceries', notes: '', dueDate: null })
    const wrapper = mountView()
    await wrapper.find('.btn-delete').trigger('click')
    const snackbar = useSnackbar()
    snackbar.undo(snackbar.items.value[0]!.id)
    expect(store.expenses).toHaveLength(1)
    expect(store.expenses[0]!.description).toBe('Groceries')
    expect(store.expenses[0]!.amount).toBe(50)
  })
})


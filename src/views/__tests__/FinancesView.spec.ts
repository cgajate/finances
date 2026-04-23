import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import FinancesView from '@/views/FinancesView.vue'
import FinancesListView from '@/views/FinancesListView.vue'
import { useFinancesStore } from '@/stores/finances'
import { useSnackbar } from '@/composables/useSnackbar'
import { formatDate } from '@/lib/formatDate'

function makeRouter(query: Record<string, string> = {}) {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      {
        path: '/finances',
        component: FinancesView,
        children: [
          { path: '', name: 'finances', component: FinancesListView },
          { path: 'income/add', component: { template: '<div />' } },
          { path: 'expenses/add', component: { template: '<div />' } },
          { path: 'income/:id/edit', component: { template: '<div />' } },
          { path: 'expenses/:id/edit', component: { template: '<div />' } },
        ],
      },
    ],
  })
  return router
}

describe('FinancesView', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    localStorage.clear()
    pinia = createPinia()
    setActivePinia(pinia)
    useSnackbar().dismissAll()
  })

  async function mountView(tab?: string) {
    const router = makeRouter()
    const path = tab ? `/finances?tab=${tab}` : '/finances'
    router.push(path)
    await router.isReady()
    return mount(FinancesView, {
      global: { plugins: [pinia, router] },
    })
  }

  it('renders the title', async () => {
    const wrapper = await mountView()
    expect(wrapper.find('h1').text()).toBe('Finances')
  })

  it('shows income tab active by default', async () => {
    const wrapper = await mountView()
    const tabs = wrapper.findAll('.tab-bar button')
    expect(tabs[0]!.classes()).toContain('active')
    expect(tabs[1]!.classes()).not.toContain('active')
  })

  it('shows expenses tab active when tab=expenses', async () => {
    const wrapper = await mountView('expenses')
    const tabs = wrapper.findAll('.tab-bar button')
    expect(tabs[0]!.classes()).not.toContain('active')
    expect(tabs[1]!.classes()).toContain('active')
  })

  it('switches to expenses tab on click', async () => {
    const wrapper = await mountView()
    const tabs = wrapper.findAll('.tab-bar button')
    await tabs[1]!.trigger('click')
    await flushPromises()
    expect(tabs[1]!.classes()).toContain('active')
    expect(wrapper.text()).toContain('All Expenses')
  })

  it('switches to income tab on click', async () => {
    const wrapper = await mountView('expenses')
    const tabs = wrapper.findAll('.tab-bar button')
    await tabs[0]!.trigger('click')
    await flushPromises()
    expect(tabs[0]!.classes()).toContain('active')
    expect(wrapper.text()).toContain('All Income')
  })

  // --- Income Tab ---

  it('renders Add Income button linking to /finances/income/add', async () => {
    const wrapper = await mountView()
    const addBtn = wrapper.find('.btn')
    expect(addBtn.exists()).toBe(true)
    expect(addBtn.text()).toContain('Add Income')
    expect(addBtn.attributes('href')).toBe('/finances/income/add')
  })

  it('shows empty message when no income', async () => {
    const wrapper = await mountView()
    expect(wrapper.text()).toContain('No income entries yet')
  })

  it('shows income items in list', async () => {
    const store = useFinancesStore()
    store.addRecurringIncome({
      amount: 3000,
      frequency: 'monthly',
      description: 'Salary',
      notes: 'Main',
      date: '2026-01-15',
    })
    const wrapper = await mountView()
    expect(wrapper.text()).toContain('Salary')
    expect(wrapper.text()).toContain('$3,000.00')
    expect(wrapper.text()).toContain('monthly')
  })

  it('shows adhoc income as one-time', async () => {
    const store = useFinancesStore()
    store.addAdhocIncome({ amount: 200, description: 'Freelance', date: '2026-03-01' })
    const wrapper = await mountView()
    expect(wrapper.text()).toContain('one-time')
  })

  it('shows edit and remove buttons for each income item', async () => {
    const store = useFinancesStore()
    store.addRecurringIncome({
      amount: 100,
      frequency: 'monthly',
      description: 'Test',
      notes: '',
      date: null,
    })
    const wrapper = await mountView()
    expect(wrapper.find('.btn-edit').exists()).toBe(true)
    expect(wrapper.find('.btn-delete').exists()).toBe(true)
  })

  it('removes income on Remove click', async () => {
    const store = useFinancesStore()
    store.addRecurringIncome({
      amount: 100,
      frequency: 'monthly',
      description: 'ToRemove',
      notes: '',
      date: null,
    })
    const wrapper = await mountView()
    expect(wrapper.text()).toContain('ToRemove')
    await wrapper.find('.btn-delete').trigger('click')
    expect(store.incomes).toHaveLength(0)
  })

  it('shows notes and date metadata for income', async () => {
    const store = useFinancesStore()
    store.addRecurringIncome({
      amount: 100,
      frequency: 'monthly',
      description: 'X',
      notes: 'Some note',
      date: '2026-06-01',
    })
    const wrapper = await mountView()
    expect(wrapper.text()).toContain('Some note')
    expect(wrapper.text()).toContain(formatDate('2026-06-01'))
  })

  it('shows FilterSortBar when income items exist', async () => {
    const store = useFinancesStore()
    store.addRecurringIncome({
      amount: 100,
      frequency: 'monthly',
      description: 'T',
      notes: '',
      date: null,
    })
    const wrapper = await mountView()
    expect(wrapper.findComponent({ name: 'FilterSortBar' }).exists()).toBe(true)
  })

  it('does not show FilterSortBar when no income items', async () => {
    const wrapper = await mountView()
    expect(wrapper.findComponent({ name: 'FilterSortBar' }).exists()).toBe(false)
  })

  it('shows search input when income items exist', async () => {
    const store = useFinancesStore()
    store.addRecurringIncome({
      amount: 100,
      frequency: 'monthly',
      description: 'T',
      notes: '',
      date: null,
    })
    const wrapper = await mountView()
    expect(wrapper.find('.search-input').exists()).toBe(true)
  })

  it('does not show search input when no income items', async () => {
    const wrapper = await mountView()
    expect(wrapper.find('.search-input').exists()).toBe(false)
  })

  it('filters income list by search query', async () => {
    const store = useFinancesStore()
    store.addRecurringIncome({
      amount: 5000,
      frequency: 'monthly',
      description: 'Salary',
      notes: '',
      date: null,
    })
    store.addAdhocIncome({ amount: 200, description: 'Freelance', date: '2026-01-01' })
    const wrapper = await mountView()
    expect(wrapper.findAll('.list-item')).toHaveLength(2)
    await wrapper.find('.search-input').setValue('Salary')
    expect(wrapper.findAll('.list-item')).toHaveLength(1)
    expect(wrapper.findAll('.list-item')[0]!.text()).toContain('Salary')
  })

  it('shows no-match message when income search has no results', async () => {
    const store = useFinancesStore()
    store.addRecurringIncome({
      amount: 100,
      frequency: 'monthly',
      description: 'Test',
      notes: '',
      date: null,
    })
    const wrapper = await mountView()
    await wrapper.find('.search-input').setValue('zzzznotfound')
    expect(wrapper.text()).toContain('No income matches "zzzznotfound"')
  })

  it('shows clear button when income search has text', async () => {
    const store = useFinancesStore()
    store.addRecurringIncome({
      amount: 100,
      frequency: 'monthly',
      description: 'Test',
      notes: '',
      date: null,
    })
    const wrapper = await mountView()
    expect(wrapper.find('.search-clear').exists()).toBe(false)
    await wrapper.find('.search-input').setValue('Test')
    expect(wrapper.find('.search-clear').exists()).toBe(true)
  })

  it('clears income search on clear button click', async () => {
    const store = useFinancesStore()
    store.addRecurringIncome({
      amount: 100,
      frequency: 'monthly',
      description: 'Test',
      notes: '',
      date: null,
    })
    store.addAdhocIncome({ amount: 200, description: 'Other', date: '2026-01-01' })
    const wrapper = await mountView()
    await wrapper.find('.search-input').setValue('Test')
    expect(wrapper.findAll('.list-item')).toHaveLength(1)
    await wrapper.find('.search-clear').trigger('click')
    expect(wrapper.findAll('.list-item')).toHaveLength(2)
  })

  it('shows snackbar with undo after removing income', async () => {
    const store = useFinancesStore()
    store.addRecurringIncome({
      amount: 3000,
      frequency: 'monthly',
      description: 'Salary',
      notes: '',
      date: null,
    })
    const wrapper = await mountView()
    await wrapper.find('.btn-delete').trigger('click')
    expect(store.incomes).toHaveLength(0)
    const snackbar = useSnackbar()
    expect(snackbar.items.value.length).toBeGreaterThan(0)
    expect(snackbar.items.value[0]!.message).toContain('Salary')
  })

  it('undo restores the deleted income', async () => {
    const store = useFinancesStore()
    store.addRecurringIncome({
      amount: 3000,
      frequency: 'monthly',
      description: 'Salary',
      notes: 'Main job',
      date: null,
    })
    const wrapper = await mountView()
    await wrapper.find('.btn-delete').trigger('click')
    expect(store.incomes).toHaveLength(0)
    const snackbar = useSnackbar()
    snackbar.undo(snackbar.items.value[0]!.id)
    expect(store.incomes).toHaveLength(1)
    expect(store.incomes[0]!.description).toBe('Salary')
    expect(store.incomes[0]!.amount).toBe(3000)
  })

  it('undo restores adhoc income correctly', async () => {
    const store = useFinancesStore()
    store.addAdhocIncome({ amount: 200, description: 'Freelance', date: '2026-03-01' })
    const wrapper = await mountView()
    await wrapper.find('.btn-delete').trigger('click')
    expect(store.incomes).toHaveLength(0)
    const snackbar = useSnackbar()
    snackbar.undo(snackbar.items.value[0]!.id)
    expect(store.incomes).toHaveLength(1)
    expect(store.incomes[0]!.description).toBe('Freelance')
  })

  it('shows category badge for income', async () => {
    const store = useFinancesStore()
    store.addRecurringIncome({
      amount: 100,
      frequency: 'monthly',
      description: 'T',
      notes: '',
      date: null,
      category: 'Salary',
    })
    const wrapper = await mountView()
    expect(wrapper.find('.cat-badge').exists()).toBe(true)
  })

  it('shows "Other" for income without category', async () => {
    const store = useFinancesStore()
    store.addRecurringIncome({
      amount: 100,
      frequency: 'monthly',
      description: 'T',
      notes: '',
      date: null,
    })
    const wrapper = await mountView()
    expect(wrapper.find('.cat-badge').text()).toBe('Other')
  })

  it('shows date for adhoc income in list', async () => {
    const store = useFinancesStore()
    store.addAdhocIncome({ amount: 200, description: 'Gift', date: '2026-05-10' })
    const wrapper = await mountView()
    expect(wrapper.text()).toContain(formatDate('2026-05-10'))
  })

  it('shows filter message when no income matches with active filter', async () => {
    const store = useFinancesStore()
    store.addAdhocIncome({ amount: 100, description: 'Test', date: '2026-01-01' })
    const wrapper = await mountView()
    const listVm = wrapper.findComponent(FinancesListView).vm as any
    listVm.income.toggleFilter('weekly')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('No income matches the current filter')
  })

  it('shows next due date for recurring income with a past date', async () => {
    const store = useFinancesStore()
    store.addRecurringIncome({
      amount: 3000,
      frequency: 'monthly',
      description: 'Salary',
      notes: '',
      date: '2025-01-15',
    })
    const wrapper = await mountView()
    expect(wrapper.text()).toContain('Next:')
    expect(wrapper.text()).not.toContain(formatDate('2025-01-15'))
  })

  it('shows original date for adhoc income', async () => {
    const store = useFinancesStore()
    store.addAdhocIncome({ amount: 200, description: 'Gift', date: '2026-05-10' })
    const wrapper = await mountView()
    expect(wrapper.text()).toContain(formatDate('2026-05-10'))
    expect(wrapper.text()).not.toContain('Next:')
  })

  it('shows createdAt for each income item', async () => {
    const store = useFinancesStore()
    store.addRecurringIncome({
      amount: 100,
      frequency: 'monthly',
      description: 'Test',
      notes: '',
      date: null,
    })
    const wrapper = await mountView()
    expect(wrapper.find('.list-item-created').exists()).toBe(true)
    expect(wrapper.find('.list-item-created').text()).toContain('Created')
  })

  // --- Expenses Tab ---

  it('renders Add Expense button on expenses tab', async () => {
    const wrapper = await mountView('expenses')
    const addBtn = wrapper.find('.btn')
    expect(addBtn.exists()).toBe(true)
    expect(addBtn.text()).toContain('Add Expense')
    expect(addBtn.attributes('href')).toBe('/finances/expenses/add')
  })

  it('shows empty message when no expenses', async () => {
    const wrapper = await mountView('expenses')
    expect(wrapper.text()).toContain('No expense entries yet')
  })

  it('shows expense items in list', async () => {
    const store = useFinancesStore()
    store.addRecurringExpense({
      amount: 1500,
      frequency: 'monthly',
      description: 'Rent',
      notes: 'Apt',
      dueDate: '2026-01-01',
    })
    const wrapper = await mountView('expenses')
    expect(wrapper.text()).toContain('Rent')
    expect(wrapper.text()).toContain('$1,500.00')
    expect(wrapper.text()).toContain('monthly')
  })

  it('shows adhoc expense as one-time', async () => {
    const store = useFinancesStore()
    store.addAdhocExpense({ amount: 300, description: 'Car fix', notes: '', dueDate: null })
    const wrapper = await mountView('expenses')
    expect(wrapper.text()).toContain('one-time')
  })

  it('shows due date and notes metadata for expense', async () => {
    const store = useFinancesStore()
    store.addRecurringExpense({
      amount: 100,
      frequency: 'monthly',
      description: 'X',
      notes: 'A note',
      dueDate: '2026-05-01',
    })
    const wrapper = await mountView('expenses')
    expect(wrapper.text()).toContain(formatDate('2026-05-01'))
    expect(wrapper.text()).toContain('A note')
  })

  it('shows edit and remove buttons for expense', async () => {
    const store = useFinancesStore()
    store.addAdhocExpense({ amount: 50, description: 'Test', notes: '', dueDate: null })
    const wrapper = await mountView('expenses')
    expect(wrapper.find('.btn-edit').exists()).toBe(true)
    expect(wrapper.find('.btn-delete').exists()).toBe(true)
  })

  it('removes expense on Remove click', async () => {
    const store = useFinancesStore()
    store.addAdhocExpense({ amount: 50, description: 'Gone', notes: '', dueDate: null })
    const wrapper = await mountView('expenses')
    await wrapper.find('.btn-delete').trigger('click')
    expect(store.expenses).toHaveLength(0)
  })

  it('shows FilterSortBar when expense items exist', async () => {
    const store = useFinancesStore()
    store.addAdhocExpense({ amount: 50, description: 'T', notes: '', dueDate: null })
    const wrapper = await mountView('expenses')
    expect(wrapper.findComponent({ name: 'FilterSortBar' }).exists()).toBe(true)
  })

  it('shows assigned-to badge when expense has assignedTo', async () => {
    const store = useFinancesStore()
    store.addRecurringExpense({
      amount: 100,
      frequency: 'monthly',
      description: 'Rent',
      notes: '',
      dueDate: null,
      assignedTo: 'Dad',
    })
    const wrapper = await mountView('expenses')
    expect(wrapper.find('.assigned-badge').exists()).toBe(true)
    expect(wrapper.text()).toContain('Dad')
  })

  it('does not show assigned-to badge when assignedTo is empty', async () => {
    const store = useFinancesStore()
    store.addRecurringExpense({
      amount: 100,
      frequency: 'monthly',
      description: 'Rent',
      notes: '',
      dueDate: null,
    })
    const wrapper = await mountView('expenses')
    expect(wrapper.find('.assigned-badge').exists()).toBe(false)
  })

  it('shows search input when expense items exist', async () => {
    const store = useFinancesStore()
    store.addAdhocExpense({ amount: 50, description: 'T', notes: '', dueDate: null })
    const wrapper = await mountView('expenses')
    expect(wrapper.find('.search-input').exists()).toBe(true)
  })

  it('does not show search input when no expense items', async () => {
    const wrapper = await mountView('expenses')
    expect(wrapper.find('.search-input').exists()).toBe(false)
  })

  it('filters expense list by search query', async () => {
    const store = useFinancesStore()
    store.addRecurringExpense({
      amount: 1500,
      frequency: 'monthly',
      description: 'Rent',
      notes: '',
      dueDate: null,
    })
    store.addAdhocExpense({ amount: 75, description: 'Grocery', notes: '', dueDate: null })
    const wrapper = await mountView('expenses')
    expect(wrapper.findAll('.list-item')).toHaveLength(2)
    await wrapper.find('.search-input').setValue('Rent')
    expect(wrapper.findAll('.list-item')).toHaveLength(1)
    expect(wrapper.text()).toContain('Rent')
    expect(wrapper.text()).not.toContain('Grocery')
  })

  it('shows no-match message when expense search has no results', async () => {
    const store = useFinancesStore()
    store.addAdhocExpense({ amount: 50, description: 'Test', notes: '', dueDate: null })
    const wrapper = await mountView('expenses')
    await wrapper.find('.search-input').setValue('zzzznotfound')
    expect(wrapper.text()).toContain('No expenses match "zzzznotfound"')
  })

  it('clears expense search on clear button click', async () => {
    const store = useFinancesStore()
    store.addAdhocExpense({ amount: 50, description: 'Test', notes: '', dueDate: null })
    store.addAdhocExpense({ amount: 100, description: 'Other', notes: '', dueDate: null })
    const wrapper = await mountView('expenses')
    await wrapper.find('.search-input').setValue('Test')
    expect(wrapper.findAll('.list-item')).toHaveLength(1)
    await wrapper.find('.search-clear').trigger('click')
    expect(wrapper.findAll('.list-item')).toHaveLength(2)
  })

  it('searches expenses by assignedTo field', async () => {
    const store = useFinancesStore()
    store.addRecurringExpense({
      amount: 100,
      frequency: 'monthly',
      description: 'Electric',
      notes: '',
      dueDate: null,
      assignedTo: 'Dad',
    })
    store.addRecurringExpense({
      amount: 200,
      frequency: 'monthly',
      description: 'Water',
      notes: '',
      dueDate: null,
      assignedTo: 'Mom',
    })
    const wrapper = await mountView('expenses')
    await wrapper.find('.search-input').setValue('Dad')
    expect(wrapper.findAll('.list-item')).toHaveLength(1)
    expect(wrapper.text()).toContain('Electric')
  })

  it('shows snackbar with undo after removing expense', async () => {
    const store = useFinancesStore()
    store.addAdhocExpense({ amount: 50, description: 'Groceries', notes: '', dueDate: null })
    const wrapper = await mountView('expenses')
    await wrapper.find('.btn-delete').trigger('click')
    expect(store.expenses).toHaveLength(0)
    const snackbar = useSnackbar()
    expect(snackbar.items.value.length).toBeGreaterThan(0)
    expect(snackbar.items.value[0]!.message).toContain('Groceries')
  })

  it('undo restores the deleted expense', async () => {
    const store = useFinancesStore()
    store.addAdhocExpense({ amount: 50, description: 'Groceries', notes: '', dueDate: null })
    const wrapper = await mountView('expenses')
    await wrapper.find('.btn-delete').trigger('click')
    const snackbar = useSnackbar()
    snackbar.undo(snackbar.items.value[0]!.id)
    expect(store.expenses).toHaveLength(1)
    expect(store.expenses[0]!.description).toBe('Groceries')
    expect(store.expenses[0]!.amount).toBe(50)
  })

  it('undo restores a deleted recurring expense', async () => {
    const store = useFinancesStore()
    store.addRecurringExpense({
      amount: 100,
      frequency: 'monthly',
      description: 'Internet',
      notes: 'ISP',
      dueDate: '2026-05-01',
      assignedTo: 'Dad',
    })
    const wrapper = await mountView('expenses')
    await wrapper.find('.btn-delete').trigger('click')
    expect(store.expenses).toHaveLength(0)
    const snackbar = useSnackbar()
    snackbar.undo(snackbar.items.value[0]!.id)
    expect(store.expenses).toHaveLength(1)
    expect(store.expenses[0]!.description).toBe('Internet')
  })

  it('shows category badge for expenses', async () => {
    const store = useFinancesStore()
    store.addAdhocExpense({
      amount: 50,
      description: 'Test',
      notes: '',
      dueDate: null,
      category: 'Food',
    })
    const wrapper = await mountView('expenses')
    expect(wrapper.find('.cat-badge').text()).toBe('Food')
  })

  it('shows "Other" for expense without category', async () => {
    const store = useFinancesStore()
    store.addAdhocExpense({ amount: 50, description: 'Test', notes: '', dueDate: null })
    const wrapper = await mountView('expenses')
    expect(wrapper.find('.cat-badge').text()).toBe('Other')
  })

  it('shows filter message when expense filters active but nothing matches', async () => {
    const store = useFinancesStore()
    store.addAdhocExpense({ amount: 50, description: 'Test', notes: '', dueDate: null })
    const wrapper = await mountView('expenses')
    const listVm = wrapper.findComponent(FinancesListView).vm as any
    listVm.expenseSearchQuery = ''
    listVm.expense.toggleFilter('weekly')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('No expenses match the current filter')
  })

  it('shows next due date for recurring expense with a past date', async () => {
    const store = useFinancesStore()
    store.addRecurringExpense({
      amount: 1500,
      frequency: 'monthly',
      description: 'Rent',
      notes: '',
      dueDate: '2025-01-01',
    })
    const wrapper = await mountView('expenses')
    expect(wrapper.text()).toContain('Next due:')
    expect(wrapper.text()).not.toContain(formatDate('2025-01-01'))
  })

  it('shows original due date for adhoc expense', async () => {
    const store = useFinancesStore()
    store.addAdhocExpense({
      amount: 300,
      description: 'Car fix',
      notes: '',
      dueDate: '2026-06-15',
    })
    const wrapper = await mountView('expenses')
    expect(wrapper.text()).toContain('Due: ' + formatDate('2026-06-15'))
    expect(wrapper.text()).not.toContain('Next due:')
  })

  it('shows createdAt for each expense item', async () => {
    const store = useFinancesStore()
    store.addAdhocExpense({ amount: 50, description: 'Test', notes: '', dueDate: null })
    const wrapper = await mountView('expenses')
    expect(wrapper.find('.list-item-created').exists()).toBe(true)
    expect(wrapper.find('.list-item-created').text()).toContain('Created')
  })

  it('shows assignedTo in created line for expense', async () => {
    const store = useFinancesStore()
    store.addRecurringExpense({
      amount: 100,
      frequency: 'monthly',
      description: 'Electric',
      notes: '',
      dueDate: null,
      assignedTo: 'Dad',
    })
    const wrapper = await mountView('expenses')
    expect(wrapper.find('.list-item-created').text()).toContain('by Dad')
  })

  it('deleteIncome does nothing for non-existent id', async () => {
    const store = useFinancesStore()
    store.addRecurringIncome({
      amount: 100,
      frequency: 'monthly',
      description: 'Test',
      notes: '',
      date: null,
    })
    const wrapper = await mountView()
    // Remove the item from store directly
    const id = store.incomes[0]!.id
    store.removeIncome(id)
    // Call deleteIncome with invalid id (via vm) - should not crash
    const listVm = wrapper.findComponent(FinancesListView).vm as any
    listVm.deleteIncome('nonexistent')
    expect(store.incomes).toHaveLength(0)
  })

  it('deleteExpense does nothing for non-existent id', async () => {
    const store = useFinancesStore()
    store.addAdhocExpense({ amount: 50, description: 'Test', notes: '', dueDate: null })
    const id = store.expenses[0]!.id
    store.removeExpense(id)
    const wrapper = await mountView('expenses')
    const listVm = wrapper.findComponent(FinancesListView).vm as any
    listVm.deleteExpense('nonexistent')
    expect(store.expenses).toHaveLength(0)
  })

  it('watches route query and updates tab', async () => {
    const router = makeRouter()
    router.push('/finances?tab=income')
    await router.isReady()
    const wrapper = mount(FinancesView, {
      global: { plugins: [pinia, router] },
    })
    expect((wrapper.vm as any).activeTab).toBe('income')
    await router.push('/finances?tab=expenses')
    expect((wrapper.vm as any).activeTab).toBe('expenses')
  })
})


import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import IncomeView from '@/views/IncomeView.vue'
import { useFinancesStore } from '@/stores/finances'
import { useSnackbar } from '@/composables/useSnackbar'
import { formatDate } from '@/lib/formatDate'

function makeRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/income', component: IncomeView },
      { path: '/income/add', component: { template: '<div />' } },
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
    useSnackbar().dismissAll()
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

  it('renders Add Income button linking to /income/add', () => {
    const wrapper = mountView()
    const addBtn = wrapper.find('.btn')
    expect(addBtn.exists()).toBe(true)
    expect(addBtn.text()).toContain('Add Income')
    expect(addBtn.attributes('href')).toBe('/income/add')
  })

  it('shows empty message when no income', () => {
    const wrapper = mountView()
    expect(wrapper.text()).toContain('No income entries yet')
  })

  it('shows income items in list', () => {
    const store = useFinancesStore()
    store.addRecurringIncome({
      amount: 3000,
      frequency: 'monthly',
      description: 'Salary',
      notes: 'Main',
      date: '2026-01-15',
    })
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
    store.addRecurringIncome({
      amount: 100,
      frequency: 'monthly',
      description: 'Test',
      notes: '',
      date: null,
    })
    const wrapper = mountView()
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
    const wrapper = mountView()
    expect(wrapper.text()).toContain('ToRemove')
    await wrapper.find('.btn-delete').trigger('click')
    expect(store.incomes).toHaveLength(0)
  })

  it('shows notes and date metadata', () => {
    const store = useFinancesStore()
    store.addRecurringIncome({
      amount: 100,
      frequency: 'monthly',
      description: 'X',
      notes: 'Some note',
      date: '2026-06-01',
    })
    const wrapper = mountView()
    expect(wrapper.text()).toContain('Some note')
    expect(wrapper.text()).toContain(formatDate('2026-06-01'))
  })

  it('shows FilterSortBar when items exist', () => {
    const store = useFinancesStore()
    store.addRecurringIncome({
      amount: 100,
      frequency: 'monthly',
      description: 'T',
      notes: '',
      date: null,
    })
    const wrapper = mountView()
    expect(wrapper.findComponent({ name: 'FilterSortBar' }).exists()).toBe(true)
  })

  it('does not show FilterSortBar when no items', () => {
    const wrapper = mountView()
    expect(wrapper.findComponent({ name: 'FilterSortBar' }).exists()).toBe(false)
  })

  it('shows search input when items exist', () => {
    const store = useFinancesStore()
    store.addRecurringIncome({
      amount: 100,
      frequency: 'monthly',
      description: 'T',
      notes: '',
      date: null,
    })
    const wrapper = mountView()
    expect(wrapper.find('.search-input').exists()).toBe(true)
  })

  it('does not show search input when no items', () => {
    const wrapper = mountView()
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
    const wrapper = mountView()
    expect(wrapper.findAll('.list-item')).toHaveLength(2)
    await wrapper.find('.search-input').setValue('Salary')
    expect(wrapper.findAll('.list-item')).toHaveLength(1)
    expect(wrapper.findAll('.list-item')[0]!.text()).toContain('Salary')
  })

  it('shows no-match message when search has no results', async () => {
    const store = useFinancesStore()
    store.addRecurringIncome({
      amount: 100,
      frequency: 'monthly',
      description: 'Test',
      notes: '',
      date: null,
    })
    const wrapper = mountView()
    await wrapper.find('.search-input').setValue('zzzznotfound')
    expect(wrapper.text()).toContain('No income matches "zzzznotfound"')
  })

  it('shows clear button when search has text', async () => {
    const store = useFinancesStore()
    store.addRecurringIncome({
      amount: 100,
      frequency: 'monthly',
      description: 'Test',
      notes: '',
      date: null,
    })
    const wrapper = mountView()
    expect(wrapper.find('.search-clear').exists()).toBe(false)
    await wrapper.find('.search-input').setValue('Test')
    expect(wrapper.find('.search-clear').exists()).toBe(true)
  })

  it('clears search on clear button click', async () => {
    const store = useFinancesStore()
    store.addRecurringIncome({
      amount: 100,
      frequency: 'monthly',
      description: 'Test',
      notes: '',
      date: null,
    })
    store.addAdhocIncome({ amount: 200, description: 'Other', date: '2026-01-01' })
    const wrapper = mountView()
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
    const wrapper = mountView()
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
    const wrapper = mountView()
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
    const wrapper = mountView()
    await wrapper.find('.btn-delete').trigger('click')
    expect(store.incomes).toHaveLength(0)
    const snackbar = useSnackbar()
    snackbar.undo(snackbar.items.value[0]!.id)
    expect(store.incomes).toHaveLength(1)
    expect(store.incomes[0]!.description).toBe('Freelance')
  })

  it('shows category badge', () => {
    const store = useFinancesStore()
    store.addRecurringIncome({
      amount: 100,
      frequency: 'monthly',
      description: 'T',
      notes: '',
      date: null,
      category: 'Salary',
    })
    const wrapper = mountView()
    expect(wrapper.find('.cat-badge').exists()).toBe(true)
  })

  it('shows "Other" for income without category', () => {
    const store = useFinancesStore()
    store.addRecurringIncome({
      amount: 100,
      frequency: 'monthly',
      description: 'T',
      notes: '',
      date: null,
    })
    const wrapper = mountView()
    expect(wrapper.find('.cat-badge').text()).toBe('Other')
  })

  it('shows date for adhoc income in list', () => {
    const store = useFinancesStore()
    store.addAdhocIncome({ amount: 200, description: 'Gift', date: '2026-05-10' })
    const wrapper = mountView()
    expect(wrapper.text()).toContain(formatDate('2026-05-10'))
  })

  it('shows filter message when no matches with active filter', async () => {
    const store = useFinancesStore()
    store.addAdhocIncome({ amount: 100, description: 'Test', date: '2026-01-01' })
    const wrapper = mountView()
    const vm = wrapper.vm as any
    vm.toggleFilter('weekly')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('No income matches the current filter')
  })

  it('shows next due date for recurring income with a past date', () => {
    const store = useFinancesStore()
    store.addRecurringIncome({
      amount: 3000,
      frequency: 'monthly',
      description: 'Salary',
      notes: '',
      date: '2025-01-15',
    })
    const wrapper = mountView()
    // Should show "Next:" with a future date, not the original 2025-01-15
    expect(wrapper.text()).toContain('Next:')
    expect(wrapper.text()).not.toContain(formatDate('2025-01-15'))
  })

  it('shows original date for adhoc income', () => {
    const store = useFinancesStore()
    store.addAdhocIncome({ amount: 200, description: 'Gift', date: '2026-05-10' })
    const wrapper = mountView()
    expect(wrapper.text()).toContain(formatDate('2026-05-10'))
    expect(wrapper.text()).not.toContain('Next:')
  })

  it('shows createdAt for each item', () => {
    const store = useFinancesStore()
    store.addRecurringIncome({
      amount: 100,
      frequency: 'monthly',
      description: 'Test',
      notes: '',
      date: null,
    })
    const wrapper = mountView()
    expect(wrapper.find('.list-item-created').exists()).toBe(true)
    expect(wrapper.find('.list-item-created').text()).toContain('Created')
  })
})

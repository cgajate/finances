import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import IncomeView from '@/views/IncomeView.vue'
import { useFinancesStore } from '@/stores/finances'
import { useSnackbar } from '@/composables/useSnackbar'

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

  it('shows search input when items exist', () => {
    const store = useFinancesStore()
    store.addRecurringIncome({ amount: 100, frequency: 'monthly', description: 'T', notes: '', date: null })
    const wrapper = mountView()
    expect(wrapper.find('.search-input').exists()).toBe(true)
  })

  it('does not show search input when no items', () => {
    const wrapper = mountView()
    expect(wrapper.find('.search-input').exists()).toBe(false)
  })

  it('filters income list by search query', async () => {
    const store = useFinancesStore()
    store.addRecurringIncome({ amount: 5000, frequency: 'monthly', description: 'Salary', notes: '', date: null })
    store.addAdhocIncome({ amount: 200, description: 'Freelance', date: '2026-01-01' })
    const wrapper = mountView()
    expect(wrapper.findAll('.list-item')).toHaveLength(2)
    await wrapper.find('.search-input').setValue('Salary')
    expect(wrapper.findAll('.list-item')).toHaveLength(1)
    expect(wrapper.findAll('.list-item')[0]!.text()).toContain('Salary')
  })

  it('shows no-match message when search has no results', async () => {
    const store = useFinancesStore()
    store.addRecurringIncome({ amount: 100, frequency: 'monthly', description: 'Test', notes: '', date: null })
    const wrapper = mountView()
    await wrapper.find('.search-input').setValue('zzzznotfound')
    expect(wrapper.text()).toContain('No income matches "zzzznotfound"')
  })

  it('shows clear button when search has text', async () => {
    const store = useFinancesStore()
    store.addRecurringIncome({ amount: 100, frequency: 'monthly', description: 'Test', notes: '', date: null })
    const wrapper = mountView()
    expect(wrapper.find('.search-clear').exists()).toBe(false)
    await wrapper.find('.search-input').setValue('Test')
    expect(wrapper.find('.search-clear').exists()).toBe(true)
  })

  it('clears search on clear button click', async () => {
    const store = useFinancesStore()
    store.addRecurringIncome({ amount: 100, frequency: 'monthly', description: 'Test', notes: '', date: null })
    store.addAdhocIncome({ amount: 200, description: 'Other', date: '2026-01-01' })
    const wrapper = mountView()
    await wrapper.find('.search-input').setValue('Test')
    expect(wrapper.findAll('.list-item')).toHaveLength(1)
    await wrapper.find('.search-clear').trigger('click')
    expect(wrapper.findAll('.list-item')).toHaveLength(2)
  })

  it('shows snackbar with undo after removing income', async () => {
    const store = useFinancesStore()
    store.addRecurringIncome({ amount: 3000, frequency: 'monthly', description: 'Salary', notes: '', date: null })
    const wrapper = mountView()
    await wrapper.find('.btn-delete').trigger('click')
    expect(store.incomes).toHaveLength(0)
    const snackbar = useSnackbar()
    expect(snackbar.items.value.length).toBeGreaterThan(0)
    expect(snackbar.items.value[0]!.message).toContain('Salary')
  })

  it('undo restores the deleted income', async () => {
    const store = useFinancesStore()
    store.addRecurringIncome({ amount: 3000, frequency: 'monthly', description: 'Salary', notes: 'Main job', date: null })
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

  it('submits recurring income form successfully', async () => {
    const store = useFinancesStore()
    const wrapper = mountView()
    const vm = wrapper.vm as any
    vm.rDescription = 'Salary'
    vm.rAmount = 5000
    vm.rFrequency = 'monthly'
    vm.rNotes = 'Main job'
    vm.rDate = '2026-06-01'
    vm.rCategory = 'Salary'
    await wrapper.find('form').trigger('submit')
    expect(store.incomes).toHaveLength(1)
    expect(store.incomes[0]!.description).toBe('Salary')
  })

  it('does not submit recurring form without description', async () => {
    const store = useFinancesStore()
    const wrapper = mountView()
    const vm = wrapper.vm as any
    vm.rAmount = 100
    vm.rDescription = ''
    await wrapper.find('form').trigger('submit')
    expect(store.incomes).toHaveLength(0)
  })

  it('does not submit recurring form without amount', async () => {
    const store = useFinancesStore()
    const wrapper = mountView()
    const vm = wrapper.vm as any
    vm.rDescription = 'Test'
    vm.rAmount = null
    await wrapper.find('form').trigger('submit')
    expect(store.incomes).toHaveLength(0)
  })

  it('does not submit recurring yearly without date', async () => {
    const store = useFinancesStore()
    const wrapper = mountView()
    const vm = wrapper.vm as any
    vm.rDescription = 'Annual'
    vm.rAmount = 100
    vm.rFrequency = 'yearly'
    vm.rDate = ''
    await wrapper.find('form').trigger('submit')
    expect(store.incomes).toHaveLength(0)
  })

  it('resets form fields after successful recurring submit', async () => {
    const wrapper = mountView()
    const vm = wrapper.vm as any
    vm.rDescription = 'Salary'
    vm.rAmount = 5000
    vm.rFrequency = 'quarterly'
    vm.rNotes = 'note'
    vm.rDate = '2026-06-01'
    vm.rCategory = 'Salary'
    await wrapper.find('form').trigger('submit')
    expect(vm.rDescription).toBe('')
    expect(vm.rNotes).toBe('')
    expect(vm.rDate).toBe('')
    expect(vm.rFrequency).toBe('monthly')
    expect(vm.rCategory).toBe('Other')
  })

  it('submits adhoc income form successfully', async () => {
    const store = useFinancesStore()
    const wrapper = mountView()
    await wrapper.findAll('.tabs button')[1]!.trigger('click')
    const vm = wrapper.vm as any
    vm.aDescription = 'Freelance'
    vm.aAmount = 500
    vm.aDate = '2026-05-01'
    vm.aCategory = 'Freelance'
    await wrapper.find('form').trigger('submit')
    expect(store.incomes).toHaveLength(1)
    expect(store.incomes[0]!.description).toBe('Freelance')
  })

  it('does not submit adhoc form without date', async () => {
    const store = useFinancesStore()
    const wrapper = mountView()
    await wrapper.findAll('.tabs button')[1]!.trigger('click')
    const vm = wrapper.vm as any
    vm.aDescription = 'Test'
    vm.aAmount = 100
    vm.aDate = ''
    await wrapper.find('form').trigger('submit')
    expect(store.incomes).toHaveLength(0)
  })

  it('does not submit adhoc form without description', async () => {
    const store = useFinancesStore()
    const wrapper = mountView()
    await wrapper.findAll('.tabs button')[1]!.trigger('click')
    const vm = wrapper.vm as any
    vm.aAmount = 100
    vm.aDescription = ''
    vm.aDate = '2026-05-01'
    await wrapper.find('form').trigger('submit')
    expect(store.incomes).toHaveLength(0)
  })

  it('resets form fields after successful adhoc submit', async () => {
    const wrapper = mountView()
    await wrapper.findAll('.tabs button')[1]!.trigger('click')
    const vm = wrapper.vm as any
    vm.aDescription = 'Gift'
    vm.aAmount = 200
    vm.aDate = '2026-05-01'
    vm.aCategory = 'Gifts'
    await wrapper.find('form').trigger('submit')
    expect(vm.aDescription).toBe('')
    expect(vm.aDate).toBe('')
    expect(vm.aCategory).toBe('Other')
  })

  it('shows category badge', () => {
    const store = useFinancesStore()
    store.addRecurringIncome({ amount: 100, frequency: 'monthly', description: 'T', notes: '', date: null, category: 'Salary' })
    const wrapper = mountView()
    expect(wrapper.find('.cat-badge').exists()).toBe(true)
  })

  it('shows "Other" for income without category', () => {
    const store = useFinancesStore()
    store.addRecurringIncome({ amount: 100, frequency: 'monthly', description: 'T', notes: '', date: null })
    const wrapper = mountView()
    expect(wrapper.find('.cat-badge').text()).toBe('Other')
  })

  it('shows date for adhoc income in list', () => {
    const store = useFinancesStore()
    store.addAdhocIncome({ amount: 200, description: 'Gift', date: '2026-05-10' })
    const wrapper = mountView()
    expect(wrapper.text()).toContain('2026-05-10')
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
})

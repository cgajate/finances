import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import AddExpenseView from '@/views/AddExpenseView.vue'
import { useFinancesStore } from '@/stores/finances'
import { useSnackbar } from '@/composables/useSnackbar'

function makeRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/finances', component: { template: '<div />' } },
      { path: '/finances/expenses/add', component: AddExpenseView },
    ],
  })
}

describe('AddExpenseView', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    localStorage.clear()
    pinia = createPinia()
    setActivePinia(pinia)
    useSnackbar().dismissAll()
  })

  function mountView() {
    const router = makeRouter()
    return mount(AddExpenseView, {
      global: { plugins: [pinia, router] },
    })
  }

  it('renders the title', () => {
    const wrapper = mountView()
    expect(wrapper.find('h1').text()).toBe('Add Expense')
  })

  it('renders a back button', () => {
    const wrapper = mountView()
    const backBtn = wrapper.find('.btn-back')
    expect(backBtn.exists()).toBe(true)
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
    expect(wrapper.text()).toContain('Add Ad-hoc Expense')
  })

  it('shows recurring form fields', () => {
    const wrapper = mountView()
    expect(wrapper.text()).toContain('Description')
    expect(wrapper.text()).toContain('Amount')
    expect(wrapper.text()).toContain('Frequency')
    expect(wrapper.text()).toContain('Due Date')
    expect(wrapper.text()).toContain('Notes')
    expect(wrapper.text()).toContain('Assigned To')
    expect(wrapper.find('.btn-submit').text()).toContain('Add Recurring Expense')
  })

  it('shows adhoc form with correct submit button', async () => {
    const wrapper = mountView()
    await wrapper.findAll('.tabs button')[1]!.trigger('click')
    expect(wrapper.find('.btn-submit').text()).toContain('Add Ad-hoc Expense')
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

  it('submits recurring expense form successfully', async () => {
    const store = useFinancesStore()
    const wrapper = mountView()
    const vm = wrapper.vm as any
    vm.rDescription = 'Rent'
    vm.rAmount = 1500
    vm.rFrequency = 'monthly'
    vm.rCategory = 'Housing'
    vm.rNotes = 'Apartment'
    vm.rDueDate = '2026-06-01'
    vm.rAssignedTo = 'Dad'
    await wrapper.find('form').trigger('submit')
    expect(store.expenses).toHaveLength(1)
    expect(store.expenses[0]!.description).toBe('Rent')
  })

  it('shows snackbar after successful recurring submit', async () => {
    const wrapper = mountView()
    const vm = wrapper.vm as any
    vm.rDescription = 'Rent'
    vm.rAmount = 1500
    vm.rFrequency = 'monthly'
    await wrapper.find('form').trigger('submit')
    const snackbar = useSnackbar()
    expect(snackbar.items.value.length).toBeGreaterThan(0)
    expect(snackbar.items.value[0]!.message).toContain('Rent')
  })

  it('does not submit recurring form without description', async () => {
    const store = useFinancesStore()
    const wrapper = mountView()
    const vm = wrapper.vm as any
    vm.rAmount = 100
    vm.rDescription = ''
    await wrapper.find('form').trigger('submit')
    expect(store.expenses).toHaveLength(0)
  })

  it('does not submit recurring form without amount', async () => {
    const store = useFinancesStore()
    const wrapper = mountView()
    const vm = wrapper.vm as any
    vm.rDescription = 'Test'
    vm.rAmount = null
    await wrapper.find('form').trigger('submit')
    expect(store.expenses).toHaveLength(0)
  })

  it('does not submit recurring yearly without dueDate', async () => {
    const store = useFinancesStore()
    const wrapper = mountView()
    const vm = wrapper.vm as any
    vm.rDescription = 'Annual'
    vm.rAmount = 100
    vm.rFrequency = 'yearly'
    vm.rDueDate = ''
    await wrapper.find('form').trigger('submit')
    expect(store.expenses).toHaveLength(0)
  })

  it('resets form fields after successful recurring submit', async () => {
    const wrapper = mountView()
    const vm = wrapper.vm as any
    vm.rDescription = 'Rent'
    vm.rAmount = 1500
    vm.rFrequency = 'quarterly'
    vm.rNotes = 'note'
    vm.rDueDate = '2026-06-01'
    vm.rCategory = 'Housing'
    vm.rAssignedTo = 'Dad'
    await wrapper.find('form').trigger('submit')
    expect(vm.rDescription).toBe('')
    expect(vm.rNotes).toBe('')
    expect(vm.rDueDate).toBe('')
    expect(vm.rFrequency).toBe('monthly')
    expect(vm.rCategory).toBe('Other')
    expect(vm.rAssignedTo).toBe('')
  })

  it('submits adhoc expense form successfully', async () => {
    const store = useFinancesStore()
    const wrapper = mountView()
    await wrapper.findAll('.tabs button')[1]!.trigger('click')
    const vm = wrapper.vm as any
    vm.aDescription = 'Car repair'
    vm.aAmount = 300
    vm.aCategory = 'Transport'
    vm.aNotes = 'Brakes'
    vm.aDueDate = '2026-05-15'
    vm.aAssignedTo = 'Mom'
    await wrapper.find('form').trigger('submit')
    expect(store.expenses).toHaveLength(1)
    expect(store.expenses[0]!.description).toBe('Car repair')
  })

  it('shows snackbar after successful adhoc submit', async () => {
    const wrapper = mountView()
    await wrapper.findAll('.tabs button')[1]!.trigger('click')
    const vm = wrapper.vm as any
    vm.aDescription = 'Groceries'
    vm.aAmount = 50
    await wrapper.find('form').trigger('submit')
    const snackbar = useSnackbar()
    expect(snackbar.items.value.length).toBeGreaterThan(0)
    expect(snackbar.items.value[0]!.message).toContain('Groceries')
  })

  it('does not submit adhoc form without description', async () => {
    const store = useFinancesStore()
    const wrapper = mountView()
    await wrapper.findAll('.tabs button')[1]!.trigger('click')
    const vm = wrapper.vm as any
    vm.aAmount = 100
    vm.aDescription = ''
    await wrapper.find('form').trigger('submit')
    expect(store.expenses).toHaveLength(0)
  })

  it('does not submit adhoc form without amount', async () => {
    const store = useFinancesStore()
    const wrapper = mountView()
    await wrapper.findAll('.tabs button')[1]!.trigger('click')
    const vm = wrapper.vm as any
    vm.aDescription = 'Test'
    vm.aAmount = null
    await wrapper.find('form').trigger('submit')
    expect(store.expenses).toHaveLength(0)
  })

  it('resets form fields after successful adhoc submit', async () => {
    const wrapper = mountView()
    await wrapper.findAll('.tabs button')[1]!.trigger('click')
    const vm = wrapper.vm as any
    vm.aDescription = 'Fix'
    vm.aAmount = 200
    vm.aNotes = 'note'
    vm.aDueDate = '2026-05-01'
    vm.aCategory = 'Housing'
    vm.aAssignedTo = 'Mom'
    await wrapper.find('form').trigger('submit')
    expect(vm.aDescription).toBe('')
    expect(vm.aNotes).toBe('')
    expect(vm.aDueDate).toBe('')
    expect(vm.aCategory).toBe('Other')
    expect(vm.aAssignedTo).toBe('')
  })
})


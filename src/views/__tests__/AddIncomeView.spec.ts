import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import AddIncomeView from '@/views/AddIncomeView.vue'
import { useFinancesStore } from '@/stores/finances'
import { useSnackbar } from '@/composables/useSnackbar'

function makeRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/income', component: { template: '<div />' } },
      { path: '/income/add', component: AddIncomeView },
    ],
  })
}

describe('AddIncomeView', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    localStorage.clear()
    pinia = createPinia()
    setActivePinia(pinia)
    useSnackbar().dismissAll()
  })

  function mountView() {
    const router = makeRouter()
    return mount(AddIncomeView, {
      global: { plugins: [pinia, router] },
    })
  }

  it('renders the title', () => {
    const wrapper = mountView()
    expect(wrapper.find('h1').text()).toBe('Add Income')
  })

  it('renders a back button', () => {
    const wrapper = mountView()
    const backBtn = wrapper.find('.btn-back')
    expect(backBtn.exists()).toBe(true)
    expect(backBtn.text()).toContain('Back')
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
    expect(wrapper.text()).toContain('Add Ad-hoc Income')
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

  it('shows snackbar after successful recurring submit', async () => {
    const wrapper = mountView()
    const vm = wrapper.vm as any
    vm.rDescription = 'Salary'
    vm.rAmount = 5000
    vm.rFrequency = 'monthly'
    await wrapper.find('form').trigger('submit')
    const snackbar = useSnackbar()
    expect(snackbar.items.value.length).toBeGreaterThan(0)
    expect(snackbar.items.value[0]!.message).toContain('Salary')
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

  it('shows snackbar after successful adhoc submit', async () => {
    const wrapper = mountView()
    await wrapper.findAll('.tabs button')[1]!.trigger('click')
    const vm = wrapper.vm as any
    vm.aDescription = 'Gift'
    vm.aAmount = 200
    vm.aDate = '2026-05-01'
    await wrapper.find('form').trigger('submit')
    const snackbar = useSnackbar()
    expect(snackbar.items.value.length).toBeGreaterThan(0)
    expect(snackbar.items.value[0]!.message).toContain('Gift')
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
    vm.aCategory = 'Gift'
    await wrapper.find('form').trigger('submit')
    expect(vm.aDescription).toBe('')
    expect(vm.aDate).toBe('')
    expect(vm.aCategory).toBe('Other')
  })
})


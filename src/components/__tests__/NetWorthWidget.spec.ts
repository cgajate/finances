import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import NetWorthWidget from '@/components/NetWorthWidget.vue'
import { useNetWorthStore } from '@/stores/netWorth'
import { useSavingsGoalsStore } from '@/stores/savingsGoals'

function mountWidget() {
  return mount(NetWorthWidget, {
    global: {
      plugins: [createPinia()],
    },
  })
}

describe('NetWorthWidget', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('renders the heading', () => {
    const wrapper = mountWidget()
    expect(wrapper.find('h2').text()).toContain('Net Worth')
  })

  it('shows zero values when no entries', () => {
    const wrapper = mountWidget()
    const values = wrapper.findAll('.net-worth-widget__value')
    // Total Assets, Total Liabilities, Net Worth
    expect(values.length).toBeGreaterThanOrEqual(3)
    expect(wrapper.text()).toContain('$0.00')
  })

  it('shows total assets with custom entries', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useNetWorthStore()
    store.addEntry({ kind: 'asset', name: 'Car', amount: 15000 })

    const wrapper = mount(NetWorthWidget, { global: { plugins: [pinia] } })
    expect(wrapper.text()).toContain('$15,000.00')
  })

  it('shows total liabilities', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useNetWorthStore()
    store.addEntry({ kind: 'liability', name: 'Loan', amount: 5000 })

    const wrapper = mount(NetWorthWidget, { global: { plugins: [pinia] } })
    expect(wrapper.text()).toContain('$5,000.00')
  })

  it('lists asset entries', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useNetWorthStore()
    store.addEntry({ kind: 'asset', name: 'Home Equity', amount: 200000 })

    const wrapper = mount(NetWorthWidget, { global: { plugins: [pinia] } })
    expect(wrapper.text()).toContain('Home Equity')
    expect(wrapper.find('h3').text()).toBe('Assets')
  })

  it('lists liability entries', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useNetWorthStore()
    store.addEntry({ kind: 'liability', name: 'Mortgage', amount: 250000 })

    const wrapper = mount(NetWorthWidget, { global: { plugins: [pinia] } })
    expect(wrapper.text()).toContain('Mortgage')
    const h3s = wrapper.findAll('h3')
    expect(h3s.some((h) => h.text() === 'Liabilities')).toBe(true)
  })

  it('shows savings note when savings total > 0', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const savingsStore = useSavingsGoalsStore()
    savingsStore.addGoal({ name: 'Vacation', targetAmount: 5000, deadline: '2027-01-01', savedAmount: 2000 })

    const wrapper = mount(NetWorthWidget, { global: { plugins: [pinia] } })
    expect(wrapper.find('.net-worth-widget__note').exists()).toBe(true)
    expect(wrapper.text()).toContain('$2,000.00')
    expect(wrapper.text()).toContain('savings goals')
  })

  it('does not show savings note when savings total is 0', () => {
    const wrapper = mountWidget()
    expect(wrapper.find('.net-worth-widget__note').exists()).toBe(false)
  })

  it('shows Add button when form is hidden', () => {
    const wrapper = mountWidget()
    expect(wrapper.find('.net-worth-widget__add-btn').exists()).toBe(true)
    expect(wrapper.find('.net-worth-widget__form').exists()).toBe(false)
  })

  it('shows form when Add button is clicked', async () => {
    const wrapper = mountWidget()
    await wrapper.find('.net-worth-widget__add-btn').trigger('click')
    expect(wrapper.find('.net-worth-widget__form').exists()).toBe(true)
    expect(wrapper.find('.net-worth-widget__add-btn').exists()).toBe(false)
  })

  it('hides form when Cancel is clicked', async () => {
    const wrapper = mountWidget()
    await wrapper.find('.net-worth-widget__add-btn').trigger('click')
    await wrapper.find('.btn-cancel-sm').trigger('click')
    expect(wrapper.find('.net-worth-widget__form').exists()).toBe(false)
    expect(wrapper.find('.net-worth-widget__add-btn').exists()).toBe(true)
  })

  it('adds an entry via the form', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useNetWorthStore()

    const wrapper = mount(NetWorthWidget, { global: { plugins: [pinia] } })
    await wrapper.find('.net-worth-widget__add-btn').trigger('click')

    const select = wrapper.find('select')
    await select.setValue('asset')

    const nameInput = wrapper.find('#nw-name')
    await nameInput.setValue('Savings Account')

    // CurrencyInput emits update:modelValue; set the ref directly
    const amountInput = wrapper.find('#nw-amount')
    await amountInput.setValue('10000')

    await wrapper.find('.btn-fund').trigger('click')
    expect(store.entries).toHaveLength(1)
    expect(store.entries[0]!.name).toBe('Savings Account')
  })

  it('does not add entry with empty name', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useNetWorthStore()

    const wrapper = mount(NetWorthWidget, { global: { plugins: [pinia] } })
    await wrapper.find('.net-worth-widget__add-btn').trigger('click')

    const nameInput = wrapper.find('#nw-name')
    await nameInput.setValue('')

    await wrapper.find('.btn-fund').trigger('click')
    expect(store.entries).toHaveLength(0)
  })

  it('does not add entry with zero amount', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useNetWorthStore()

    const wrapper = mount(NetWorthWidget, { global: { plugins: [pinia] } })
    await wrapper.find('.net-worth-widget__add-btn').trigger('click')

    const nameInput = wrapper.find('#nw-name')
    await nameInput.setValue('Test')

    await wrapper.find('.btn-fund').trigger('click')
    expect(store.entries).toHaveLength(0)
  })

  it('removes an entry when remove button is clicked', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useNetWorthStore()
    store.addEntry({ kind: 'asset', name: 'Car', amount: 15000 })

    const wrapper = mount(NetWorthWidget, { global: { plugins: [pinia] } })
    await wrapper.find('.btn-remove').trigger('click')
    expect(store.entries).toHaveLength(0)
  })

  it('applies positive class when net worth >= 0', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useNetWorthStore()
    store.addEntry({ kind: 'asset', name: 'Cash', amount: 1000 })

    const wrapper = mount(NetWorthWidget, { global: { plugins: [pinia] } })
    const netRow = wrapper.find('.net-worth-widget__row--total')
    expect(netRow.find('.net-worth-widget__value--positive').exists()).toBe(true)
  })

  it('applies negative class when net worth < 0', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useNetWorthStore()
    store.addEntry({ kind: 'liability', name: 'Debt', amount: 5000 })

    const wrapper = mount(NetWorthWidget, { global: { plugins: [pinia] } })
    const netRow = wrapper.find('.net-worth-widget__row--total')
    expect(netRow.find('.net-worth-widget__value--negative').exists()).toBe(true)
  })

  it('does not show assets section when no asset entries', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useNetWorthStore()
    store.addEntry({ kind: 'liability', name: 'Loan', amount: 5000 })

    const wrapper = mount(NetWorthWidget, { global: { plugins: [pinia] } })
    const h3s = wrapper.findAll('h3')
    expect(h3s.some((h) => h.text() === 'Assets')).toBe(false)
  })

  it('does not show liabilities section when no liability entries', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useNetWorthStore()
    store.addEntry({ kind: 'asset', name: 'Car', amount: 15000 })

    const wrapper = mount(NetWorthWidget, { global: { plugins: [pinia] } })
    const h3s = wrapper.findAll('h3')
    expect(h3s.some((h) => h.text() === 'Liabilities')).toBe(false)
  })
})


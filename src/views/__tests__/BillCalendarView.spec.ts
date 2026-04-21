import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import BillCalendarView from '@/views/BillCalendarView.vue'
import { useFinancesStore } from '@/stores/finances'

describe('BillCalendarView', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-21T12:00:00Z'))
    localStorage.clear()
    pinia = createPinia()
    setActivePinia(pinia)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function mountView() {
    return mount(BillCalendarView, {
      global: { plugins: [pinia] },
    })
  }

  it('renders the title', () => {
    const wrapper = mountView()
    expect(wrapper.find('h1').text()).toContain('Bill Calendar')
  })

  it('shows current month label', () => {
    const wrapper = mountView()
    expect(wrapper.text()).toContain('April')
    expect(wrapper.text()).toContain('2026')
  })

  it('shows weekday headers', () => {
    const wrapper = mountView()
    const headers = wrapper.findAll('.weekday')
    expect(headers).toHaveLength(7)
    expect(headers[0]!.text()).toBe('Sun')
    expect(headers[6]!.text()).toBe('Sat')
  })

  it('renders calendar grid with weeks', () => {
    const wrapper = mountView()
    const weeks = wrapper.findAll('.week-row')
    expect(weeks.length).toBeGreaterThanOrEqual(4)
  })

  it('highlights today', () => {
    const wrapper = mountView()
    expect(wrapper.find('.day-cell.today').exists()).toBe(true)
  })

  it('shows navigation buttons', () => {
    const wrapper = mountView()
    expect(wrapper.text()).toContain('Prev')
    expect(wrapper.text()).toContain('Next')
    expect(wrapper.text()).toContain('Today')
  })

  it('navigates to next month', async () => {
    const wrapper = mountView()
    await wrapper.findAll('.nav-btn')[1]!.trigger('click')
    expect(wrapper.text()).toContain('May')
  })

  it('navigates to previous month', async () => {
    const wrapper = mountView()
    await wrapper.findAll('.nav-btn')[0]!.trigger('click')
    expect(wrapper.text()).toContain('March')
  })

  it('shows event dots for days with events', () => {
    const store = useFinancesStore()
    store.addRecurringExpense({ amount: 1500, frequency: 'monthly', description: 'Rent', notes: '', dueDate: '2026-04-01' })
    const wrapper = mountView()
    expect(wrapper.findAll('.dot-expense').length).toBeGreaterThanOrEqual(1)
  })

  it('shows income and expense amounts on days', () => {
    const store = useFinancesStore()
    store.addAdhocIncome({ amount: 5000, description: 'Bonus', date: '2026-04-15' })
    store.addAdhocExpense({ amount: 200, description: 'Bill', notes: '', dueDate: '2026-04-15' })
    const wrapper = mountView()
    expect(wrapper.text()).toContain('$5,000.00')
    expect(wrapper.text()).toContain('$200.00')
  })

  it('shows month summary totals', () => {
    const store = useFinancesStore()
    store.addAdhocIncome({ amount: 3000, description: 'Pay', date: '2026-04-10' })
    store.addAdhocExpense({ amount: 1000, description: 'Bill', notes: '', dueDate: '2026-04-20' })
    const wrapper = mountView()
    expect(wrapper.find('.summary-income').text()).toContain('$3,000.00')
    expect(wrapper.find('.summary-expense').text()).toContain('$1,000.00')
  })

  it('shows detail panel when clicking a day with events', async () => {
    const store = useFinancesStore()
    store.addAdhocExpense({ amount: 500, description: 'Car Fix', notes: '', dueDate: '2026-04-15' })
    const wrapper = mountView()
    const dayCells = wrapper.findAll('.day-cell.has-events')
    expect(dayCells.length).toBeGreaterThanOrEqual(1)
    await dayCells[0]!.trigger('click')
    expect(wrapper.find('.day-detail').exists()).toBe(true)
    expect(wrapper.text()).toContain('Car Fix')
  })

  it('shows legend', () => {
    const wrapper = mountView()
    expect(wrapper.find('.dot-income').exists()).toBe(true)
    expect(wrapper.find('.dot-expense').exists()).toBe(true)
    expect(wrapper.text()).toContain('Income')
    expect(wrapper.text()).toContain('Expense')
  })
})


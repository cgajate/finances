import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import YearReviewView from '@/views/YearReviewView.vue'
import { useFinancesStore } from '@/stores/finances'

describe('YearReviewView', () => {
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
    return mount(YearReviewView, {
      global: { plugins: [pinia] },
    })
  }

  it('renders the title', () => {
    const wrapper = mountView()
    expect(wrapper.find('h1').text()).toContain('Year in Review')
  })

  it('shows a year selector defaulting to current year', () => {
    const wrapper = mountView()
    const select = wrapper.find('.year-select')
    expect(select.exists()).toBe(true)
    expect((select.element as HTMLSelectElement).value).toBe('2026')
  })

  it('renders 4 summary cards', () => {
    const wrapper = mountView()
    expect(wrapper.findAll('.card')).toHaveLength(4)
    expect(wrapper.text()).toContain('Total Earned')
    expect(wrapper.text()).toContain('Total Spent')
    expect(wrapper.text()).toContain('Net Savings')
    expect(wrapper.text()).toContain('Savings Rate')
  })

  it('shows $0.00 with no data', () => {
    const wrapper = mountView()
    const cards = wrapper.findAll('.card-value')
    expect(cards[0]!.text()).toBe('$0.00')
    expect(cards[1]!.text()).toBe('$0.00')
    expect(cards[2]!.text()).toBe('$0.00')
    expect(cards[3]!.text()).toBe('0%')
  })

  it('shows correct totals with data', () => {
    const store = useFinancesStore()
    store.addRecurringIncome({ amount: 5000, frequency: 'monthly', description: 'Sal', notes: '', date: null })
    store.addRecurringExpense({ amount: 2000, frequency: 'monthly', description: 'Rent', notes: '', dueDate: null })
    const wrapper = mountView()
    expect(wrapper.text()).toContain('$60,000.00') // 5000*12
    expect(wrapper.text()).toContain('$24,000.00') // 2000*12
    expect(wrapper.text()).toContain('$36,000.00') // net
    expect(wrapper.text()).toContain('60%') // savings rate
  })

  it('shows 12 month columns in chart', () => {
    const wrapper = mountView()
    expect(wrapper.findAll('.month-col')).toHaveLength(12)
  })

  it('shows legend', () => {
    const wrapper = mountView()
    expect(wrapper.find('.income-dot').exists()).toBe(true)
    expect(wrapper.find('.expense-dot').exists()).toBe(true)
  })

  it('shows category breakdown with data', () => {
    const store = useFinancesStore()
    store.addRecurringExpense({ amount: 1000, frequency: 'monthly', description: 'R', notes: '', dueDate: null, category: 'Housing' })
    store.addRecurringExpense({ amount: 400, frequency: 'monthly', description: 'F', notes: '', dueDate: null, category: 'Food' })
    const wrapper = mountView()
    expect(wrapper.findAll('.cat-row')).toHaveLength(2)
    expect(wrapper.text()).toContain('Housing')
    expect(wrapper.text()).toContain('Food')
  })

  it('shows empty message when no expenses', () => {
    const wrapper = mountView()
    expect(wrapper.text()).toContain('No expense data')
  })

  it('shows best and worst month highlights with data', () => {
    const store = useFinancesStore()
    store.addRecurringIncome({ amount: 5000, frequency: 'monthly', description: 'S', notes: '', date: null })
    store.addRecurringExpense({ amount: 3000, frequency: 'monthly', description: 'R', notes: '', dueDate: null })
    const wrapper = mountView()
    expect(wrapper.text()).toContain('Best Month')
    expect(wrapper.text()).toContain('Tightest Month')
  })

  it('adds negative class to net card when negative', () => {
    const store = useFinancesStore()
    store.addRecurringExpense({ amount: 5000, frequency: 'monthly', description: 'Big', notes: '', dueDate: null })
    const wrapper = mountView()
    expect(wrapper.find('.card.net').classes()).toContain('negative')
  })
})


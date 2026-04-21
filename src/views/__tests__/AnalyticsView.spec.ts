import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import AnalyticsView from '@/views/AnalyticsView.vue'
import { useFinancesStore } from '@/stores/finances'

describe('AnalyticsView', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-20T12:00:00Z'))
    localStorage.clear()
    pinia = createPinia()
    setActivePinia(pinia)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function mountView() {
    return mount(AnalyticsView, {
      global: { plugins: [pinia] },
    })
  }

  it('renders the title', () => {
    const wrapper = mountView()
    expect(wrapper.find('h1').text()).toContain('Analytics & Forecasting')
  })

  it('shows three tabs', () => {
    const wrapper = mountView()
    const tabs = wrapper.findAll('.tabs button')
    expect(tabs).toHaveLength(3)
    expect(tabs[0]!.text()).toContain('Month-by-Month')
    expect(tabs[1]!.text()).toContain('12-Month Projection')
    expect(tabs[2]!.text()).toContain('Spending Trends')
  })

  it('defaults to timeline tab', () => {
    const wrapper = mountView()
    expect(wrapper.findAll('.tabs button')[0]!.classes()).toContain('active')
    expect(wrapper.find('.timeline').exists()).toBe(true)
  })

  it('switches to projection tab', async () => {
    const wrapper = mountView()
    await wrapper.findAll('.tabs button')[1]!.trigger('click')
    expect(wrapper.find('.projection').exists()).toBe(true)
    expect(wrapper.find('.timeline').exists()).toBe(false)
  })

  it('shows range controls on timeline tab', () => {
    const wrapper = mountView()
    expect(wrapper.findAll('.range-field')).toHaveLength(2)
    expect(wrapper.text()).toContain('Past months')
    expect(wrapper.text()).toContain('Future months')
  })

  it('renders month cards on timeline', () => {
    const wrapper = mountView()
    // Default: 6 before + current + 12 after = 19
    expect(wrapper.findAll('.month-card').length).toBe(19)
  })

  it('highlights current month', () => {
    const wrapper = mountView()
    const currentCards = wrapper.findAll('.month-card.current')
    expect(currentCards).toHaveLength(1)
    expect(currentCards[0]!.text()).toContain('Current')
  })

  it('marks past months', () => {
    const wrapper = mountView()
    const pastCards = wrapper.findAll('.month-card.past')
    expect(pastCards.length).toBeGreaterThan(0)
  })

  it('expand/collapse on month card click', async () => {
    const wrapper = mountView()
    const firstHeader = wrapper.find('.month-header')
    await firstHeader.trigger('click')
    expect(wrapper.find('.month-details').exists()).toBe(true)
    expect(wrapper.text()).toContain('Potential Savings')
    // Collapse
    await firstHeader.trigger('click')
    expect(wrapper.find('.month-details').exists()).toBe(false)
  })

  it('shows income and expense sections in expanded month', async () => {
    const store = useFinancesStore()
    store.addRecurringIncome({ amount: 5000, frequency: 'monthly', description: 'Salary', notes: '', date: null })
    store.addRecurringExpense({ amount: 1500, frequency: 'monthly', description: 'Rent', notes: '', dueDate: null })
    const wrapper = mountView()
    // Find & click the current month card
    const currentCard = wrapper.find('.month-card.current')
    await currentCard.find('.month-header').trigger('click')
    expect(wrapper.text()).toContain('Salary')
    expect(wrapper.text()).toContain('Rent')
  })

  it('shows empty messages for months with no items', async () => {
    const wrapper = mountView()
    await wrapper.find('.month-header').trigger('click')
    expect(wrapper.text()).toContain('No income this month')
    expect(wrapper.text()).toContain('No expenses this month')
  })

  describe('projection tab', () => {
    it('shows 4 projection cards', async () => {
      const wrapper = mountView()
      await wrapper.findAll('.tabs button')[1]!.trigger('click')
      expect(wrapper.findAll('.proj-card')).toHaveLength(4)
      expect(wrapper.text()).toContain('Projected Income')
      expect(wrapper.text()).toContain('Projected Expenses')
      expect(wrapper.text()).toContain('Projected Savings')
      expect(wrapper.text()).toContain('Avg Monthly Savings')
    })

    it('shows $0.00 when no data', async () => {
      const wrapper = mountView()
      await wrapper.findAll('.tabs button')[1]!.trigger('click')
      const values = wrapper.findAll('.proj-value')
      for (const v of values) {
        expect(v.text()).toBe('$0.00')
      }
    })

    it('shows correct projections with data', async () => {
      const store = useFinancesStore()
      store.addRecurringIncome({ amount: 1000, frequency: 'monthly', description: 'Sal', notes: '', date: null })
      store.addRecurringExpense({ amount: 400, frequency: 'monthly', description: 'Rent', notes: '', dueDate: null })
      const wrapper = mountView()
      await wrapper.findAll('.tabs button')[1]!.trigger('click')
      expect(wrapper.text()).toContain('$12,000.00') // 12 months income
      expect(wrapper.text()).toContain('$4,800.00')  // 12 months expenses
      expect(wrapper.text()).toContain('$7,200.00')  // net savings
    })

    it('shows mini bar chart with 12 bars', async () => {
      const store = useFinancesStore()
      store.addRecurringIncome({ amount: 100, frequency: 'monthly', description: 'S', notes: '', date: null })
      const wrapper = mountView()
      await wrapper.findAll('.tabs button')[1]!.trigger('click')
      expect(wrapper.findAll('.mini-bar')).toHaveLength(12)
    })

    it('shows legend', async () => {
      const wrapper = mountView()
      await wrapper.findAll('.tabs button')[1]!.trigger('click')
      expect(wrapper.text()).toContain('Income')
      expect(wrapper.text()).toContain('Expenses')
      expect(wrapper.find('.income-dot').exists()).toBe(true)
      expect(wrapper.find('.expense-dot').exists()).toBe(true)
    })

    it('adds negative class to savings card when negative', async () => {
      const store = useFinancesStore()
      store.addRecurringExpense({ amount: 5000, frequency: 'monthly', description: 'Big', notes: '', dueDate: null })
      const wrapper = mountView()
      await wrapper.findAll('.tabs button')[1]!.trigger('click')
      expect(wrapper.find('.proj-card.savings').classes()).toContain('negative')
    })
  })

  it('shows cumulative savings on each month card', () => {
    const store = useFinancesStore()
    store.addRecurringIncome({ amount: 1000, frequency: 'monthly', description: 'S', notes: '', date: null })
    const wrapper = mountView()
    expect(wrapper.text()).toContain('Cumulative')
  })

  it('shows summary values on month cards', () => {
    const store = useFinancesStore()
    store.addRecurringIncome({ amount: 2000, frequency: 'monthly', description: 'S', notes: '', date: null })
    store.addRecurringExpense({ amount: 800, frequency: 'monthly', description: 'R', notes: '', dueDate: null })
    const wrapper = mountView()
    const currentCard = wrapper.find('.month-card.current')
    expect(currentCard.find('.summary-income').text()).toContain('$2,000.00')
    expect(currentCard.find('.summary-expense').text()).toContain('$800.00')
  })
})


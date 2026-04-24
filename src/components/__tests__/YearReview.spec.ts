import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import YearReview from '@/components/YearReview.vue'
import { useFinancesStore } from '@/stores/finances'

const CURRENT_YEAR = new Date().getFullYear()

function thisYearDate(month: number, day = 15): string {
  return `${CURRENT_YEAR}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

describe('YearReview', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    localStorage.clear()
    pinia = createPinia()
    setActivePinia(pinia)
  })

  function mountComponent() {
    return mount(YearReview, {
      global: { plugins: [pinia] },
    })
  }

  function seedPositiveData() {
    const store = useFinancesStore()
    store.addRecurringIncome({
      amount: 5000,
      frequency: 'monthly',
      description: 'Salary',
      notes: '',
      date: thisYearDate(1),
    })
    store.addAdhocExpense({
      amount: 200,
      description: 'Groceries',
      notes: '',
      dueDate: thisYearDate(3),
      category: 'Food',
    })
    store.addAdhocExpense({
      amount: 100,
      description: 'Gas',
      notes: '',
      dueDate: thisYearDate(3),
      category: 'Transport',
    })
  }

  function seedNegativeData() {
    const store = useFinancesStore()
    store.addAdhocIncome({
      amount: 100,
      description: 'Small gift',
      date: thisYearDate(2),
    })
    store.addRecurringExpense({
      amount: 3000,
      frequency: 'monthly',
      description: 'Rent',
      notes: '',
      dueDate: thisYearDate(1),
      category: 'Housing',
    })
    store.addAdhocExpense({
      amount: 500,
      description: 'Big purchase',
      notes: '',
      dueDate: thisYearDate(4),
      category: 'Entertainment',
    })
  }

  // --- Basic rendering ---
  it('renders year selector', () => {
    const wrapper = mountComponent()
    expect(wrapper.find('.year-select').exists()).toBe(true)
  })

  it('renders summary cards', () => {
    const wrapper = mountComponent()
    expect(wrapper.findAll('.yr-card')).toHaveLength(4)
    expect(wrapper.text()).toContain('Total Earned')
    expect(wrapper.text()).toContain('Total Spent')
    expect(wrapper.text()).toContain('Net Savings')
    expect(wrapper.text()).toContain('Savings Rate')
  })

  it('renders Biggest Expense Categories heading', () => {
    const wrapper = mountComponent()
    expect(wrapper.text()).toContain('Biggest Expense Categories')
  })

  it('renders Monthly Breakdown heading', () => {
    const wrapper = mountComponent()
    expect(wrapper.text()).toContain('Monthly Breakdown')
  })

  it('renders legend', () => {
    const wrapper = mountComponent()
    expect(wrapper.find('.legend').exists()).toBe(true)
    expect(wrapper.text()).toContain('Income')
    expect(wrapper.text()).toContain('Expenses')
  })

  // --- Empty state ---
  it('shows empty state when no expenses', () => {
    const wrapper = mountComponent()
    expect(wrapper.find('.empty').exists()).toBe(true)
    expect(wrapper.text()).toContain('No expense data')
  })

  it('does not show highlights when no data', () => {
    const wrapper = mountComponent()
    expect(wrapper.find('.highlights').exists()).toBe(false)
  })

  // --- Positive scenario ---
  it('shows category rows when expenses exist', () => {
    seedPositiveData()
    const wrapper = mountComponent()
    expect(wrapper.findAll('.cat-row').length).toBeGreaterThan(0)
    expect(wrapper.find('.cat-rank').exists()).toBe(true)
    expect(wrapper.find('.cat-name').exists()).toBe(true)
    expect(wrapper.find('.cat-amount').exists()).toBe(true)
    expect(wrapper.find('.cat-percent').exists()).toBe(true)
  })

  it('shows highlights with best and worst month', () => {
    seedPositiveData()
    const wrapper = mountComponent()
    expect(wrapper.find('.highlights').exists()).toBe(true)
    expect(wrapper.find('.highlight.best').exists()).toBe(true)
    expect(wrapper.find('.highlight.worst').exists()).toBe(true)
    expect(wrapper.text()).toContain('Best Month')
    expect(wrapper.text()).toContain('Tightest Month')
  })

  it('does not apply negative class when net savings is positive', () => {
    seedPositiveData()
    const wrapper = mountComponent()
    expect(wrapper.find('.yr-card.net.negative').exists()).toBe(false)
    expect(wrapper.find('.yr-card.rate.negative').exists()).toBe(false)
  })

  it('renders monthly chart columns', () => {
    seedPositiveData()
    const wrapper = mountComponent()
    expect(wrapper.findAll('.yr-month-col')).toHaveLength(12)
  })

  it('renders income and expense bars', () => {
    seedPositiveData()
    const wrapper = mountComponent()
    expect(wrapper.find('.income-bar').exists()).toBe(true)
    expect(wrapper.find('.expense-bar').exists()).toBe(true)
  })

  it('shows positive net with + prefix', () => {
    seedPositiveData()
    const wrapper = mountComponent()
    const nets = wrapper.findAll('.yr-month-net')
    const positiveNet = nets.find((n) => n.text().startsWith('+'))
    expect(positiveNet).toBeTruthy()
  })

  // --- Negative scenario ---
  it('applies negative class when net savings is negative', () => {
    seedNegativeData()
    const wrapper = mountComponent()
    expect(wrapper.find('.yr-card.net.negative').exists()).toBe(true)
    expect(wrapper.find('.yr-card.rate.negative').exists()).toBe(true)
  })

  it('shows negative monthly net without + prefix', () => {
    seedNegativeData()
    const wrapper = mountComponent()
    const nets = wrapper.findAll('.yr-month-net')
    const negativeNet = nets.find((n) => n.classes().includes('negative'))
    expect(negativeNet).toBeTruthy()
  })

  it('applies negative class on worst month value when net < 0', () => {
    seedNegativeData()
    const wrapper = mountComponent()
    const worstValue = wrapper.find('.highlight.worst .highlight-value')
    expect(worstValue.exists()).toBe(true)
    expect(worstValue.classes()).toContain('negative')
  })

  it('best month value has positive class', () => {
    seedPositiveData()
    const wrapper = mountComponent()
    const bestValue = wrapper.find('.highlight.best .highlight-value')
    expect(bestValue.exists()).toBe(true)
    expect(bestValue.classes()).toContain('positive')
  })

  // --- Year selector change ---
  it('updates when year is changed', async () => {
    seedPositiveData()
    const wrapper = mountComponent()
    const select = wrapper.find('.year-select')
    // Changing to a year with no data
    await select.setValue(CURRENT_YEAR - 1)
    expect(wrapper.find('.empty').exists()).toBe(true)
  })

  // --- No income scenario (totalIncome = 0 branch for bar height) ---
  it('renders bars with fallback height when no income', () => {
    const store = useFinancesStore()
    store.addAdhocExpense({
      amount: 50,
      description: 'Small expense',
      notes: '',
      dueDate: thisYearDate(6),
      category: 'Food',
    })
    const wrapper = mountComponent()
    expect(wrapper.find('.income-bar').exists()).toBe(true)
    expect(wrapper.find('.expense-bar').exists()).toBe(true)
  })

  // --- No expenses scenario (totalExpenses = 0 branch for bar height) ---
  it('renders bars with fallback height when no expenses', () => {
    const store = useFinancesStore()
    store.addAdhocIncome({
      amount: 500,
      description: 'Gift',
      date: thisYearDate(5),
    })
    const wrapper = mountComponent()
    expect(wrapper.find('.income-bar').exists()).toBe(true)
    expect(wrapper.find('.expense-bar').exists()).toBe(true)
  })

  it('category bar fill has correct style', () => {
    seedPositiveData()
    const wrapper = mountComponent()
    const fill = wrapper.find('.cat-bar-fill')
    expect(fill.attributes('style')).toContain('width:')
  })
})


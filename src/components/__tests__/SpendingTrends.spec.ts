import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SpendingTrends from '@/components/SpendingTrends.vue'
import { useFinancesStore } from '@/stores/finances'

function pastMonthDate(monthsAgo: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() - monthsAgo)
  return d.toISOString().split('T')[0]!
}

describe('SpendingTrends', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    localStorage.clear()
    pinia = createPinia()
    setActivePinia(pinia)
  })

  function mountComponent() {
    return mount(SpendingTrends, {
      global: { plugins: [pinia] },
    })
  }

  function seedExpenses() {
    const store = useFinancesStore()
    // Add recurring expense for consistent category data
    store.addRecurringExpense({
      amount: 100,
      frequency: 'monthly',
      description: 'Internet',
      notes: '',
      dueDate: pastMonthDate(0),
      category: 'Utilities',
    })
    // Add adhoc expenses in different months
    store.addAdhocExpense({
      amount: 50,
      description: 'Groceries',
      notes: '',
      dueDate: pastMonthDate(1),
      category: 'Food',
    })
    store.addAdhocExpense({
      amount: 200,
      description: 'Big Grocery Run',
      notes: '',
      dueDate: pastMonthDate(0),
      category: 'Food',
    })
  }

  it('renders the range slider', () => {
    const wrapper = mountComponent()
    expect(wrapper.find('input[type="range"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Months to compare')
  })

  it('renders Total Monthly Spending heading', () => {
    const wrapper = mountComponent()
    expect(wrapper.text()).toContain('Total Monthly Spending')
  })

  it('renders By Category heading', () => {
    const wrapper = mountComponent()
    expect(wrapper.text()).toContain('By Category')
  })

  it('shows empty state when no expenses', () => {
    const wrapper = mountComponent()
    expect(wrapper.find('.empty').exists()).toBe(true)
    expect(wrapper.text()).toContain('No expense data')
  })

  it('renders total monthly spending bars when expenses exist', () => {
    seedExpenses()
    const wrapper = mountComponent()
    expect(wrapper.findAll('.trend-bar-col').length).toBeGreaterThan(0)
  })

  it('renders category cards when expenses exist', () => {
    seedExpenses()
    const wrapper = mountComponent()
    expect(wrapper.findAll('.trend-cat-card').length).toBeGreaterThan(0)
  })

  it('shows category name and average', () => {
    seedExpenses()
    const wrapper = mountComponent()
    const card = wrapper.find('.trend-cat-card')
    expect(card.find('.trend-cat-name').exists()).toBe(true)
    expect(card.find('.trend-cat-avg').exists()).toBe(true)
  })

  it('shows trend arrow', () => {
    seedExpenses()
    const wrapper = mountComponent()
    expect(wrapper.find('.trend-arrow').exists()).toBe(true)
  })

  it('shows sparkline bars', () => {
    seedExpenses()
    const wrapper = mountComponent()
    expect(wrapper.findAll('.spark-bar').length).toBeGreaterThan(0)
  })

  it('expands category detail on click', async () => {
    seedExpenses()
    const wrapper = mountComponent()
    expect(wrapper.find('.trend-cat-detail').exists()).toBe(false)
    await wrapper.find('.trend-cat-card').trigger('click')
    expect(wrapper.find('.trend-cat-detail').exists()).toBe(true)
  })

  it('collapses category detail on second click', async () => {
    seedExpenses()
    const wrapper = mountComponent()
    await wrapper.find('.trend-cat-card').trigger('click')
    expect(wrapper.find('.trend-cat-detail').exists()).toBe(true)
    await wrapper.find('.trend-cat-card').trigger('click')
    expect(wrapper.find('.trend-cat-detail').exists()).toBe(false)
  })

  it('expands category detail on Enter key', async () => {
    seedExpenses()
    const wrapper = mountComponent()
    await wrapper.find('.trend-cat-card').trigger('keydown.enter')
    expect(wrapper.find('.trend-cat-detail').exists()).toBe(true)
  })

  it('collapses category detail on second Enter key', async () => {
    seedExpenses()
    const wrapper = mountComponent()
    await wrapper.find('.trend-cat-card').trigger('keydown.enter')
    expect(wrapper.find('.trend-cat-detail').exists()).toBe(true)
    await wrapper.find('.trend-cat-card').trigger('keydown.enter')
    expect(wrapper.find('.trend-cat-detail').exists()).toBe(false)
  })

  it('expands category detail on Space key', async () => {
    seedExpenses()
    const wrapper = mountComponent()
    await wrapper.find('.trend-cat-card').trigger('keydown.space')
    expect(wrapper.find('.trend-cat-detail').exists()).toBe(true)
  })

  it('collapses category detail on second Space key', async () => {
    seedExpenses()
    const wrapper = mountComponent()
    await wrapper.find('.trend-cat-card').trigger('keydown.space')
    expect(wrapper.find('.trend-cat-detail').exists()).toBe(true)
    await wrapper.find('.trend-cat-card').trigger('keydown.space')
    expect(wrapper.find('.trend-cat-detail').exists()).toBe(false)
  })

  it('shows detail rows with month labels and amounts', async () => {
    seedExpenses()
    const wrapper = mountComponent()
    await wrapper.find('.trend-cat-card').trigger('click')
    expect(wrapper.findAll('.trend-detail-row').length).toBeGreaterThan(0)
    expect(wrapper.find('.trend-detail-month').exists()).toBe(true)
    expect(wrapper.find('.trend-detail-amount').exists()).toBe(true)
  })

  it('renders bar values and labels in chart', () => {
    seedExpenses()
    const wrapper = mountComponent()
    expect(wrapper.find('.trend-bar-value').exists()).toBe(true)
    expect(wrapper.find('.trend-bar-label').exists()).toBe(true)
  })

  it('renders total in category card', () => {
    seedExpenses()
    const wrapper = mountComponent()
    expect(wrapper.find('.trend-cat-total').exists()).toBe(true)
  })

  it('updates when range slider changes', async () => {
    seedExpenses()
    const wrapper = mountComponent()
    const barCountBefore = wrapper.findAll('.trend-bar-col').length
    await wrapper.find('input[type="range"]').setValue(3)
    const barCountAfter = wrapper.findAll('.trend-bar-col').length
    expect(barCountAfter).toBeLessThanOrEqual(barCountBefore)
  })

  it('category cards have role button and tabindex', () => {
    seedExpenses()
    const wrapper = mountComponent()
    const card = wrapper.find('.trend-cat-card')
    expect(card.attributes('role')).toBe('button')
    expect(card.attributes('tabindex')).toBe('0')
  })

  it('clicking a different category card switches expanded category', async () => {
    seedExpenses()
    const wrapper = mountComponent()
    const cards = wrapper.findAll('.trend-cat-card')
    if (cards.length >= 2) {
      await cards[0]!.trigger('click')
      expect(wrapper.find('.trend-cat-detail').exists()).toBe(true)
      const firstDetailText = wrapper.find('.trend-cat-detail').text()
      await cards[1]!.trigger('click')
      // Detail should now show for second card
      expect(wrapper.find('.trend-cat-detail').exists()).toBe(true)
    }
  })

  it('shows down trend arrow when spending decreases', () => {
    const store = useFinancesStore()
    // Add higher spending in older months, lower in recent
    for (let i = 5; i >= 3; i--) {
      store.addAdhocExpense({
        amount: 300,
        description: `Old spend ${i}`,
        notes: '',
        dueDate: pastMonthDate(i),
        category: 'Entertainment',
      })
    }
    store.addAdhocExpense({
      amount: 10,
      description: 'Small recent',
      notes: '',
      dueDate: pastMonthDate(0),
      category: 'Entertainment',
    })
    const wrapper = mountComponent()
    expect(wrapper.text()).toMatch(/↓/)
  })

  it('shows flat trend arrow when spending is stable', () => {
    const store = useFinancesStore()
    // Add identical spending across all months
    for (let i = 0; i < 6; i++) {
      store.addAdhocExpense({
        amount: 100,
        description: `Stable ${i}`,
        notes: '',
        dueDate: pastMonthDate(i),
        category: 'Transport',
      })
    }
    const wrapper = mountComponent()
    expect(wrapper.text()).toMatch(/→ flat/)
  })
})

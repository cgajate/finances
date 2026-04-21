import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SavingsGoalsView from '@/views/SavingsGoalsView.vue'
import { useSavingsGoalsStore } from '@/stores/savingsGoals'

describe('SavingsGoalsView', () => {
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
    return mount(SavingsGoalsView, {
      global: { plugins: [pinia] },
    })
  }

  it('renders the title', () => {
    const wrapper = mountView()
    expect(wrapper.find('h1').text()).toContain('Savings Goals')
  })

  it('shows the add goal form', () => {
    const wrapper = mountView()
    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.text()).toContain('Goal Name')
    expect(wrapper.text()).toContain('Target Amount')
    expect(wrapper.text()).toContain('Deadline')
  })

  it('shows empty message when no goals', () => {
    const wrapper = mountView()
    expect(wrapper.text()).toContain('No savings goals yet')
  })

  it('shows active goals with progress meter', () => {
    const store = useSavingsGoalsStore()
    store.addGoal({ name: 'Vacation', targetAmount: 3000, deadline: '2026-12-31', savedAmount: 1500 })
    const wrapper = mountView()
    expect(wrapper.text()).toContain('Vacation')
    expect(wrapper.text()).toContain('$1,500.00')
    expect(wrapper.text()).toContain('$3,000.00')
    expect(wrapper.find('.meter-fill').exists()).toBe(true)
    expect(wrapper.text()).toContain('50% complete')
  })

  it('shows days left until deadline', () => {
    const store = useSavingsGoalsStore()
    // Deadline is 10 days from now (April 21 -> May 1)
    store.addGoal({ name: 'Test', targetAmount: 100, deadline: '2026-05-01' })
    const wrapper = mountView()
    expect(wrapper.text()).toContain('10 days left')
  })

  it('shows overdue for past deadlines', () => {
    const store = useSavingsGoalsStore()
    store.addGoal({ name: 'Late', targetAmount: 100, deadline: '2026-04-10' })
    const wrapper = mountView()
    expect(wrapper.text()).toContain('days overdue')
  })

  it('shows Add Savings and Remove buttons', () => {
    const store = useSavingsGoalsStore()
    store.addGoal({ name: 'Goal', targetAmount: 1000, deadline: '2026-12-31' })
    const wrapper = mountView()
    expect(wrapper.text()).toContain('Add Savings')
    expect(wrapper.text()).toContain('Remove')
  })

  it('removes goal on Remove click', async () => {
    const store = useSavingsGoalsStore()
    store.addGoal({ name: 'Remove Me', targetAmount: 500, deadline: '2026-12-31' })
    const wrapper = mountView()
    await wrapper.find('.btn-remove').trigger('click')
    expect(store.goals).toHaveLength(0)
  })

  it('shows completed goals section', () => {
    const store = useSavingsGoalsStore()
    store.addGoal({ name: 'Done Goal', targetAmount: 100, deadline: '2026-12-31', savedAmount: 100 })
    const wrapper = mountView()
    expect(wrapper.text()).toContain('Completed')
    expect(wrapper.text()).toContain('Done Goal')
    expect(wrapper.find('.goal-card.completed').exists()).toBe(true)
  })

  it('shows 100% meter for completed goals', () => {
    const store = useSavingsGoalsStore()
    store.addGoal({ name: 'Full', targetAmount: 200, deadline: '2026-12-31', savedAmount: 250 })
    const wrapper = mountView()
    const fill = wrapper.find('.goal-card.completed .meter-fill')
    expect(fill.attributes('style')).toContain('width: 100%')
  })
})


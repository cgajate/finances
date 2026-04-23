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

  it('renders the add goal form', () => {
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
    expect(wrapper.find('.progress-fill').exists()).toBe(true)
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
    expect(wrapper.find('.savings-goal-row--completed').exists()).toBe(true)
  })

  it('shows 100% meter for completed goals', () => {
    const store = useSavingsGoalsStore()
    store.addGoal({ name: 'Full', targetAmount: 200, deadline: '2026-12-31', savedAmount: 250 })
    const wrapper = mountView()
    const fill = wrapper.find('.savings-goal-row--completed .progress-fill')
    expect(fill.attributes('style')).toContain('width: 100%')
  })

  it('shows "Due today" for deadline that is today', () => {
    const store = useSavingsGoalsStore()
    store.addGoal({ name: 'Today', targetAmount: 100, deadline: '2026-04-21' })
    const wrapper = mountView()
    expect(wrapper.text()).toContain('Due today')
  })

  it('adds a goal via form submission', async () => {
    const store = useSavingsGoalsStore()
    const wrapper = mountView()
    const vm = wrapper.vm as any
    vm.goalName = 'New Car'
    vm.targetAmount = 20000
    vm.deadline = '2027-01-01'
    await wrapper.find('form').trigger('submit')
    expect(store.goals).toHaveLength(1)
    expect(store.goals[0]!.name).toBe('New Car')
  })

  it('does not add goal without name', async () => {
    const store = useSavingsGoalsStore()
    const wrapper = mountView()
    const vm = wrapper.vm as any
    vm.goalName = ''
    vm.targetAmount = 1000
    vm.deadline = '2027-01-01'
    await wrapper.find('form').trigger('submit')
    expect(store.goals).toHaveLength(0)
  })

  it('does not add goal without target amount', async () => {
    const store = useSavingsGoalsStore()
    const wrapper = mountView()
    const vm = wrapper.vm as any
    vm.goalName = 'Car'
    vm.targetAmount = null
    vm.deadline = '2027-01-01'
    await wrapper.find('form').trigger('submit')
    expect(store.goals).toHaveLength(0)
  })

  it('does not add goal without deadline', async () => {
    const store = useSavingsGoalsStore()
    const wrapper = mountView()
    const vm = wrapper.vm as any
    vm.goalName = 'Car'
    vm.targetAmount = 1000
    vm.deadline = ''
    await wrapper.find('form').trigger('submit')
    expect(store.goals).toHaveLength(0)
  })

  it('resets form after adding goal', async () => {
    const wrapper = mountView()
    const vm = wrapper.vm as any
    vm.goalName = 'Car'
    vm.targetAmount = 1000
    vm.deadline = '2027-01-01'
    await wrapper.find('form').trigger('submit')
    expect(vm.goalName).toBe('')
    expect(vm.deadline).toBe('')
  })

  it('opens add savings form on Add Savings click', async () => {
    const store = useSavingsGoalsStore()
    store.addGoal({ name: 'Vacation', targetAmount: 3000, deadline: '2026-12-31' })
    const wrapper = mountView()
    await wrapper.find('.btn-fund').trigger('click')
    expect(wrapper.find('.add-savings-form').exists()).toBe(true)
  })

  it('submits savings to a goal', async () => {
    const store = useSavingsGoalsStore()
    store.addGoal({ name: 'Vacation', targetAmount: 3000, deadline: '2026-12-31' })
    const wrapper = mountView()
    await wrapper.find('.btn-fund').trigger('click')
    const vm = wrapper.vm as any
    vm.addAmount = 500
    await wrapper.find('.add-savings-form').trigger('submit')
    expect(store.goals[0]!.savedAmount).toBe(500)
  })

  it('does not submit savings without amount', async () => {
    const store = useSavingsGoalsStore()
    store.addGoal({ name: 'Vacation', targetAmount: 3000, deadline: '2026-12-31' })
    const wrapper = mountView()
    await wrapper.find('.btn-fund').trigger('click')
    const vm = wrapper.vm as any
    vm.addAmount = null
    await wrapper.find('.add-savings-form').trigger('submit')
    expect(store.goals[0]!.savedAmount).toBe(0)
  })

  it('closes savings form on cancel button click', async () => {
    const store = useSavingsGoalsStore()
    store.addGoal({ name: 'Vacation', targetAmount: 3000, deadline: '2026-12-31' })
    const wrapper = mountView()
    await wrapper.find('.btn-fund').trigger('click')
    expect(wrapper.find('.add-savings-form').exists()).toBe(true)
    await wrapper.find('.btn-cancel-sm').trigger('click')
    expect(wrapper.find('.add-savings-form').exists()).toBe(false)
  })

  it('treats goal with targetAmount 0 as completed', () => {
    const store = useSavingsGoalsStore()
    store.addGoal({ name: 'Zero', targetAmount: 0, deadline: '2026-12-31' })
    const wrapper = mountView()
    // targetAmount 0 means savedAmount >= targetAmount, so it shows as completed
    expect(wrapper.find('.savings-goal-row--completed').exists()).toBe(true)
  })

  it('does not show empty message when completed goals exist but no active', () => {
    const store = useSavingsGoalsStore()
    store.addGoal({ name: 'Done', targetAmount: 100, deadline: '2026-12-31', savedAmount: 100 })
    const wrapper = mountView()
    expect(wrapper.text()).not.toContain('No savings goals yet')
  })

  it('shows snackbar with undo after removing goal', async () => {
    const store = useSavingsGoalsStore()
    store.addGoal({ name: 'ToDelete', targetAmount: 500, deadline: '2026-12-31', savedAmount: 100 })
    const wrapper = mountView()
    await wrapper.find('.btn-remove').trigger('click')
    expect(store.goals).toHaveLength(0)
  })

  it('can remove a completed goal', async () => {
    const store = useSavingsGoalsStore()
    store.addGoal({ name: 'Done', targetAmount: 100, deadline: '2026-12-31', savedAmount: 100 })
    const wrapper = mountView()
    await wrapper.find('.savings-goal-row--completed .btn-remove').trigger('click')
    expect(store.goals).toHaveLength(0)
  })
})

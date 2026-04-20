import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import NotificationPanel from '@/components/NotificationPanel.vue'
import { useFinancesStore } from '@/stores/finances'
import { useNotificationsStore } from '@/stores/notifications'

function daysFromNow(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]!
}

describe('NotificationPanel', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    localStorage.clear()
    pinia = createPinia()
    setActivePinia(pinia)
  })

  function mountPanel() {
    return mount(NotificationPanel, {
      global: { plugins: [pinia] },
    })
  }

  it('renders the bell button', () => {
    const wrapper = mountPanel()
    expect(wrapper.find('.bell-btn').exists()).toBe(true)
  })

  it('does not show badge when no notifications', () => {
    const wrapper = mountPanel()
    expect(wrapper.find('.badge').exists()).toBe(false)
  })

  it('shows badge with count when there are notifications', () => {
    const finances = useFinancesStore()
    finances.addAdhocIncome({ amount: 100, description: 'Inc', date: daysFromNow(1) })
    const wrapper = mountPanel()
    expect(wrapper.find('.badge').exists()).toBe(true)
    expect(wrapper.find('.badge').text()).toBe('1')
  })

  it('opens panel on bell click', async () => {
    const wrapper = mountPanel()
    expect(wrapper.find('.panel').exists()).toBe(false)
    await wrapper.find('.bell-btn').trigger('click')
    expect(wrapper.find('.panel').exists()).toBe(true)
  })

  it('closes panel on backdrop click', async () => {
    const wrapper = mountPanel()
    await wrapper.find('.bell-btn').trigger('click')
    expect(wrapper.find('.panel').exists()).toBe(true)
    await wrapper.find('.backdrop').trigger('click')
    expect(wrapper.find('.panel').exists()).toBe(false)
  })

  it('shows empty message when no notifications', async () => {
    const wrapper = mountPanel()
    await wrapper.find('.bell-btn').trigger('click')
    expect(wrapper.find('.empty').exists()).toBe(true)
    expect(wrapper.text()).toContain('No notifications')
  })

  it('shows expense notification with mute button', async () => {
    const finances = useFinancesStore()
    finances.addRecurringExpense({
      amount: 50,
      frequency: 'monthly',
      description: 'Internet',
      notes: '',
      dueDate: daysFromNow(2),
    })
    const wrapper = mountPanel()
    await wrapper.find('.bell-btn').trigger('click')
    expect(wrapper.text()).toContain('Internet')
    expect(wrapper.find('.mute-btn').exists()).toBe(true)
  })

  it('shows income notification with dismiss button', async () => {
    const finances = useFinancesStore()
    finances.addAdhocIncome({ amount: 200, description: 'Bonus', date: daysFromNow(1) })
    const wrapper = mountPanel()
    await wrapper.find('.bell-btn').trigger('click')
    expect(wrapper.text()).toContain('Bonus')
    expect(wrapper.find('.dismiss-btn').exists()).toBe(true)
  })

  it('shows Dismiss All button when there are notifications', async () => {
    const finances = useFinancesStore()
    finances.addAdhocIncome({ amount: 200, description: 'Bonus', date: daysFromNow(1) })
    const wrapper = mountPanel()
    await wrapper.find('.bell-btn').trigger('click')
    expect(wrapper.find('.dismiss-all').exists()).toBe(true)
  })

  it('does not show Dismiss All when no notifications', async () => {
    const wrapper = mountPanel()
    await wrapper.find('.bell-btn').trigger('click')
    expect(wrapper.find('.dismiss-all').exists()).toBe(false)
  })
})


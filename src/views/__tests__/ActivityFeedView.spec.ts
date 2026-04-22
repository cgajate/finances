import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ActivityFeedView from '@/views/ActivityFeedView.vue'
import { useActivityFeedStore } from '@/stores/activityFeed'

describe('ActivityFeedView', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  function mountView() {
    return mount(ActivityFeedView, {
      global: { plugins: [createPinia()] },
    })
  }

  it('renders title', () => {
    const wrapper = mountView()
    expect(wrapper.text()).toContain('Activity Feed')
  })

  it('shows empty message when no activities', () => {
    const wrapper = mountView()
    expect(wrapper.text()).toContain('No activity yet')
  })

  it('does not show Clear All when no activities', () => {
    const wrapper = mountView()
    expect(wrapper.find('.btn-clear').exists()).toBe(false)
  })

  it('shows activity entries', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useActivityFeedStore()
    store.logActivity('user1', 'add', 'income', 'id1', 'Added salary')
    const wrapper = mount(ActivityFeedView, { global: { plugins: [pinia] } })
    expect(wrapper.find('.feed-item').exists()).toBe(true)
    expect(wrapper.text()).toContain('Added salary')
  })

  it('shows Clear All button when activities exist', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useActivityFeedStore()
    store.logActivity('user1', 'add', 'income', 'id1', 'Test')
    const wrapper = mount(ActivityFeedView, { global: { plugins: [pinia] } })
    expect(wrapper.find('.btn-clear').exists()).toBe(true)
  })

  it('clears all on Clear All click', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useActivityFeedStore()
    store.logActivity('user1', 'add', 'income', 'id1', 'Test')
    const wrapper = mount(ActivityFeedView, { global: { plugins: [pinia] } })
    await wrapper.find('.btn-clear').trigger('click')
    expect(store.activities).toHaveLength(0)
  })

  it('shows action icon for add', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useActivityFeedStore()
    store.logActivity('user1', 'add', 'income', 'id1', 'Added')
    const wrapper = mount(ActivityFeedView, { global: { plugins: [pinia] } })
    expect(wrapper.find('.feed-icon').exists()).toBe(true)
  })

  it('shows action icon for edit', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useActivityFeedStore()
    store.logActivity('user1', 'edit', 'expense', 'id1', 'Edited')
    const wrapper = mount(ActivityFeedView, { global: { plugins: [pinia] } })
    expect(wrapper.find('.feed-icon').exists()).toBe(true)
  })

  it('shows action icon for delete', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useActivityFeedStore()
    store.logActivity('user1', 'delete', 'budget', 'id1', 'Deleted')
    const wrapper = mount(ActivityFeedView, { global: { plugins: [pinia] } })
    expect(wrapper.find('.feed-icon').exists()).toBe(true)
  })

  it('shows entity label for income', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useActivityFeedStore()
    store.logActivity('user1', 'add', 'income', 'id1', 'Test')
    const wrapper = mount(ActivityFeedView, { global: { plugins: [pinia] } })
    expect(wrapper.find('.feed-entity').text()).toBe('Income')
  })

  it('shows entity label for savings-goal', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useActivityFeedStore()
    store.logActivity('user1', 'add', 'savings-goal', 'id1', 'Test')
    const wrapper = mount(ActivityFeedView, { global: { plugins: [pinia] } })
    expect(wrapper.find('.feed-entity').text()).toBe('Savings Goal')
  })

  it('formats timestamp "Just now" for recent activity', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useActivityFeedStore()
    store.logActivity('user1', 'add', 'income', 'id1', 'Test')
    const wrapper = mount(ActivityFeedView, { global: { plugins: [pinia] } })
    expect(wrapper.find('.feed-time').text()).toBe('Just now')
  })

  it('formats timestamp with minutes ago', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useActivityFeedStore()
    const past = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    store.activities.push({
      id: 'x',
      userId: 'u',
      action: 'add',
      entity: 'income',
      entityId: 'e',
      description: 'Test',
      timestamp: past,
    })
    const wrapper = mount(ActivityFeedView, { global: { plugins: [pinia] } })
    expect(wrapper.find('.feed-time').text()).toBe('5m ago')
  })

  it('formats timestamp with hours ago', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useActivityFeedStore()
    const past = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
    store.activities.push({
      id: 'x',
      userId: 'u',
      action: 'add',
      entity: 'income',
      entityId: 'e',
      description: 'Test',
      timestamp: past,
    })
    const wrapper = mount(ActivityFeedView, { global: { plugins: [pinia] } })
    expect(wrapper.find('.feed-time').text()).toBe('3h ago')
  })

  it('formats timestamp with days ago', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useActivityFeedStore()
    const past = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    store.activities.push({
      id: 'x',
      userId: 'u',
      action: 'add',
      entity: 'income',
      entityId: 'e',
      description: 'Test',
      timestamp: past,
    })
    const wrapper = mount(ActivityFeedView, { global: { plugins: [pinia] } })
    expect(wrapper.find('.feed-time').text()).toBe('3d ago')
  })

  it('formats timestamp with date for old entries', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useActivityFeedStore()
    const past = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    store.activities.push({
      id: 'x',
      userId: 'u',
      action: 'add',
      entity: 'income',
      entityId: 'e',
      description: 'Test',
      timestamp: past,
    })
    const wrapper = mount(ActivityFeedView, { global: { plugins: [pinia] } })
    // Should show formatted date like "Mar 22, 2026"
    expect(wrapper.find('.feed-time').text()).toMatch(/\w+ \d+, \d{4}/)
  })

  it('shows userId in feed meta', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useActivityFeedStore()
    store.logActivity('testUser', 'add', 'income', 'id1', 'Test')
    const wrapper = mount(ActivityFeedView, { global: { plugins: [pinia] } })
    expect(wrapper.find('.feed-user').text()).toBe('testUser')
  })
})


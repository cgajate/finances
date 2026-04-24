import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ApprovalsView from '@/views/ApprovalsView.vue'
import { useApprovalsStore } from '@/stores/approvals'

describe('ApprovalsView', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    localStorage.clear()
    pinia = createPinia()
    setActivePinia(pinia)
  })

  function mountView() {
    return mount(ApprovalsView, { global: { plugins: [pinia] } })
  }

  function seedPending() {
    const store = useApprovalsStore()
    store.setEnabled(true)
    store.submitForApproval({
      expenseId: 'e1',
      amount: 600,
      description: 'Office Supplies',
      requestedBy: 'alice',
    })
  }

  function seedApproved() {
    const store = useApprovalsStore()
    store.setEnabled(true)
    const id = store.submitForApproval({
      expenseId: 'e2',
      amount: 800,
      description: 'Server Costs',
      requestedBy: 'bob',
    })
    store.approveRequest(id, 'admin')
  }

  function seedRejected() {
    const store = useApprovalsStore()
    store.setEnabled(true)
    const id = store.submitForApproval({
      expenseId: 'e3',
      amount: 900,
      description: 'Party Expenses',
      requestedBy: 'charlie',
    })
    store.rejectRequest(id, 'admin')
  }

  it('renders the title', () => {
    const wrapper = mountView()
    expect(wrapper.find('h1').text()).toContain('Approvals')
  })

  it('shows Require Approval toggle', () => {
    const wrapper = mountView()
    expect(wrapper.find('.approvals__toggle').exists()).toBe(true)
  })

  it('toggles approval enabled on checkbox change', async () => {
    const store = useApprovalsStore()
    const wrapper = mountView()
    const checkbox = wrapper.find('.approvals__toggle input[type="checkbox"]')
    await checkbox.setValue(true)
    expect(store.approvalEnabled).toBe(true)
  })

  it('shows threshold field when enabled', async () => {
    const store = useApprovalsStore()
    store.setEnabled(true)
    const wrapper = mountView()
    expect(wrapper.find('.approvals__threshold-field').exists()).toBe(true)
  })

  it('hides threshold field when disabled', () => {
    const wrapper = mountView()
    expect(wrapper.find('.approvals__threshold-field').exists()).toBe(false)
  })

  it('renders three tabs', () => {
    const wrapper = mountView()
    const tabs = wrapper.findAll('.approvals__tab')
    expect(tabs).toHaveLength(3)
    expect(tabs[0]!.text()).toContain('Pending')
    expect(tabs[1]!.text()).toContain('Approved')
    expect(tabs[2]!.text()).toContain('Rejected')
  })

  it('pending tab is active by default', () => {
    const wrapper = mountView()
    expect(wrapper.find('.approvals__tab--active').text()).toContain('Pending')
  })

  it('switches tab on click', async () => {
    const wrapper = mountView()
    const tabs = wrapper.findAll('.approvals__tab')
    await tabs[1]!.trigger('click')
    expect(wrapper.findAll('.approvals__tab--active')[0]!.text()).toContain('Approved')
  })

  it('shows empty state when no requests exist', () => {
    const wrapper = mountView()
    expect(wrapper.text()).toContain('No approval requests yet')
  })

  it('shows "No pending requests" when requests exist but none match tab', async () => {
    seedApproved()
    const wrapper = mountView()
    // Active tab is pending, but only approved exists
    expect(wrapper.text()).toContain('No pending requests')
  })

  it('shows pending request in table', () => {
    seedPending()
    const wrapper = mountView()
    expect(wrapper.find('.approvals__table').exists()).toBe(true)
    expect(wrapper.text()).toContain('Office Supplies')
    expect(wrapper.text()).toContain('$600.00')
  })

  it('shows approve and reject icon buttons for pending requests', () => {
    seedPending()
    const wrapper = mountView()
    expect(wrapper.find('.approvals__action-btn--approve').exists()).toBe(true)
    expect(wrapper.find('.approvals__action-btn--reject').exists()).toBe(true)
  })

  it('approves request on approve icon click', async () => {
    seedPending()
    const store = useApprovalsStore()
    const wrapper = mountView()
    await wrapper.find('.approvals__action-btn--approve').trigger('click')
    expect(store.requests[0]!.status).toBe('approved')
  })

  it('rejects request on reject icon click', async () => {
    seedPending()
    const store = useApprovalsStore()
    const wrapper = mountView()
    await wrapper.find('.approvals__action-btn--reject').trigger('click')
    expect(store.requests[0]!.status).toBe('rejected')
  })

  it('shows approved request on Approved tab', async () => {
    seedApproved()
    const wrapper = mountView()
    const tabs = wrapper.findAll('.approvals__tab')
    await tabs[1]!.trigger('click')
    expect(wrapper.text()).toContain('Server Costs')
    expect(wrapper.text()).toContain('admin')
  })

  it('shows rejected request on Rejected tab', async () => {
    seedRejected()
    const wrapper = mountView()
    const tabs = wrapper.findAll('.approvals__tab')
    await tabs[2]!.trigger('click')
    expect(wrapper.text()).toContain('Party Expenses')
  })

  it('does not show action buttons for non-pending requests', async () => {
    seedApproved()
    const wrapper = mountView()
    const tabs = wrapper.findAll('.approvals__tab')
    await tabs[1]!.trigger('click')
    expect(wrapper.find('.approvals__action-btn').exists()).toBe(false)
  })

  it('shows pending count badge', () => {
    seedPending()
    const wrapper = mountView()
    expect(wrapper.find('.approvals__count').exists()).toBe(true)
    expect(wrapper.find('.approvals__count').text()).toBe('1')
  })

  it('does not show pending count badge when 0 pending', () => {
    const wrapper = mountView()
    expect(wrapper.find('.approvals__count').exists()).toBe(false)
  })

  it('shows requestedBy in table row', () => {
    seedPending()
    const wrapper = mountView()
    expect(wrapper.text()).toContain('alice')
  })

  it('shows reviewedBy for resolved requests', async () => {
    seedApproved()
    const wrapper = mountView()
    const tabs = wrapper.findAll('.approvals__tab')
    await tabs[1]!.trigger('click')
    expect(wrapper.text()).toContain('admin')
  })

  it('tabs have proper aria attributes', () => {
    const wrapper = mountView()
    const tablist = wrapper.find('[role="tablist"]')
    expect(tablist.exists()).toBe(true)
    const tabs = wrapper.findAll('[role="tab"]')
    expect(tabs).toHaveLength(3)
    expect(tabs[0]!.attributes('aria-selected')).toBe('true')
  })

  it('updates threshold when CurrencyInput emits value', async () => {
    const store = useApprovalsStore()
    store.setEnabled(true)
    const wrapper = mountView()
    const currencyInput = wrapper.findComponent({ name: 'CurrencyInput' })
    currencyInput.vm.$emit('update:modelValue', 1000)
    await wrapper.vm.$nextTick()
    expect(store.approvalThreshold).toBe(1000)
  })

  it('does not update threshold when CurrencyInput emits null', async () => {
    const store = useApprovalsStore()
    store.setEnabled(true)
    store.setThreshold(500)
    const wrapper = mountView()
    const currencyInput = wrapper.findComponent({ name: 'CurrencyInput' })
    currencyInput.vm.$emit('update:modelValue', null)
    await wrapper.vm.$nextTick()
    expect(store.approvalThreshold).toBe(500)
  })
})

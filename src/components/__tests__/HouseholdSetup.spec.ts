import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref, computed } from 'vue'
import HouseholdSetup from '@/components/HouseholdSetup.vue'

const mockCreateHousehold = vi.fn()
const mockJoinHousehold = vi.fn()
const mockLeaveHousehold = vi.fn()
const mockHouseholdId = ref<string | null>(null)
const mockFirebaseReadyFlag = ref(true)

vi.mock('@/composables/useHousehold', () => ({
  useHousehold: () => ({
    householdId: mockHouseholdId,
    hasHousehold: computed(() => !!mockHouseholdId.value),
    firebaseReady: computed(() => mockFirebaseReadyFlag.value),
    createHousehold: mockCreateHousehold,
    joinHousehold: mockJoinHousehold,
    leaveHousehold: mockLeaveHousehold,
  }),
}))

describe('HouseholdSetup', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    mockHouseholdId.value = null
    mockFirebaseReadyFlag.value = true
    pinia = createPinia()
    setActivePinia(pinia)
  })

  function mountSetup() {
    return mount(HouseholdSetup, {
      global: { plugins: [pinia] },
    })
  }

  it('shows offline banner when firebase is not ready', () => {
    mockFirebaseReadyFlag.value = false
    const wrapper = mountSetup()
    expect(wrapper.text()).toContain('Offline mode')
  })

  it('shows setup card with Create and Join buttons when no household', () => {
    const wrapper = mountSetup()
    expect(wrapper.text()).toContain('Sync with Family')
    expect(wrapper.text()).toContain('Create Household')
    expect(wrapper.text()).toContain('Join Existing')
  })

  it('shows connected banner when has household', () => {
    mockHouseholdId.value = 'XYZ789'
    const wrapper = mountSetup()
    expect(wrapper.text()).toContain('XYZ789')
    expect(wrapper.text()).toContain('synced')
    expect(wrapper.find('.leave-btn').exists()).toBe(true)
  })

  describe('create household', () => {
    it('shows code on success', async () => {
      mockCreateHousehold.mockResolvedValue('ABC123')
      const wrapper = mountSetup()

      await wrapper.find('.setup-btn.create').trigger('click')
      await flushPromises()

      // createHousehold sets householdId
      mockHouseholdId.value = 'ABC123'
      await wrapper.vm.$nextTick()

      expect(mockCreateHousehold).toHaveBeenCalled()
    })

    it('shows error on failure', async () => {
      mockCreateHousehold.mockResolvedValue(null)
      const wrapper = mountSetup()

      await wrapper.find('.setup-btn.create').trigger('click')
      await flushPromises()

      expect(wrapper.text()).toContain('Failed to create household')
    })
  })

  describe('join household', () => {
    it('switches to join form on Join Existing click', async () => {
      const wrapper = mountSetup()
      await wrapper.find('.setup-btn.join').trigger('click')
      expect(wrapper.find('.code-input').exists()).toBe(true)
    })

    it('shows error for empty code', async () => {
      const wrapper = mountSetup()
      await wrapper.find('.setup-btn.join').trigger('click')
      await wrapper.find('form').trigger('submit')
      expect(wrapper.text()).toContain('Enter a household code')
    })

    it('shows error when household not found', async () => {
      mockJoinHousehold.mockResolvedValue(false)
      const wrapper = mountSetup()
      await wrapper.find('.setup-btn.join').trigger('click')
      await wrapper.find('.code-input').setValue('NOPE')
      await wrapper.find('form').trigger('submit')
      await flushPromises()
      expect(wrapper.text()).toContain('Household not found')
    })

    it('back button returns to menu', async () => {
      const wrapper = mountSetup()
      await wrapper.find('.setup-btn.join').trigger('click')
      expect(wrapper.find('.code-input').exists()).toBe(true)
      await wrapper.find('.setup-btn.back').trigger('click')
      expect(wrapper.find('.code-input').exists()).toBe(false)
      expect(wrapper.text()).toContain('Create Household')
    })
  })
})

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

vi.mock('@/composables/useSnackbar', () => ({
  useSnackbar: () => ({
    show: vi.fn(),
  }),
}))

vi.mock('@/lib/firebase', () => ({
  getDb: vi.fn(),
  ensureAuth: vi.fn(),
  isConfigured: vi.fn(() => false),
}))

vi.mock('@/composables/useFirestoreSync', () => ({
  useFirestoreSync: vi.fn(),
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

  function mountSetup(open = true) {
    return mount(HouseholdSetup, {
      props: { open },
      global: {
        plugins: [pinia],
        stubs: { Teleport: true },
      },
    })
  }

  it('does not render when open is false', () => {
    const wrapper = mountSetup(false)
    expect(wrapper.find('.modal-backdrop').exists()).toBe(false)
  })

  it('shows modal with Sync with Family title when open', () => {
    const wrapper = mountSetup()
    expect(wrapper.text()).toContain('Sync with Family')
  })

  it('shows offline status when firebase is not ready', () => {
    mockFirebaseReadyFlag.value = false
    const wrapper = mountSetup()
    expect(wrapper.text()).toContain('Offline mode')
  })

  it('shows Create and Join buttons when no household', () => {
    const wrapper = mountSetup()
    expect(wrapper.text()).toContain('Create Household')
    expect(wrapper.text()).toContain('Join Existing')
  })

  it('shows connected state when has household', () => {
    mockHouseholdId.value = 'XYZ789'
    const wrapper = mountSetup()
    expect(wrapper.text()).toContain('XYZ789')
    expect(wrapper.text()).toContain('Leave Household')
  })

  describe('create household', () => {
    it('calls createHousehold on create click', async () => {
      mockCreateHousehold.mockResolvedValue('ABC123')
      const wrapper = mountSetup()
      await wrapper.find('.modal-btn.primary').trigger('click')
      await flushPromises()
      expect(mockCreateHousehold).toHaveBeenCalled()
    })
  })

  describe('join household', () => {
    it('switches to join form on Join Existing click', async () => {
      const wrapper = mountSetup()
      await wrapper.find('.modal-btn.secondary').trigger('click')
      expect(wrapper.find('.code-input').exists()).toBe(true)
    })

    it('shows error for empty code', async () => {
      const wrapper = mountSetup()
      await wrapper.find('.modal-btn.secondary').trigger('click')
      await wrapper.find('form').trigger('submit')
      expect(wrapper.text()).toContain('Enter a household code')
    })

    it('calls joinHousehold with code', async () => {
      mockJoinHousehold.mockResolvedValue(true)
      const wrapper = mountSetup()
      await wrapper.find('.modal-btn.secondary').trigger('click')
      await wrapper.find('.code-input').setValue('ABC')
      await wrapper.find('form').trigger('submit')
      await flushPromises()
      expect(mockJoinHousehold).toHaveBeenCalledWith('ABC')
    })

    it('back button returns to menu', async () => {
      const wrapper = mountSetup()
      await wrapper.find('.modal-btn.secondary').trigger('click')
      expect(wrapper.find('.code-input').exists()).toBe(true)
      // Click the "Back" button (second button in join-actions)
      const backBtn = wrapper.findAll('.modal-btn.secondary')
      await backBtn[0]!.trigger('click')
      expect(wrapper.find('.code-input').exists()).toBe(false)
    })
  })

  it('emits close on close button', async () => {
    const wrapper = mountSetup()
    await wrapper.find('.modal-close').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })
})

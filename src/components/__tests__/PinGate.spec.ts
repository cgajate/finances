import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, computed } from 'vue'
import PinGate from '@/components/PinGate.vue'

const mockSetPin = vi.fn().mockResolvedValue(undefined)
const mockVerifyPin = vi.fn()
const mockCheckRemembered = vi.fn(() => false)
const mockRemember = vi.fn()
const mockLock = vi.fn()
const mockAuthenticated = ref(false)
const mockHasPinFlag = ref(false)

vi.mock('@/composables/usePin', () => ({
  usePin: () => ({
    authenticated: mockAuthenticated,
    hasPin: computed(() => mockHasPinFlag.value),
    checkRemembered: mockCheckRemembered,
    setPin: mockSetPin,
    verifyPin: mockVerifyPin,
    remember: mockRemember,
    lock: mockLock,
  }),
}))

describe('PinGate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthenticated.value = false
    mockHasPinFlag.value = false
    mockCheckRemembered.mockReturnValue(false)
    mockVerifyPin.mockResolvedValue(false)
  })

  function mountGate() {
    return mount(PinGate, {
      slots: { default: '<div class="protected">Protected Content</div>' },
    })
  }

  it('shows set form when no PIN exists', async () => {
    const wrapper = mountGate()
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.pin-overlay').exists()).toBe(true)
    expect(wrapper.text()).toContain('Create a PIN')
  })

  it('shows verify form when PIN exists', async () => {
    mockHasPinFlag.value = true
    const wrapper = mountGate()
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Enter your PIN to continue')
  })

  it('renders slot when authenticated', () => {
    mockAuthenticated.value = true
    const wrapper = mountGate()
    expect(wrapper.find('.pin-overlay').exists()).toBe(false)
    expect(wrapper.find('.protected').exists()).toBe(true)
  })

  it('skips pin screen when checkRemembered returns true', () => {
    mockCheckRemembered.mockReturnValue(true)
    mockAuthenticated.value = true
    const wrapper = mountGate()
    expect(wrapper.find('.pin-overlay').exists()).toBe(false)
  })

  describe('set PIN form', () => {
    async function mountAndGetInputs() {
      const wrapper = mountGate()
      await wrapper.vm.$nextTick()
      const inputs = wrapper.findAll('.pin-field input')
      return { wrapper, inputs }
    }

    it('shows error for PIN shorter than 4 chars', async () => {
      const { wrapper, inputs } = await mountAndGetInputs()
      await inputs[0]!.setValue('12')
      await inputs[1]!.setValue('12')
      await wrapper.find('form').trigger('submit')
      expect(wrapper.text()).toContain('PIN must be at least 4 characters')
      expect(mockSetPin).not.toHaveBeenCalled()
    })

    it('shows error when PINs do not match', async () => {
      const { wrapper, inputs } = await mountAndGetInputs()
      await inputs[0]!.setValue('1234')
      await inputs[1]!.setValue('5678')
      await wrapper.find('form').trigger('submit')
      expect(wrapper.text()).toContain('PINs do not match')
      expect(mockSetPin).not.toHaveBeenCalled()
    })

    it('calls setPin when valid', async () => {
      const { wrapper, inputs } = await mountAndGetInputs()
      await inputs[0]!.setValue('1234')
      await inputs[1]!.setValue('1234')
      await wrapper.find('form').trigger('submit')
      expect(mockSetPin).toHaveBeenCalledWith('1234')
    })

    it('calls remember when checkbox is checked', async () => {
      const { wrapper, inputs } = await mountAndGetInputs()
      await inputs[0]!.setValue('1234')
      await inputs[1]!.setValue('1234')
      await wrapper.find('input[type="checkbox"]').setValue(true)
      await wrapper.find('form').trigger('submit')
      expect(mockRemember).toHaveBeenCalled()
    })
  })

  describe('verify PIN form', () => {
    beforeEach(() => {
      mockHasPinFlag.value = true
    })

    it('shows error on incorrect PIN', async () => {
      mockVerifyPin.mockResolvedValue(false)
      const wrapper = mountGate()
      await wrapper.vm.$nextTick()
      const inputs = wrapper.findAll('input[type="password"]')
      expect(inputs.length).toBeGreaterThan(0)
      await inputs[0]!.setValue('9999')
      await wrapper.find('form').trigger('submit')
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('Incorrect PIN')
    })

    it('calls verifyPin on submit', async () => {
      mockVerifyPin.mockResolvedValue(true)
      const wrapper = mountGate()
      await wrapper.vm.$nextTick()
      const inputs = wrapper.findAll('input[type="password"]')
      expect(inputs.length).toBeGreaterThan(0)
      await inputs[0]!.setValue('1234')
      await wrapper.find('form').trigger('submit')
      expect(mockVerifyPin).toHaveBeenCalledWith('1234')
    })
  })
})

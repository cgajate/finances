import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref, computed, nextTick } from 'vue'
import AuthGate from '@/components/AuthGate.vue'

const mockLoading = ref(true)
const mockAuthenticated = ref(false)
const mockInitAuth = vi.fn()
const mockSignInWithGoogle = vi.fn()
const mockSignInAnon = vi.fn()

vi.mock('@/composables/useAuth', () => ({
  useAuth: () => ({
    loading: mockLoading,
    authenticated: computed(() => mockAuthenticated.value),
    lastError: ref(''),
    initAuth: mockInitAuth,
    signInWithGoogle: mockSignInWithGoogle,
    signInAnon: mockSignInAnon,
  }),
}))

function mountGate() {
  return mount(AuthGate, {
    slots: { default: '<div class="app-content">App Content</div>' },
  })
}

describe('AuthGate', () => {
  beforeEach(() => {
    mockLoading.value = true
    mockAuthenticated.value = false
    vi.clearAllMocks()
    mockSignInWithGoogle.mockResolvedValue(true)
    mockSignInAnon.mockResolvedValue(true)
  })

  // ─── Lifecycle ───

  it('calls initAuth on mount', () => {
    mountGate()
    expect(mockInitAuth).toHaveBeenCalledOnce()
  })

  // ─── Loading state ───

  it('shows spinner while loading', () => {
    const wrapper = mountGate()
    expect(wrapper.find('.auth-spinner').exists()).toBe(true)
    expect(wrapper.find('.auth-card').exists()).toBe(true)
  })

  it('does not show sign-in card while loading', () => {
    const wrapper = mountGate()
    expect(wrapper.find('.auth-btn--google').exists()).toBe(false)
  })

  it('does not render slot while loading', () => {
    const wrapper = mountGate()
    expect(wrapper.find('.app-content').exists()).toBe(false)
  })

  // ─── Unauthenticated state ───

  it('shows sign-in card when not loading and not authenticated', async () => {
    mockLoading.value = false
    const wrapper = mountGate()
    expect(wrapper.find('.auth-btn--google').exists()).toBe(true)
    expect(wrapper.find('.auth-btn--anon').exists()).toBe(true)
  })

  it('shows logo and title', async () => {
    mockLoading.value = false
    const wrapper = mountGate()
    expect(wrapper.find('.auth-logo-img').exists()).toBe(true)
    expect(wrapper.find('h1').text()).toBe('Montajate Financier')
  })

  it('shows subtitle text', async () => {
    mockLoading.value = false
    const wrapper = mountGate()
    expect(wrapper.find('.auth-subtitle').text()).toBe('Sign in to manage your finances')
  })

  it('shows divider between buttons', async () => {
    mockLoading.value = false
    const wrapper = mountGate()
    expect(wrapper.find('.auth-divider').exists()).toBe(true)
    expect(wrapper.find('.auth-divider').text()).toContain('or')
  })

  it('shows hint about anonymous sessions', async () => {
    mockLoading.value = false
    const wrapper = mountGate()
    expect(wrapper.find('.auth-hint').text()).toContain('Anonymous sessions are local')
  })

  it('does not render slot when not authenticated', async () => {
    mockLoading.value = false
    const wrapper = mountGate()
    expect(wrapper.find('.app-content').exists()).toBe(false)
  })

  it('does not show error by default', async () => {
    mockLoading.value = false
    const wrapper = mountGate()
    expect(wrapper.find('.auth-error').exists()).toBe(false)
  })

  // ─── Authenticated state ───

  it('renders slot content when authenticated', async () => {
    mockLoading.value = false
    mockAuthenticated.value = true
    const wrapper = mountGate()
    expect(wrapper.find('.app-content').exists()).toBe(true)
    expect(wrapper.find('.app-content').text()).toBe('App Content')
  })

  it('does not show auth overlay when authenticated', async () => {
    mockLoading.value = false
    mockAuthenticated.value = true
    const wrapper = mountGate()
    expect(wrapper.find('.auth-overlay').exists()).toBe(false)
  })

  // ─── Google sign-in ───

  it('calls signInWithGoogle on Google button click', async () => {
    mockLoading.value = false
    const wrapper = mountGate()
    await wrapper.find('.auth-btn--google').trigger('click')
    await flushPromises()
    expect(mockSignInWithGoogle).toHaveBeenCalledOnce()
  })

  it('disables buttons during sign-in', async () => {
    mockLoading.value = false
    // Make signInWithGoogle hang
    mockSignInWithGoogle.mockImplementation(() => new Promise(() => {}))
    const wrapper = mountGate()
    await wrapper.find('.auth-btn--google').trigger('click')
    await nextTick()
    expect((wrapper.find('.auth-btn--google').element as HTMLButtonElement).disabled).toBe(true)
    expect((wrapper.find('.auth-btn--anon').element as HTMLButtonElement).disabled).toBe(true)
  })

  it('shows error when Google sign-in fails', async () => {
    mockLoading.value = false
    mockSignInWithGoogle.mockResolvedValue(false)
    const wrapper = mountGate()
    await wrapper.find('.auth-btn--google').trigger('click')
    await flushPromises()
    expect(wrapper.find('.auth-error').exists()).toBe(true)
    expect(wrapper.find('.auth-error').text()).toBe('Google sign-in failed. Please try again.')
  })

  it('does not show error when Google sign-in succeeds', async () => {
    mockLoading.value = false
    mockSignInWithGoogle.mockResolvedValue(true)
    const wrapper = mountGate()
    await wrapper.find('.auth-btn--google').trigger('click')
    await flushPromises()
    expect(wrapper.find('.auth-error').exists()).toBe(false)
  })

  it('re-enables buttons after Google sign-in completes', async () => {
    mockLoading.value = false
    mockSignInWithGoogle.mockResolvedValue(false)
    const wrapper = mountGate()
    await wrapper.find('.auth-btn--google').trigger('click')
    await flushPromises()
    expect((wrapper.find('.auth-btn--google').element as HTMLButtonElement).disabled).toBe(false)
  })

  // ─── Anonymous sign-in ───

  it('calls signInAnon on anonymous button click', async () => {
    mockLoading.value = false
    const wrapper = mountGate()
    await wrapper.find('.auth-btn--anon').trigger('click')
    await flushPromises()
    expect(mockSignInAnon).toHaveBeenCalledOnce()
  })

  it('shows error when anonymous sign-in fails', async () => {
    mockLoading.value = false
    mockSignInAnon.mockResolvedValue(false)
    const wrapper = mountGate()
    await wrapper.find('.auth-btn--anon').trigger('click')
    await flushPromises()
    expect(wrapper.find('.auth-error').exists()).toBe(true)
    expect(wrapper.find('.auth-error').text()).toBe('Anonymous sign-in failed. Please try again.')
  })

  it('does not show error when anonymous sign-in succeeds', async () => {
    mockLoading.value = false
    mockSignInAnon.mockResolvedValue(true)
    const wrapper = mountGate()
    await wrapper.find('.auth-btn--anon').trigger('click')
    await flushPromises()
    expect(wrapper.find('.auth-error').exists()).toBe(false)
  })

  it('re-enables buttons after anonymous sign-in completes', async () => {
    mockLoading.value = false
    mockSignInAnon.mockResolvedValue(false)
    const wrapper = mountGate()
    await wrapper.find('.auth-btn--anon').trigger('click')
    await flushPromises()
    expect((wrapper.find('.auth-btn--anon').element as HTMLButtonElement).disabled).toBe(false)
  })

  // ─── Error clearing ───

  it('clears previous error when starting a new sign-in', async () => {
    mockLoading.value = false
    mockSignInWithGoogle.mockResolvedValue(false)
    const wrapper = mountGate()

    // First: trigger a failure
    await wrapper.find('.auth-btn--google').trigger('click')
    await flushPromises()
    expect(wrapper.find('.auth-error').exists()).toBe(true)

    // Second: start a new sign-in (success)
    mockSignInAnon.mockResolvedValue(true)
    await wrapper.find('.auth-btn--anon').trigger('click')
    await flushPromises()
    expect(wrapper.find('.auth-error').exists()).toBe(false)
  })
})


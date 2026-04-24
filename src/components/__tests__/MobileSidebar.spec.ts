import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'
import MobileSidebar from '@/components/MobileSidebar.vue'

const mockDisplayName = ref('Test User')
const mockPhotoURL = ref('')
const mockIsAnonymous = ref(false)
const mockSignOut = vi.fn()

vi.mock('@/composables/useAuth', () => ({
  useAuth: () => ({
    displayName: mockDisplayName,
    photoURL: mockPhotoURL,
    isAnonymous: mockIsAnonymous,
    signOut: mockSignOut,
  }),
}))

function mountSidebar(open = false) {
  return mount(MobileSidebar, {
    props: { open },
    global: {
      plugins: [createPinia()],
      stubs: {
        'font-awesome-icon': true,
        RouterLink: {
          template: '<a><slot /></a>',
          props: ['to'],
        },
      },
    },
  })
}

describe('MobileSidebar', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    mockSignOut.mockReset()
    mockDisplayName.value = 'Test User'
    mockPhotoURL.value = ''
    mockIsAnonymous.value = false
  })

  it('does not render sidebar or backdrop when closed', () => {
    const wrapper = mountSidebar(false)
    expect(wrapper.find('.sidebar-backdrop').exists()).toBe(false)
    expect(wrapper.find('.mobile-sidebar').exists()).toBe(false)
  })

  it('renders sidebar and backdrop when open', () => {
    const wrapper = mountSidebar(true)
    expect(wrapper.find('.sidebar-backdrop').exists()).toBe(true)
    expect(wrapper.find('.mobile-sidebar').exists()).toBe(true)
  })

  it('renders the logo and title in the header', () => {
    const wrapper = mountSidebar(true)
    expect(wrapper.find('.sidebar-logo').exists()).toBe(true)
    expect(wrapper.find('.sidebar-title').text()).toBe('Montajate Financier')
  })

  it('renders all 5 navigation links', () => {
    const wrapper = mountSidebar(true)
    const links = wrapper.findAll('.sidebar-link')
    expect(links).toHaveLength(5)
    const texts = links.map((l) => l.text())
    expect(texts).toContain('Dashboard')
    expect(texts).toContain('Finances')
    expect(texts).toContain('Goals')
    expect(texts).toContain('Calendar')
    expect(texts).toContain('Analytics')
  })

  it('emits close when backdrop is clicked', async () => {
    const wrapper = mountSidebar(true)
    await wrapper.find('.sidebar-backdrop').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('emits close when a navigation link is clicked', async () => {
    const wrapper = mountSidebar(true)
    const links = wrapper.findAll('.sidebar-link')
    await links[0]!.trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  describe('user footer', () => {
    it('shows user footer when not anonymous', () => {
      const wrapper = mountSidebar(true)
      expect(wrapper.find('.sidebar-footer').exists()).toBe(true)
      expect(wrapper.find('.sidebar-user-name').text()).toBe('Test User')
    })

    it('shows avatar fallback icon when no photoURL', () => {
      const wrapper = mountSidebar(true)
      expect(wrapper.find('.sidebar-avatar-fallback').exists()).toBe(true)
      expect(wrapper.find('.sidebar-avatar').exists()).toBe(false)
    })

    it('calls signOut and emits close when logout button is clicked', async () => {
      const wrapper = mountSidebar(true)
      await wrapper.find('.sidebar-logout').trigger('click')
      expect(mockSignOut).toHaveBeenCalledOnce()
      expect(wrapper.emitted('close')).toHaveLength(1)
    })

    it('logout button has accessible name', () => {
      const wrapper = mountSidebar(true)
      const btn = wrapper.find('.sidebar-logout')
      expect(btn.exists()).toBe(true)
      expect(btn.attributes('aria-label')).toBe('Sign Out')
    })
  })

  describe('avatar with photoURL', () => {
    it('renders avatar image when photoURL is set', () => {
      mockPhotoURL.value = 'https://example.com/avatar.jpg'
      const wrapper = mountSidebar(true)
      expect(wrapper.find('.sidebar-avatar').exists()).toBe(true)
      expect(wrapper.find('.sidebar-avatar').attributes('src')).toBe('https://example.com/avatar.jpg')
      expect(wrapper.find('.sidebar-avatar-fallback').exists()).toBe(false)
    })

    it('retries avatar load once on error with cache-busting param', async () => {
      mockPhotoURL.value = 'https://example.com/avatar.jpg'
      const wrapper = mountSidebar(true)
      const img = wrapper.find('.sidebar-avatar')

      await img.trigger('error')
      expect(img.element.getAttribute('src')).toContain('?t=')

      // Second error should not change src
      const srcAfterRetry = img.element.getAttribute('src')
      await img.trigger('error')
      expect(img.element.getAttribute('src')).toBe(srcAfterRetry)
    })

    it('handles avatar error when photoURL contains query params', async () => {
      mockPhotoURL.value = 'https://example.com/avatar.jpg?size=100'
      const wrapper = mountSidebar(true)
      const img = wrapper.find('.sidebar-avatar')

      await img.trigger('error')
      expect(img.element.getAttribute('src')).toContain('&t=')
    })
  })

  describe('anonymous user', () => {
    it('hides footer when user is anonymous', () => {
      mockIsAnonymous.value = true
      const wrapper = mountSidebar(true)
      expect(wrapper.find('.sidebar-footer').exists()).toBe(false)
    })
  })
})

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { nextTick, ref } from 'vue'
import App from '../App.vue'

vi.mock('@/components/PinGate.vue', () => ({
  default: { name: 'PinGate', template: '<slot />' },
}))

vi.mock('@/components/NotificationPanel.vue', () => ({
  default: { name: 'NotificationPanel', template: '<div class="notification-panel-mock" />' },
}))

vi.mock('@/components/HouseholdSetup.vue', () => ({
  default: {
    name: 'HouseholdSetup',
    template: '<div class="household-mock" />',
    props: ['open'],
    emits: ['close'],
  },
}))

vi.mock('@/components/SnackbarNotification.vue', () => ({
  default: { name: 'SnackbarNotification', template: '<div class="snackbar-mock" />' },
}))

const hasHouseholdRef = ref(false)
vi.mock('@/composables/useHousehold', () => ({
  useHousehold: () => ({ hasHousehold: hasHouseholdRef }),
}))

function makeRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div>Dashboard</div>' } },
      { path: '/finances', component: { template: '<div>Finances</div>' } },
      { path: '/analytics', component: { template: '<div>Analytics</div>' } },
      { path: '/goals', component: { template: '<div>Goals</div>' } },
      { path: '/calendar', component: { template: '<div>Calendar</div>' } },
      { path: '/categories', component: { template: '<div>Categories</div>' } },
    ],
  })
}

async function mountApp() {
  const router = makeRouter()
  router.push('/')
  await router.isReady()
  const wrapper = mount(App, {
    global: { plugins: [createPinia(), router] },
    attachTo: document.body,
  })
  await flushPromises()
  return { wrapper, router }
}

describe('App', () => {
  beforeEach(() => {
    hasHouseholdRef.value = false
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  // ─── Header & Logo ───

  it('renders the logo image', async () => {
    const { wrapper } = await mountApp()
    expect(wrapper.find('.logo-img').exists()).toBe(true)
  })

  it('renders the app header', async () => {
    const { wrapper } = await mountApp()
    expect(wrapper.find('.app-header').exists()).toBe(true)
  })

  it('renders the logo text when not collapsed', async () => {
    const { wrapper } = await mountApp()
    const headerVm = wrapper.findComponent({ name: 'AppHeader' }).vm as any
    headerVm.internalCollapsed = false
    await nextTick()
    expect(wrapper.find('.logo-text').exists()).toBe(true)
    expect(wrapper.find('.logo-text').text()).toBe('Montajate Financier')
  })

  // ─── Navigation ───

  it('renders navigation badges', async () => {
    const { wrapper } = await mountApp()
    const badges = wrapper.findAll('.nav-badge')
    expect(badges.length).toBeGreaterThan(0)
  })

  it('renders expected nav links', async () => {
    const { wrapper } = await mountApp()
    const nav = wrapper.find('.desktop-nav')
    expect(nav.text()).toContain('Finances')
    expect(nav.text()).toContain('Analytics')
    expect(nav.text()).toContain('Goals')
    expect(nav.text()).toContain('Calendar')
  })

  it('does not show Categories in the nav bar', async () => {
    const { wrapper } = await mountApp()
    const nav = wrapper.find('.desktop-nav')
    expect(nav.text()).not.toContain('Categories')
  })

  // ─── Sync button ───

  it('renders the sync button', async () => {
    const { wrapper } = await mountApp()
    expect(wrapper.find('.sync-btn').exists()).toBe(true)
  })

  it('shows "Local" when not connected', async () => {
    const { wrapper } = await mountApp()
    const syncStatus = wrapper.find('.sync-status')
    expect(syncStatus.exists()).toBe(true)
    expect(syncStatus.text()).toBe('Local')
  })

  it('shows "Synced" when household is connected', async () => {
    hasHouseholdRef.value = true
    const { wrapper } = await mountApp()
    expect(wrapper.find('.sync-status').text()).toBe('Synced')
    expect(wrapper.find('.sync-btn').classes()).toContain('connected')
    expect(wrapper.find('.sync-status').classes()).toContain('active')
  })

  it('opens household setup modal on sync button click', async () => {
    const { wrapper } = await mountApp()
    await wrapper.find('.sync-btn').trigger('click')
    const household = wrapper.findComponent({ name: 'HouseholdSetup' })
    expect(household.props('open')).toBe(true)
  })

  // ─── Theme dropdown ───

  it('renders the theme toggle button', async () => {
    const { wrapper } = await mountApp()
    const themeWrapper = wrapper.find('.theme-dropdown-wrapper')
    expect(themeWrapper.exists()).toBe(true)
    expect(themeWrapper.find('.icon-btn').exists()).toBe(true)
  })

  it('opens theme menu on click', async () => {
    const { wrapper } = await mountApp()
    const themeBtn = wrapper.find('.theme-dropdown-wrapper .icon-btn')
    expect(wrapper.find('.theme-bubble').exists()).toBe(false)
    await themeBtn.trigger('click')
    expect(wrapper.find('.theme-bubble').exists()).toBe(true)
  })

  it('closes theme menu on backdrop click', async () => {
    const { wrapper } = await mountApp()
    await wrapper.find('.theme-dropdown-wrapper .icon-btn').trigger('click')
    expect(wrapper.find('.theme-bubble').exists()).toBe(true)
    await wrapper.find('.theme-backdrop').trigger('click')
    expect(wrapper.find('.theme-bubble').exists()).toBe(false)
  })

  it('renders theme options inside the bubble', async () => {
    const { wrapper } = await mountApp()
    await wrapper.find('.theme-dropdown-wrapper .icon-btn').trigger('click')
    const options = wrapper.findAll('.theme-option')
    expect(options.length).toBe(3)
  })

  it('toggles dark mode on first option click', async () => {
    const { wrapper } = await mountApp()
    await wrapper.find('.theme-dropdown-wrapper .icon-btn').trigger('click')
    const options = wrapper.findAll('.theme-option')
    await options[0]!.trigger('click')
    expect(wrapper.find('.theme-bubble').exists()).toBe(true)
  })

  it('sets system theme on second option click', async () => {
    const { wrapper } = await mountApp()
    await wrapper.find('.theme-dropdown-wrapper .icon-btn').trigger('click')
    const options = wrapper.findAll('.theme-option')
    await options[1]!.trigger('click')
    expect(options[1]!.classes()).toContain('active')
  })

  it('toggles high contrast on third option click', async () => {
    const { wrapper } = await mountApp()
    await wrapper.find('.theme-dropdown-wrapper .icon-btn').trigger('click')
    const options = wrapper.findAll('.theme-option')
    await options[2]!.trigger('click')
    expect(wrapper.find('.theme-bubble').exists()).toBe(true)
  })

  it('closes theme menu when clicking the button again', async () => {
    const { wrapper } = await mountApp()
    const themeBtn = wrapper.find('.theme-dropdown-wrapper .icon-btn')
    await themeBtn.trigger('click')
    expect(wrapper.find('.theme-bubble').exists()).toBe(true)
    await themeBtn.trigger('click')
    expect(wrapper.find('.theme-bubble').exists()).toBe(false)
  })

  // ─── Admin dropdown ───

  it('renders the admin button with gear icon', async () => {
    const { wrapper } = await mountApp()
    const adminWrapper = wrapper.find('.admin-dropdown-wrapper')
    expect(adminWrapper.exists()).toBe(true)
    expect(adminWrapper.find('.icon-btn').exists()).toBe(true)
  })

  it('opens admin menu on click', async () => {
    const { wrapper } = await mountApp()
    const adminBtn = wrapper.find('.admin-dropdown-wrapper .icon-btn')
    expect(wrapper.find('.admin-bubble').exists()).toBe(false)
    await adminBtn.trigger('click')
    expect(wrapper.find('.admin-bubble').exists()).toBe(true)
  })

  it('closes admin menu on backdrop click', async () => {
    const { wrapper } = await mountApp()
    await wrapper.find('.admin-dropdown-wrapper .icon-btn').trigger('click')
    expect(wrapper.find('.admin-bubble').exists()).toBe(true)
    await wrapper.find('.admin-backdrop').trigger('click')
    expect(wrapper.find('.admin-bubble').exists()).toBe(false)
  })

  it('shows Categories option in admin menu', async () => {
    const { wrapper } = await mountApp()
    await wrapper.find('.admin-dropdown-wrapper .icon-btn').trigger('click')
    const option = wrapper.find('.admin-option')
    expect(option.exists()).toBe(true)
    expect(option.text()).toContain('Categories')
  })

  it('Categories option links to /categories', async () => {
    const { wrapper } = await mountApp()
    await wrapper.find('.admin-dropdown-wrapper .icon-btn').trigger('click')
    const option = wrapper.find('.admin-option')
    expect(option.attributes('href')).toBe('/categories')
  })

  it('closes admin menu when Categories is clicked', async () => {
    const { wrapper } = await mountApp()
    await wrapper.find('.admin-dropdown-wrapper .icon-btn').trigger('click')
    await wrapper.find('.admin-option').trigger('click')
    await flushPromises()
    expect(wrapper.find('.admin-bubble').exists()).toBe(false)
  })

  it('closes admin menu when clicking the button again', async () => {
    const { wrapper } = await mountApp()
    const adminBtn = wrapper.find('.admin-dropdown-wrapper .icon-btn')
    await adminBtn.trigger('click')
    expect(wrapper.find('.admin-bubble').exists()).toBe(true)
    await adminBtn.trigger('click')
    expect(wrapper.find('.admin-bubble').exists()).toBe(false)
  })

  // ─── Notification Panel ───

  it('renders the notification panel', async () => {
    const { wrapper } = await mountApp()
    expect(wrapper.find('.notification-panel-mock').exists()).toBe(true)
  })

  // ─── SnackbarNotification ───

  it('renders the snackbar notification component', async () => {
    const { wrapper } = await mountApp()
    expect(wrapper.find('.snackbar-mock').exists()).toBe(true)
  })

  // ─── Mobile sidebar / hamburger ───

  it('does not show hamburger when not collapsed', async () => {
    const { wrapper } = await mountApp()
    const headerVm = wrapper.findComponent({ name: 'AppHeader' }).vm as any
    headerVm.internalCollapsed = false
    await nextTick()
    expect(wrapper.find('.menu-toggle').exists()).toBe(false)
  })

  it('shows hamburger and hides nav when collapsed', async () => {
    const { wrapper } = await mountApp()
    const headerVm = wrapper.findComponent({ name: 'AppHeader' }).vm as any
    headerVm.internalCollapsed = true
    await nextTick()
    expect(wrapper.find('.menu-toggle').exists()).toBe(true)
    expect(wrapper.find('.desktop-nav').classes()).toContain('nav-hidden')
  })

  it('toggles mobile sidebar on hamburger click', async () => {
    const { wrapper } = await mountApp()
    const headerVm = wrapper.findComponent({ name: 'AppHeader' }).vm as any
    headerVm.internalCollapsed = true
    await nextTick()
    expect(wrapper.find('.mobile-sidebar').exists()).toBe(false)
    await wrapper.find('.menu-toggle').trigger('click')
    expect(wrapper.find('.mobile-sidebar').exists()).toBe(true)
  })

  it('closes mobile sidebar on backdrop click', async () => {
    const { wrapper } = await mountApp()
    const headerVm = wrapper.findComponent({ name: 'AppHeader' }).vm as any
    headerVm.internalCollapsed = true
    await nextTick()
    await wrapper.find('.menu-toggle').trigger('click')
    expect(wrapper.find('.mobile-sidebar').exists()).toBe(true)
    await wrapper.find('.sidebar-backdrop').trigger('click')
    expect(wrapper.find('.mobile-sidebar').exists()).toBe(false)
  })

  it('renders all sidebar links', async () => {
    const { wrapper } = await mountApp()
    const headerVm = wrapper.findComponent({ name: 'AppHeader' }).vm as any
    headerVm.internalCollapsed = true
    await nextTick()
    await wrapper.find('.menu-toggle').trigger('click')
    const links = wrapper.findAll('.sidebar-link')
    expect(links.length).toBe(5)
    expect(wrapper.find('.mobile-sidebar').text()).toContain('Dashboard')
    expect(wrapper.find('.mobile-sidebar').text()).toContain('Finances')
    expect(wrapper.find('.mobile-sidebar').text()).toContain('Analytics')
    expect(wrapper.find('.mobile-sidebar').text()).toContain('Goals')
    expect(wrapper.find('.mobile-sidebar').text()).toContain('Calendar')
  })

  it('does not show Categories in mobile sidebar', async () => {
    const { wrapper } = await mountApp()
    const headerVm = wrapper.findComponent({ name: 'AppHeader' }).vm as any
    headerVm.internalCollapsed = true
    await nextTick()
    await wrapper.find('.menu-toggle').trigger('click')
    expect(wrapper.find('.mobile-sidebar').text()).not.toContain('Categories')
  })

  it('closes mobile sidebar when a link is clicked', async () => {
    const { wrapper } = await mountApp()
    const headerVm = wrapper.findComponent({ name: 'AppHeader' }).vm as any
    headerVm.internalCollapsed = true
    await nextTick()
    await wrapper.find('.menu-toggle').trigger('click')
    expect(wrapper.find('.mobile-sidebar').exists()).toBe(true)
    const links = wrapper.findAll('.sidebar-link')
    await links[0]!.trigger('click')
    await flushPromises()
    expect(wrapper.find('.mobile-sidebar').exists()).toBe(false)
  })

  it('renders sidebar header with logo and title', async () => {
    const { wrapper } = await mountApp()
    const headerVm = wrapper.findComponent({ name: 'AppHeader' }).vm as any
    headerVm.internalCollapsed = true
    await nextTick()
    await wrapper.find('.menu-toggle').trigger('click')
    expect(wrapper.find('.sidebar-logo').exists()).toBe(true)
    expect(wrapper.find('.sidebar-title').text()).toBe('Montajate Financier')
  })

  it('shows xmark icon when menu is open', async () => {
    const { wrapper } = await mountApp()
    const headerVm = wrapper.findComponent({ name: 'AppHeader' }).vm as any
    headerVm.internalCollapsed = true
    headerVm.menuOpen = true
    await nextTick()
    const toggle = wrapper.find('.menu-toggle')
    expect(toggle.exists()).toBe(true)
  })

  // ─── checkOverflow ───

  it('calls checkOverflow on mount and adds resize listener', async () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    const { wrapper } = await mountApp()
    expect(addSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    addSpy.mockRestore()
  })

  it('removes resize listener on unmount', async () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const { wrapper } = await mountApp()
    wrapper.unmount()
    expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    removeSpy.mockRestore()
  })

  it('checkOverflow sets collapsed based on available width', async () => {
    const { wrapper } = await mountApp()
    const headerVm = wrapper.findComponent({ name: 'AppHeader' }).vm as any
    headerVm.checkOverflow()
    await nextTick()
    expect(typeof headerVm.internalCollapsed).toBe('boolean')
  })

  it('checkOverflow does not run when headerRef is null', async () => {
    const { wrapper } = await mountApp()
    const headerVm = wrapper.findComponent({ name: 'AppHeader' }).vm as any
    headerVm.headerRef = null
    headerVm.checkOverflow()
    expect(headerVm.internalCollapsed).toBeDefined()
  })

  it('checkOverflow does not run when navRef is null', async () => {
    const { wrapper } = await mountApp()
    const headerVm = wrapper.findComponent({ name: 'AppHeader' }).vm as any
    headerVm.navRef = null
    headerVm.checkOverflow()
    expect(headerVm.internalCollapsed).toBeDefined()
  })

  it('checkOverflow uses cached nav width on second call', async () => {
    const { wrapper } = await mountApp()
    const headerVm = wrapper.findComponent({ name: 'AppHeader' }).vm as any
    headerVm.checkOverflow()
    headerVm.checkOverflow()
    expect(typeof headerVm.internalCollapsed).toBe('boolean')
  })

  it('checkOverflow handles missing header-actions element', async () => {
    const { wrapper } = await mountApp()
    const headerVm = wrapper.findComponent({ name: 'AppHeader' }).vm as any
    const fakeHeader = {
      offsetWidth: 1200,
      querySelector: () => null,
    }
    headerVm.headerRef = fakeHeader
    headerVm.checkOverflow()
    expect(typeof headerVm.internalCollapsed).toBe('boolean')
  })

  it('checkOverflow does not collapse when header is wide enough', async () => {
    const { wrapper } = await mountApp()
    const headerVm = wrapper.findComponent({ name: 'AppHeader' }).vm as any
    const fakeRight = { offsetWidth: 90 }
    const fakeHeader = {
      offsetWidth: 2000,
      querySelector: () => fakeRight,
    }
    headerVm.headerRef = fakeHeader
    headerVm.checkOverflow()
    expect(headerVm.internalCollapsed).toBe(false)
  })

  it('checkOverflow skips nav measurement when cachedNavWidth is set', async () => {
    const { wrapper } = await mountApp()
    const headerVm = wrapper.findComponent({ name: 'AppHeader' }).vm as any
    const nav = headerVm.navRef as HTMLElement
    Object.defineProperty(nav, 'scrollWidth', { value: 500, configurable: true })
    headerVm.checkOverflow()
    headerVm.checkOverflow()
    expect(typeof headerVm.internalCollapsed).toBe('boolean')
  })

  it('closeMenu sets menuOpen to false', async () => {
    const { wrapper } = await mountApp()
    const vm = wrapper.vm as any
    vm.menuOpen = true
    await nextTick()
    vm.menuOpen = false
    await nextTick()
    expect(vm.menuOpen).toBe(false)
  })

  // ─── Main content ───

  it('renders the main content area with router view', async () => {
    const { wrapper } = await mountApp()
    expect(wrapper.find('.app-main').exists()).toBe(true)
    expect(wrapper.find('.app-main').text()).toContain('Dashboard')
  })

  // ─── HouseholdSetup close ───

  it('closes sync modal when HouseholdSetup emits close', async () => {
    const { wrapper } = await mountApp()
    await wrapper.find('.sync-btn').trigger('click')
    const household = wrapper.findComponent({ name: 'HouseholdSetup' })
    expect(household.props('open')).toBe(true)
    household.vm.$emit('close')
    await nextTick()
    expect((wrapper.vm as any).syncModalOpen).toBe(false)
  })
})

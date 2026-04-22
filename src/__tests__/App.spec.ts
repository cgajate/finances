import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from '../App.vue'

vi.mock('@/components/PinGate.vue', () => ({
  default: { name: 'PinGate', template: '<slot />' },
}))

vi.mock('@/components/HouseholdSetup.vue', () => ({
  default: { name: 'HouseholdSetup', template: '<div class="household-mock" />', props: ['open'] },
}))

vi.mock('@/components/SnackbarNotification.vue', () => ({
  default: { name: 'SnackbarNotification', template: '<div />' },
}))

vi.mock('@/composables/useHousehold', () => ({
  useHousehold: () => ({ hasHousehold: { value: false } }),
}))

function makeRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div>Dashboard</div>' } },
      { path: '/income', component: { template: '<div>Income</div>' } },
      { path: '/expenses', component: { template: '<div>Expenses</div>' } },
      { path: '/analytics', component: { template: '<div>Analytics</div>' } },
    ],
  })
}

describe('App', () => {
  it('renders the logo image', () => {
    const router = makeRouter()
    const wrapper = mount(App, {
      global: { plugins: [createPinia(), router] },
    })
    expect(wrapper.find('.logo-img').exists()).toBe(true)
  })

  it('renders the app title when not collapsed', () => {
    const router = makeRouter()
    const wrapper = mount(App, {
      global: { plugins: [createPinia(), router] },
    })
    // The title or nav badges should be present
    expect(wrapper.find('.app-header').exists()).toBe(true)
  })

  it('renders navigation badges', () => {
    const router = makeRouter()
    const wrapper = mount(App, {
      global: { plugins: [createPinia(), router] },
    })
    const badges = wrapper.findAll('.nav-badge')
    expect(badges.length).toBeGreaterThan(0)
  })
})

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from '../App.vue'

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
  it('renders the logo', () => {
    const router = makeRouter()
    const wrapper = mount(App, {
      global: { plugins: [createPinia(), router] },
    })
    expect(wrapper.text()).toContain('Family Finances')
  })

  it('renders navigation links', () => {
    const router = makeRouter()
    const wrapper = mount(App, {
      global: { plugins: [createPinia(), router] },
    })
    expect(wrapper.text()).toContain('Dashboard')
    expect(wrapper.text()).toContain('Income')
    expect(wrapper.text()).toContain('Expenses')
    expect(wrapper.text()).toContain('Analytics')
  })

  it('toggles mobile menu', async () => {
    const router = makeRouter()
    const wrapper = mount(App, {
      global: { plugins: [createPinia(), router] },
    })
    const menuBtn = wrapper.find('.menu-toggle')
    expect(menuBtn.exists()).toBe(true)
    await menuBtn.trigger('click')
    expect(wrapper.find('nav').classes()).toContain('open')
    await menuBtn.trigger('click')
    expect(wrapper.find('nav').classes()).not.toContain('open')
  })
})

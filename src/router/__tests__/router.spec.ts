import { describe, it, expect } from 'vitest'
import router from '@/router/index'

describe('router', () => {
  it('has a dashboard route at /', () => {
    const route = router.resolve('/')
    expect(route.name).toBe('dashboard')
  })

  it('has an income route at /income', () => {
    const route = router.resolve('/income')
    expect(route.name).toBe('income')
  })

  it('has an edit-income route at /income/:id/edit', () => {
    const route = router.resolve('/income/abc123/edit')
    expect(route.name).toBe('edit-income')
    expect(route.params.id).toBe('abc123')
  })

  it('has an expenses route at /expenses', () => {
    const route = router.resolve('/expenses')
    expect(route.name).toBe('expenses')
  })

  it('has an edit-expense route at /expenses/:id/edit', () => {
    const route = router.resolve('/expenses/xyz789/edit')
    expect(route.name).toBe('edit-expense')
    expect(route.params.id).toBe('xyz789')
  })

  it('has an analytics route at /analytics', () => {
    const route = router.resolve('/analytics')
    expect(route.name).toBe('analytics')
  })

  it('has 6 routes total', () => {
    expect(router.getRoutes()).toHaveLength(6)
  })
})


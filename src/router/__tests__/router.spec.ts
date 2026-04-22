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

  it('has an add-income route at /income/add', () => {
    const route = router.resolve('/income/add')
    expect(route.name).toBe('add-income')
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

  it('has an add-expense route at /expenses/add', () => {
    const route = router.resolve('/expenses/add')
    expect(route.name).toBe('add-expense')
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

  it('has a budgets route at /budgets', () => {
    const route = router.resolve('/budgets')
    expect(route.name).toBe('budgets')
  })

  it('has a savings route at /savings', () => {
    const route = router.resolve('/savings')
    expect(route.name).toBe('savings')
  })

  it('has a year-review route at /year-review', () => {
    const route = router.resolve('/year-review')
    expect(route.name).toBe('year-review')
  })

  it('has a calendar route at /calendar', () => {
    const route = router.resolve('/calendar')
    expect(route.name).toBe('calendar')
  })

  it('has an activity route at /activity', () => {
    const route = router.resolve('/activity')
    expect(route.name).toBe('activity')
  })

  it('has a categories route at /categories', () => {
    const route = router.resolve('/categories')
    expect(route.name).toBe('categories')
  })

  it('has 14 routes total', () => {
    expect(router.getRoutes()).toHaveLength(14)
  })
})

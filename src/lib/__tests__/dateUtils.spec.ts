import { describe, it, expect, vi, afterEach } from 'vitest'
import { advanceDate, advanceToFuture, getNextDueDate } from '@/lib/dateUtils'

describe('advanceDate', () => {
  it('advances weekly by 7 days', () => {
    expect(advanceDate('2026-04-01', 'weekly')).toBe('2026-04-08')
  })

  it('advances bi-weekly by 14 days', () => {
    expect(advanceDate('2026-04-01', 'bi-weekly')).toBe('2026-04-15')
  })

  it('advances monthly by 1 month', () => {
    expect(advanceDate('2026-04-15', 'monthly')).toBe('2026-05-15')
  })

  it('advances quarterly by 3 months', () => {
    expect(advanceDate('2026-01-15', 'quarterly')).toBe('2026-04-15')
  })

  it('advances yearly by 1 year', () => {
    expect(advanceDate('2026-04-01', 'yearly')).toBe('2027-04-01')
  })

  it('handles month rollover', () => {
    expect(advanceDate('2026-12-15', 'monthly')).toBe('2027-01-15')
  })

  it('handles year rollover for weekly', () => {
    expect(advanceDate('2026-12-28', 'weekly')).toBe('2027-01-04')
  })
})

describe('advanceToFuture', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns the same date if already in the future', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-01T12:00:00'))
    expect(advanceToFuture('2026-05-01', 'monthly')).toBe('2026-05-01')
  })

  it('advances a past date to the future', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-22T12:00:00'))
    const result = advanceToFuture('2026-01-01', 'monthly')
    expect(new Date(result + 'T00:00:00').getTime()).toBeGreaterThanOrEqual(
      new Date('2026-04-22T00:00:00').getTime(),
    )
  })

  it('returns today if date matches today', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-15T12:00:00'))
    expect(advanceToFuture('2026-04-15', 'monthly')).toBe('2026-04-15')
  })
})

describe('getNextDueDate', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('is an alias for advanceToFuture', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-22T12:00:00'))
    expect(getNextDueDate('2026-01-15', 'monthly')).toBe(
      advanceToFuture('2026-01-15', 'monthly'),
    )
  })
})


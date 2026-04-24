import { describe, it, expect } from 'vitest'
import { getEffectiveAmount } from '@/lib/overrides'

describe('getEffectiveAmount', () => {
  it('returns base amount when no overrides', () => {
    expect(getEffectiveAmount(300, undefined, '2026-04')).toBe(300)
  })

  it('returns base amount when overrides is empty', () => {
    expect(getEffectiveAmount(300, {}, '2026-04')).toBe(300)
  })

  it('returns base amount when month has no override', () => {
    expect(getEffectiveAmount(300, { '2026-03': 200 }, '2026-04')).toBe(300)
  })

  it('returns override amount when month has an override', () => {
    expect(getEffectiveAmount(300, { '2026-04': 200 }, '2026-04')).toBe(200)
  })

  it('returns zero override', () => {
    expect(getEffectiveAmount(300, { '2026-04': 0 }, '2026-04')).toBe(0)
  })

  it('handles multiple overrides and picks correct month', () => {
    const overrides = { '2026-03': 250, '2026-04': 200, '2026-05': 350 }
    expect(getEffectiveAmount(300, overrides, '2026-03')).toBe(250)
    expect(getEffectiveAmount(300, overrides, '2026-04')).toBe(200)
    expect(getEffectiveAmount(300, overrides, '2026-05')).toBe(350)
    expect(getEffectiveAmount(300, overrides, '2026-06')).toBe(300)
  })
})


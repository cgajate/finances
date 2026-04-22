import { describe, it, expect } from 'vitest'
import { formatCurrency } from '@/lib/formatCurrency'

describe('formatCurrency', () => {
  it('formats a positive number as USD', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56')
  })

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0.00')
  })

  it('formats a negative number', () => {
    expect(formatCurrency(-50)).toBe('-$50.00')
  })

  it('formats a large number with commas', () => {
    expect(formatCurrency(1000000)).toBe('$1,000,000.00')
  })

  it('rounds to two decimal places', () => {
    expect(formatCurrency(99.999)).toBe('$100.00')
  })
})


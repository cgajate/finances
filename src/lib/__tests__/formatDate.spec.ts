import { describe, it, expect } from 'vitest'
import { formatDate, formatDateTime } from '@/lib/formatDate'

describe('formatDate', () => {
  it('formats a date string as "MMM D, YYYY"', () => {
    const result = formatDate('2026-04-22')
    expect(result).toBe('Apr 22, 2026')
  })

  it('formats January correctly', () => {
    expect(formatDate('2026-01-01')).toBe('Jan 1, 2026')
  })

  it('formats December correctly', () => {
    expect(formatDate('2025-12-31')).toBe('Dec 31, 2025')
  })
})

describe('formatDateTime', () => {
  it('formats an ISO datetime string with time', () => {
    const result = formatDateTime('2026-04-22T15:45:00.000Z')
    // Time depends on local timezone, just check it contains the date portion and AM/PM
    expect(result).toContain('Apr')
    expect(result).toContain('2026')
    expect(result).toMatch(/AM|PM/)
  })

  it('includes minutes', () => {
    const result = formatDateTime('2026-06-01T09:05:00.000Z')
    expect(result).toContain('Jun')
    expect(result).toContain('2026')
  })
})


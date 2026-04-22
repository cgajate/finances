/**
 * Shared date arithmetic utilities for recurring income/expense scheduling.
 */
import type { Frequency } from '@/types/finance'

/** Advance a date by one period based on frequency */
export function advanceDate(dateStr: string, frequency: Frequency): string {
  const d = new Date(dateStr + 'T00:00:00')
  switch (frequency) {
    case 'weekly':
      d.setDate(d.getDate() + 7)
      break
    case 'bi-weekly':
      d.setDate(d.getDate() + 14)
      break
    case 'monthly':
      d.setMonth(d.getMonth() + 1)
      break
    case 'quarterly':
      d.setMonth(d.getMonth() + 3)
      break
    case 'yearly':
      d.setFullYear(d.getFullYear() + 1)
      break
  }
  return d.toISOString().split('T')[0] ?? dateStr
}

/** Advance a date forward until it is today or in the future */
export function advanceToFuture(dateStr: string, frequency: Frequency): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let current = dateStr
  // Safety limit to avoid infinite loops
  for (let i = 0; i < 1000; i++) {
    const d = new Date(current + 'T00:00:00')
    if (d >= today) break
    current = advanceDate(current, frequency)
  }
  return current
}

/** Alias for advanceToFuture — get the next upcoming date for a recurring item */
export function getNextDueDate(dateStr: string, frequency: Frequency): string {
  return advanceToFuture(dateStr, frequency)
}


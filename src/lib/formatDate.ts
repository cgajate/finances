/**
 * Shared date formatting utilities using Intl.DateTimeFormat.
 * Timezone-aware, zero dependencies.
 */

/** Format a date-only string (YYYY-MM-DD) for display: "Apr 22, 2026" */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

/** Format an ISO datetime string for display: "Apr 22, 2026, 3:45 PM" */
export function formatDateTime(isoStr: string): string {
  const date = new Date(isoStr)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}


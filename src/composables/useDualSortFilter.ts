import { reactive } from 'vue'
import { useSortFilter } from '@/composables/useSortFilter'
import type { Ref } from 'vue'
import type { Frequency } from '@/types/finance'

interface HasSortFields {
  amount: number
  description: string
  createdAt: string
  type: string
  frequency?: Frequency
  category?: string
}

/**
 * Convenience wrapper around `useSortFilter` for views that manage
 * both income and expense lists side-by-side, avoiding repetitive
 * prefix-rename destructuring.
 *
 * Returns a `reactive` wrapper so Vue templates auto-unwrap nested refs.
 */
export function useDualSortFilter<I extends HasSortFields, E extends HasSortFields>(
  incomeItems: (() => I[]) | Ref<I[]>,
  expenseItems: (() => E[]) | Ref<E[]>,
) {
  return reactive({
    income: useSortFilter(incomeItems),
    expense: useSortFilter(expenseItems),
  })
}

import { ref, computed, type Ref, isRef } from 'vue'
import type { Frequency } from '@/types/finance'

export type SortOption = 'newest' | 'amount-asc' | 'amount-desc' | 'alpha-asc' | 'alpha-desc'
export type FrequencyFilter = Frequency | 'one-time'

interface HasSortFields {
  amount: number
  description: string
  createdAt: string
  type: string
  frequency?: Frequency
}

export function useSortFilter<T extends HasSortFields>(items: Ref<T[]> | T[] | (() => T[])) {
  const sortBy = ref<SortOption>('newest')
  const activeFilters = ref<FrequencyFilter[]>([])

  const itemsRef: Ref<T[]> | { readonly value: T[] } = isRef(items)
    ? items
    : typeof items === 'function'
      ? computed(items)
      : computed(() => items)

  const filtered = computed<T[]>(() => {
    let result = [...itemsRef.value]

    // Filter — empty activeFilters means show all
    if (activeFilters.value.length > 0) {
      result = result.filter((i) => {
        if (i.type === 'adhoc') {
          return activeFilters.value.includes('one-time')
        }
        return i.frequency !== undefined && activeFilters.value.includes(i.frequency)
      })
    }

    // Sort
    switch (sortBy.value) {
      case 'newest':
        result.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        break
      case 'amount-asc':
        result.sort((a, b) => a.amount - b.amount)
        break
      case 'amount-desc':
        result.sort((a, b) => b.amount - a.amount)
        break
      case 'alpha-asc':
        result.sort((a, b) => a.description.localeCompare(b.description))
        break
      case 'alpha-desc':
        result.sort((a, b) => b.description.localeCompare(a.description))
        break
    }

    return result
  })

  function toggleFilter(f: FrequencyFilter) {
    const idx = activeFilters.value.indexOf(f)
    if (idx === -1) {
      activeFilters.value.push(f)
    } else {
      activeFilters.value.splice(idx, 1)
    }
  }

  function clearFilters() {
    activeFilters.value = []
  }

  function hasFilter(f: FrequencyFilter): boolean {
    return activeFilters.value.includes(f)
  }

  return { sortBy, activeFilters, filtered, toggleFilter, clearFilters, hasFilter }
}

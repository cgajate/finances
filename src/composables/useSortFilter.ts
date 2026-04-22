import { ref, computed, type Ref, isRef } from 'vue'
import type { Frequency } from '@/types/finance'

export type SortField = 'newest' | 'amount' | 'alpha'
export type SortDirection = 'asc' | 'desc'
export type SortOption = 'newest' | 'amount-asc' | 'amount-desc' | 'alpha-asc' | 'alpha-desc'
export type FrequencyFilter = Frequency | 'one-time'

interface HasSortFields {
  amount: number
  description: string
  createdAt: string
  type: string
  frequency?: Frequency
  category?: string
}

export function useSortFilter<T extends HasSortFields>(items: Ref<T[]> | T[] | (() => T[])) {
  const sortField = ref<SortField>('newest')
  const sortDirection = ref<SortDirection>('asc')
  const activeFilters = ref<FrequencyFilter[]>([])
  const activeCategoryFilters = ref<string[]>([])

  // Legacy computed for backward compat
  const sortBy = computed<SortOption>({
    get() {
      if (sortField.value === 'newest') return 'newest'
      return `${sortField.value === 'amount' ? 'amount' : 'alpha'}-${sortDirection.value}` as SortOption
    },
    set(val: SortOption) {
      if (val === 'newest') {
        sortField.value = 'newest'
        sortDirection.value = 'asc'
      } else if (val.startsWith('amount')) {
        sortField.value = 'amount'
        sortDirection.value = val.endsWith('asc') ? 'asc' : 'desc'
      } else {
        sortField.value = 'alpha'
        sortDirection.value = val.endsWith('asc') ? 'asc' : 'desc'
      }
    },
  })

  const itemsRef: Ref<T[]> | { readonly value: T[] } = isRef(items)
    ? items
    : typeof items === 'function'
      ? computed(items)
      : computed(() => items)

  const filtered = computed<T[]>(() => {
    let result = [...itemsRef.value]

    // Frequency filter — empty means show all
    if (activeFilters.value.length > 0) {
      result = result.filter((i) => {
        if (i.type === 'adhoc') {
          return activeFilters.value.includes('one-time')
        }
        return i.frequency !== undefined && activeFilters.value.includes(i.frequency)
      })
    }

    // Category filter — empty means show all
    if (activeCategoryFilters.value.length > 0) {
      result = result.filter((i) => {
        const cat = i.category ?? 'Other'
        return activeCategoryFilters.value.includes(cat)
      })
    }

    // Sort
    const dir = sortDirection.value === 'asc' ? 1 : -1
    switch (sortField.value) {
      case 'newest':
        result.sort((a, b) => dir * b.createdAt.localeCompare(a.createdAt))
        break
      case 'amount':
        result.sort((a, b) => dir * (a.amount - b.amount))
        break
      case 'alpha':
        result.sort((a, b) => dir * a.description.localeCompare(b.description))
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

  function toggleCategoryFilter(cat: string) {
    const idx = activeCategoryFilters.value.indexOf(cat)
    if (idx === -1) {
      activeCategoryFilters.value.push(cat)
    } else {
      activeCategoryFilters.value.splice(idx, 1)
    }
  }

  function clearFilters() {
    activeFilters.value = []
    activeCategoryFilters.value = []
  }

  function hasFilter(f: FrequencyFilter): boolean {
    return activeFilters.value.includes(f)
  }

  function hasCategoryFilter(cat: string): boolean {
    return activeCategoryFilters.value.includes(cat)
  }

  return {
    sortBy,
    sortField,
    sortDirection,
    activeFilters,
    activeCategoryFilters,
    filtered,
    toggleFilter,
    toggleCategoryFilter,
    clearFilters,
    hasFilter,
    hasCategoryFilter,
  }
}

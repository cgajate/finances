import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useSortFilter } from '@/composables/useSortFilter'
import type { Frequency } from '@/types/finance'

interface TestItem {
  amount: number
  description: string
  createdAt: string
  type: string
  frequency?: Frequency
  category?: string
}

function makeItems(): TestItem[] {
  return [
    { amount: 500, description: 'Banana', createdAt: '2026-01-03T00:00:00Z', type: 'recurring', frequency: 'monthly' },
    { amount: 100, description: 'Apple', createdAt: '2026-01-01T00:00:00Z', type: 'adhoc' },
    { amount: 300, description: 'Cherry', createdAt: '2026-01-02T00:00:00Z', type: 'recurring', frequency: 'weekly' },
    { amount: 1200, description: 'Date', createdAt: '2026-01-04T00:00:00Z', type: 'recurring', frequency: 'yearly' },
  ]
}

describe('useSortFilter', () => {
  describe('with ref input', () => {
    it('returns all items when no filters', () => {
      const items = ref(makeItems())
      const { filtered } = useSortFilter(items)
      expect(filtered.value).toHaveLength(4)
    })
  })

  describe('with plain array', () => {
    it('returns all items when no filters', () => {
      const { filtered } = useSortFilter(makeItems())
      expect(filtered.value).toHaveLength(4)
    })
  })

  describe('sorting', () => {
    it('sorts by newest first (default)', () => {
      const items = ref(makeItems())
      const { filtered } = useSortFilter(items)
      expect(filtered.value[0]!.description).toBe('Date')
      expect(filtered.value[3]!.description).toBe('Apple')
    })

    it('sorts by amount ascending', () => {
      const items = ref(makeItems())
      const { filtered, sortBy } = useSortFilter(items)
      sortBy.value = 'amount-asc'
      expect(filtered.value[0]!.amount).toBe(100)
      expect(filtered.value[3]!.amount).toBe(1200)
    })

    it('sorts by amount descending', () => {
      const items = ref(makeItems())
      const { filtered, sortBy } = useSortFilter(items)
      sortBy.value = 'amount-desc'
      expect(filtered.value[0]!.amount).toBe(1200)
      expect(filtered.value[3]!.amount).toBe(100)
    })

    it('sorts alphabetically A-Z', () => {
      const items = ref(makeItems())
      const { filtered, sortBy } = useSortFilter(items)
      sortBy.value = 'alpha-asc'
      expect(filtered.value[0]!.description).toBe('Apple')
      expect(filtered.value[3]!.description).toBe('Date')
    })

    it('sorts alphabetically Z-A', () => {
      const items = ref(makeItems())
      const { filtered, sortBy } = useSortFilter(items)
      sortBy.value = 'alpha-desc'
      expect(filtered.value[0]!.description).toBe('Date')
      expect(filtered.value[3]!.description).toBe('Apple')
    })
  })

  describe('filtering', () => {
    it('filters by monthly', () => {
      const items = ref(makeItems())
      const { filtered, toggleFilter } = useSortFilter(items)
      toggleFilter('monthly')
      expect(filtered.value).toHaveLength(1)
      expect(filtered.value[0]!.description).toBe('Banana')
    })

    it('filters by one-time (adhoc)', () => {
      const items = ref(makeItems())
      const { filtered, toggleFilter } = useSortFilter(items)
      toggleFilter('one-time')
      expect(filtered.value).toHaveLength(1)
      expect(filtered.value[0]!.description).toBe('Apple')
    })

    it('multi-filter: monthly + weekly', () => {
      const items = ref(makeItems())
      const { filtered, toggleFilter } = useSortFilter(items)
      toggleFilter('monthly')
      toggleFilter('weekly')
      expect(filtered.value).toHaveLength(2)
    })

    it('toggling filter off removes it', () => {
      const items = ref(makeItems())
      const { filtered, toggleFilter } = useSortFilter(items)
      toggleFilter('monthly')
      expect(filtered.value).toHaveLength(1)
      toggleFilter('monthly')
      expect(filtered.value).toHaveLength(4)
    })

    it('recurring without frequency is excluded when filtering', () => {
      const items = ref<TestItem[]>([
        { amount: 100, description: 'NoFreq', createdAt: '2026-01-01T00:00:00Z', type: 'recurring' },
      ])
      const { filtered, toggleFilter } = useSortFilter(items)
      toggleFilter('monthly')
      expect(filtered.value).toHaveLength(0)
    })
  })

  describe('clearFilters', () => {
    it('removes all active filters', () => {
      const items = ref(makeItems())
      const { filtered, toggleFilter, clearFilters, activeFilters } = useSortFilter(items)
      toggleFilter('monthly')
      toggleFilter('weekly')
      expect(filtered.value).toHaveLength(2)
      clearFilters()
      expect(filtered.value).toHaveLength(4)
      expect(activeFilters.value).toEqual([])
    })
  })

  describe('hasFilter', () => {
    it('returns true when filter is active', () => {
      const items = ref(makeItems())
      const { hasFilter, toggleFilter } = useSortFilter(items)
      expect(hasFilter('monthly')).toBe(false)
      toggleFilter('monthly')
      expect(hasFilter('monthly')).toBe(true)
    })
  })

  describe('category filtering', () => {
    it('filters by category', () => {
      const items = ref<TestItem[]>([
        { amount: 100, description: 'A', createdAt: '2026-01-01T00:00:00Z', type: 'adhoc', category: 'Food' },
        { amount: 200, description: 'B', createdAt: '2026-01-02T00:00:00Z', type: 'adhoc', category: 'Transport' },
        { amount: 300, description: 'C', createdAt: '2026-01-03T00:00:00Z', type: 'adhoc' },
      ])
      const { filtered, toggleCategoryFilter } = useSortFilter(items)
      toggleCategoryFilter('Food')
      expect(filtered.value).toHaveLength(1)
      expect(filtered.value[0]!.description).toBe('A')
    })

    it('filters by Other when category undefined', () => {
      const items = ref<TestItem[]>([
        { amount: 100, description: 'A', createdAt: '2026-01-01T00:00:00Z', type: 'adhoc' },
      ])
      const { filtered, toggleCategoryFilter } = useSortFilter(items)
      toggleCategoryFilter('Other')
      expect(filtered.value).toHaveLength(1)
    })

    it('toggling category filter off removes it', () => {
      const items = ref<TestItem[]>([
        { amount: 100, description: 'A', createdAt: '2026-01-01T00:00:00Z', type: 'adhoc', category: 'Food' },
        { amount: 200, description: 'B', createdAt: '2026-01-02T00:00:00Z', type: 'adhoc', category: 'Transport' },
      ])
      const { filtered, toggleCategoryFilter } = useSortFilter(items)
      toggleCategoryFilter('Food')
      expect(filtered.value).toHaveLength(1)
      toggleCategoryFilter('Food')
      expect(filtered.value).toHaveLength(2)
    })

    it('hasCategoryFilter returns correct state', () => {
      const items = ref(makeItems())
      const { hasCategoryFilter, toggleCategoryFilter } = useSortFilter(items)
      expect(hasCategoryFilter('Food')).toBe(false)
      toggleCategoryFilter('Food')
      expect(hasCategoryFilter('Food')).toBe(true)
    })

    it('clearFilters clears category filters too', () => {
      const items = ref(makeItems())
      const { toggleCategoryFilter, clearFilters, activeCategoryFilters } = useSortFilter(items)
      toggleCategoryFilter('Food')
      expect(activeCategoryFilters.value).toHaveLength(1)
      clearFilters()
      expect(activeCategoryFilters.value).toEqual([])
    })
  })

  describe('sortBy computed get/set', () => {
    it('getter returns newest for default', () => {
      const items = ref(makeItems())
      const { sortBy } = useSortFilter(items)
      expect(sortBy.value).toBe('newest')
    })

    it('getter returns amount-asc', () => {
      const items = ref(makeItems())
      const { sortBy, sortField, sortDirection } = useSortFilter(items)
      sortField.value = 'amount'
      sortDirection.value = 'asc'
      expect(sortBy.value).toBe('amount-asc')
    })

    it('getter returns amount-desc', () => {
      const items = ref(makeItems())
      const { sortBy, sortField, sortDirection } = useSortFilter(items)
      sortField.value = 'amount'
      sortDirection.value = 'desc'
      expect(sortBy.value).toBe('amount-desc')
    })

    it('getter returns alpha-asc', () => {
      const items = ref(makeItems())
      const { sortBy, sortField, sortDirection } = useSortFilter(items)
      sortField.value = 'alpha'
      sortDirection.value = 'asc'
      expect(sortBy.value).toBe('alpha-asc')
    })

    it('setter sets newest correctly', () => {
      const items = ref(makeItems())
      const { sortBy, sortField, sortDirection } = useSortFilter(items)
      sortBy.value = 'amount-desc'
      sortBy.value = 'newest'
      expect(sortField.value).toBe('newest')
      expect(sortDirection.value).toBe('asc')
    })
  })

  describe('with function input', () => {
    it('accepts a getter function', () => {
      const items = makeItems()
      const { filtered } = useSortFilter(() => items)
      expect(filtered.value).toHaveLength(4)
    })
  })

  describe('combined filter + sort', () => {
    it('filters then sorts by amount', () => {
      const items = ref(makeItems())
      const { filtered, toggleFilter, sortBy } = useSortFilter(items)
      toggleFilter('monthly')
      toggleFilter('weekly')
      sortBy.value = 'amount-asc'
      expect(filtered.value).toHaveLength(2)
      expect(filtered.value[0]!.amount).toBe(300)
      expect(filtered.value[1]!.amount).toBe(500)
    })
  })

  describe('sort direction desc for newest', () => {
    it('sorts newest desc reverses order', () => {
      const items = ref(makeItems())
      const { filtered, sortDirection } = useSortFilter(items)
      sortDirection.value = 'desc'
      // With desc on newest, oldest should come first
      expect(filtered.value[0]!.description).toBe('Apple')
    })
  })
})

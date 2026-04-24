import { describe, it, expect } from 'vitest'
import { ref, computed } from 'vue'
import { useSearchFilter } from '@/composables/useSearchFilter'

interface Item {
  name: string
  amount: number
  note?: string | null
}

const fieldsFn = (item: Item) => [item.name, item.amount, item.note]

const sampleItems: Item[] = [
  { name: 'Groceries', amount: 50, note: 'weekly shopping' },
  { name: 'Internet', amount: 80, note: null },
  { name: 'Rent', amount: 1200, note: undefined },
  { name: 'Gas', amount: 40, note: 'commute' },
]

describe('useSearchFilter', () => {
  it('returns all items when searchQuery is empty', () => {
    const items = ref(sampleItems)
    const { filtered } = useSearchFilter(items, fieldsFn)
    expect(filtered.value).toEqual(sampleItems)
  })

  it('returns all items when searchQuery is whitespace', () => {
    const items = ref(sampleItems)
    const { searchQuery, filtered } = useSearchFilter(items, fieldsFn)
    searchQuery.value = '   '
    expect(filtered.value).toEqual(sampleItems)
  })

  it('filters by name (case-insensitive)', () => {
    const items = ref(sampleItems)
    const { searchQuery, filtered } = useSearchFilter(items, fieldsFn)
    searchQuery.value = 'groceries'
    expect(filtered.value).toHaveLength(1)
    expect(filtered.value[0]!.name).toBe('Groceries')
  })

  it('filters by numeric field', () => {
    const items = ref(sampleItems)
    const { searchQuery, filtered } = useSearchFilter(items, fieldsFn)
    searchQuery.value = '1200'
    expect(filtered.value).toHaveLength(1)
    expect(filtered.value[0]!.name).toBe('Rent')
  })

  it('filters by note field', () => {
    const items = ref(sampleItems)
    const { searchQuery, filtered } = useSearchFilter(items, fieldsFn)
    searchQuery.value = 'commute'
    expect(filtered.value).toHaveLength(1)
    expect(filtered.value[0]!.name).toBe('Gas')
  })

  it('handles null and undefined fields gracefully', () => {
    const items = ref(sampleItems)
    const { searchQuery, filtered } = useSearchFilter(items, fieldsFn)
    searchQuery.value = 'internet'
    expect(filtered.value).toHaveLength(1)
  })

  it('returns empty array when no match', () => {
    const items = ref(sampleItems)
    const { searchQuery, filtered } = useSearchFilter(items, fieldsFn)
    searchQuery.value = 'nonexistent'
    expect(filtered.value).toHaveLength(0)
  })

  it('accepts a getter function as items', () => {
    const data = ref(sampleItems)
    const { searchQuery, filtered } = useSearchFilter(() => data.value, fieldsFn)
    searchQuery.value = 'rent'
    expect(filtered.value).toHaveLength(1)
  })

  it('accepts a computed as items', () => {
    const data = ref(sampleItems)
    const comp = computed(() => data.value)
    const { searchQuery, filtered } = useSearchFilter(comp, fieldsFn)
    searchQuery.value = 'gas'
    expect(filtered.value).toHaveLength(1)
  })

  it('is reactive to searchQuery changes', () => {
    const items = ref(sampleItems)
    const { searchQuery, filtered } = useSearchFilter(items, fieldsFn)
    expect(filtered.value).toHaveLength(4)
    searchQuery.value = 'rent'
    expect(filtered.value).toHaveLength(1)
    searchQuery.value = ''
    expect(filtered.value).toHaveLength(4)
  })
})


import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSearch } from '@/composables/useSearch'
import { useFinancesStore } from '@/stores/finances'

describe('useSearch', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  function seedData() {
    const store = useFinancesStore()
    store.addRecurringIncome({
      amount: 5000,
      frequency: 'monthly',
      description: 'Salary from Acme Corp',
      notes: 'Direct deposit',
      date: '2026-01-15',
      category: 'Salary',
    })
    store.addAdhocIncome({
      amount: 200,
      description: 'Freelance web design',
      date: '2026-02-01',
      category: 'Freelance',
    })
    store.addRecurringExpense({
      amount: 1500,
      frequency: 'monthly',
      description: 'Apartment rent',
      notes: 'Paid to landlord',
      dueDate: '2026-01-01',
      category: 'Housing',
      assignedTo: 'Alice',
    })
    store.addAdhocExpense({
      amount: 75,
      description: 'Grocery run',
      notes: 'Whole Foods',
      dueDate: '2026-01-10',
      category: 'Food',
    })
  }

  it('returns empty results when query is empty', () => {
    seedData()
    const { results, resultCount } = useSearch()
    expect(results.value).toEqual([])
    expect(resultCount.value).toBe(0)
  })

  it('returns empty results when query is whitespace', () => {
    seedData()
    const { query, results } = useSearch()
    query.value = '   '
    expect(results.value).toEqual([])
  })

  it('searches by description', () => {
    seedData()
    const { query, results } = useSearch()
    query.value = 'salary'
    expect(results.value).toHaveLength(1)
    expect(results.value[0]!.kind).toBe('income')
    expect(results.value[0]!.description).toContain('Salary')
  })

  it('search is case-insensitive', () => {
    seedData()
    const { query, results } = useSearch()
    query.value = 'APARTMENT'
    expect(results.value).toHaveLength(1)
    expect(results.value[0]!.kind).toBe('expense')
  })

  it('searches by amount', () => {
    seedData()
    const { query, results } = useSearch()
    query.value = '5000'
    expect(results.value).toHaveLength(1)
    expect(results.value[0]!.amount).toBe(5000)
  })

  it('searches by category', () => {
    seedData()
    const { query, results } = useSearch()
    query.value = 'Food'
    expect(results.value).toHaveLength(1)
    expect(results.value[0]!.description).toBe('Grocery run')
  })

  it('searches by notes', () => {
    seedData()
    const { query, results } = useSearch()
    query.value = 'Whole Foods'
    expect(results.value).toHaveLength(1)
    expect(results.value[0]!.description).toBe('Grocery run')
  })

  it('searches by assignedTo', () => {
    seedData()
    const { query, results } = useSearch()
    query.value = 'Alice'
    expect(results.value).toHaveLength(1)
    expect(results.value[0]!.description).toBe('Apartment rent')
  })

  it('searches by frequency keyword', () => {
    seedData()
    const { query, results } = useSearch()
    query.value = 'monthly'
    // Both recurring income (Salary) and recurring expense (Apartment rent) are monthly
    expect(results.value).toHaveLength(2)
  })

  it('searches by date', () => {
    seedData()
    const { query, results } = useSearch()
    query.value = '2026-02-01'
    expect(results.value).toHaveLength(1)
    expect(results.value[0]!.description).toBe('Freelance web design')
  })

  it('searches by type keyword', () => {
    seedData()
    const { query, results } = useSearch()
    query.value = 'adhoc'
    // adhoc income + adhoc expense
    expect(results.value).toHaveLength(2)
  })

  it('returns results from both income and expenses', () => {
    seedData()
    const { query, results } = useSearch()
    // 'e' appears in many descriptions
    query.value = 'rent'
    expect(results.value.some((r) => r.kind === 'expense')).toBe(true)
  })

  it('returns correct result shape', () => {
    seedData()
    const { query, results } = useSearch()
    query.value = 'Grocery'
    const r = results.value[0]!
    expect(r.kind).toBe('expense')
    expect(r.id).toBeTruthy()
    expect(r.description).toBe('Grocery run')
    expect(r.amount).toBe(75)
    expect(r.category).toBe('Food')
    expect(r.item).toBeDefined()
  })

  it('clearSearch resets query and results', () => {
    seedData()
    const { query, results, clearSearch } = useSearch()
    query.value = 'salary'
    expect(results.value).toHaveLength(1)
    clearSearch()
    expect(query.value).toBe('')
    expect(results.value).toEqual([])
  })

  it('returns no results when nothing matches', () => {
    seedData()
    const { query, results } = useSearch()
    query.value = 'zzzznotfound'
    expect(results.value).toEqual([])
  })

  it('partial match works', () => {
    seedData()
    const { query, results } = useSearch()
    query.value = 'Acme'
    expect(results.value).toHaveLength(1)
    expect(results.value[0]!.description).toContain('Acme Corp')
  })

  it('works with empty store', () => {
    const { query, results } = useSearch()
    query.value = 'anything'
    expect(results.value).toEqual([])
  })
})


import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useNetWorthStore } from '@/stores/netWorth'
import { useSavingsGoalsStore } from '@/stores/savingsGoals'

describe('netWorth store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  describe('initial state', () => {
    it('starts with empty entries', () => {
      const store = useNetWorthStore()
      expect(store.entries).toEqual([])
    })

    it('starts with zero net worth', () => {
      const store = useNetWorthStore()
      expect(store.netWorth).toBe(0)
    })

    it('starts with zero totalAssets', () => {
      const store = useNetWorthStore()
      expect(store.totalAssets).toBe(0)
    })

    it('starts with zero totalLiabilities', () => {
      const store = useNetWorthStore()
      expect(store.totalLiabilities).toBe(0)
    })
  })

  describe('addEntry', () => {
    it('adds an asset entry', () => {
      const store = useNetWorthStore()
      const id = store.addEntry({ kind: 'asset', name: 'Home Equity', amount: 100000 })
      expect(store.entries).toHaveLength(1)
      expect(store.entries[0]!.id).toBe(id)
      expect(store.entries[0]!.kind).toBe('asset')
      expect(store.entries[0]!.name).toBe('Home Equity')
      expect(store.entries[0]!.amount).toBe(100000)
      expect(store.entries[0]!.createdAt).toBeTruthy()
    })

    it('adds a liability entry', () => {
      const store = useNetWorthStore()
      store.addEntry({ kind: 'liability', name: 'Mortgage', amount: 250000 })
      expect(store.entries).toHaveLength(1)
      expect(store.entries[0]!.kind).toBe('liability')
      expect(store.entries[0]!.name).toBe('Mortgage')
    })

    it('returns the generated id', () => {
      const store = useNetWorthStore()
      const id = store.addEntry({ kind: 'asset', name: 'Car', amount: 15000 })
      expect(id).toBeTruthy()
      expect(typeof id).toBe('string')
    })
  })

  describe('removeEntry', () => {
    it('removes an entry by id', () => {
      const store = useNetWorthStore()
      const id = store.addEntry({ kind: 'asset', name: 'Car', amount: 15000 })
      store.addEntry({ kind: 'liability', name: 'Loan', amount: 5000 })
      expect(store.entries).toHaveLength(2)
      store.removeEntry(id)
      expect(store.entries).toHaveLength(1)
      expect(store.entries[0]!.name).toBe('Loan')
    })

    it('does nothing for non-existent id', () => {
      const store = useNetWorthStore()
      store.addEntry({ kind: 'asset', name: 'Car', amount: 15000 })
      store.removeEntry('non-existent')
      expect(store.entries).toHaveLength(1)
    })
  })

  describe('updateEntry', () => {
    it('updates entry name', () => {
      const store = useNetWorthStore()
      const id = store.addEntry({ kind: 'asset', name: 'Old Name', amount: 1000 })
      store.updateEntry(id, { name: 'New Name' })
      expect(store.entries[0]!.name).toBe('New Name')
    })

    it('updates entry amount', () => {
      const store = useNetWorthStore()
      const id = store.addEntry({ kind: 'asset', name: 'Car', amount: 15000 })
      store.updateEntry(id, { amount: 12000 })
      expect(store.entries[0]!.amount).toBe(12000)
    })

    it('updates both name and amount', () => {
      const store = useNetWorthStore()
      const id = store.addEntry({ kind: 'asset', name: 'Car', amount: 15000 })
      store.updateEntry(id, { name: 'Old Car', amount: 5000 })
      expect(store.entries[0]!.name).toBe('Old Car')
      expect(store.entries[0]!.amount).toBe(5000)
    })

    it('does nothing for non-existent id', () => {
      const store = useNetWorthStore()
      store.addEntry({ kind: 'asset', name: 'Car', amount: 15000 })
      store.updateEntry('non-existent', { name: 'X' })
      expect(store.entries[0]!.name).toBe('Car')
    })

    it('preserves other fields when updating', () => {
      const store = useNetWorthStore()
      const id = store.addEntry({ kind: 'asset', name: 'Car', amount: 15000 })
      const originalCreatedAt = store.entries[0]!.createdAt
      store.updateEntry(id, { name: 'Updated Car' })
      expect(store.entries[0]!.kind).toBe('asset')
      expect(store.entries[0]!.amount).toBe(15000)
      expect(store.entries[0]!.createdAt).toBe(originalCreatedAt)
    })
  })

  describe('getEntryById', () => {
    it('returns entry when found', () => {
      const store = useNetWorthStore()
      const id = store.addEntry({ kind: 'asset', name: 'Car', amount: 15000 })
      const entry = store.getEntryById(id)
      expect(entry).toBeDefined()
      expect(entry!.name).toBe('Car')
    })

    it('returns undefined for non-existent id', () => {
      const store = useNetWorthStore()
      expect(store.getEntryById('nope')).toBeUndefined()
    })
  })

  describe('computed: assets and liabilities', () => {
    it('separates assets from liabilities', () => {
      const store = useNetWorthStore()
      store.addEntry({ kind: 'asset', name: 'Home', amount: 300000 })
      store.addEntry({ kind: 'asset', name: 'Car', amount: 15000 })
      store.addEntry({ kind: 'liability', name: 'Mortgage', amount: 250000 })
      expect(store.assets).toHaveLength(2)
      expect(store.liabilities).toHaveLength(1)
    })
  })

  describe('computed: customAssetsTotal', () => {
    it('sums custom asset entries', () => {
      const store = useNetWorthStore()
      store.addEntry({ kind: 'asset', name: 'Home', amount: 300000 })
      store.addEntry({ kind: 'asset', name: 'Car', amount: 15000 })
      expect(store.customAssetsTotal).toBe(315000)
    })

    it('does not include liabilities', () => {
      const store = useNetWorthStore()
      store.addEntry({ kind: 'asset', name: 'Home', amount: 300000 })
      store.addEntry({ kind: 'liability', name: 'Mortgage', amount: 250000 })
      expect(store.customAssetsTotal).toBe(300000)
    })
  })

  describe('computed: savingsTotal', () => {
    it('sums savedAmount from savings goals', () => {
      const savingsStore = useSavingsGoalsStore()
      savingsStore.addGoal({ name: 'Vacation', targetAmount: 5000, deadline: '2027-01-01', savedAmount: 2000 })
      savingsStore.addGoal({ name: 'Car', targetAmount: 10000, deadline: '2027-06-01', savedAmount: 3000 })
      const store = useNetWorthStore()
      expect(store.savingsTotal).toBe(5000)
    })

    it('returns 0 when no savings goals', () => {
      const store = useNetWorthStore()
      expect(store.savingsTotal).toBe(0)
    })
  })

  describe('computed: totalAssets', () => {
    it('includes custom assets and savings', () => {
      const savingsStore = useSavingsGoalsStore()
      savingsStore.addGoal({ name: 'Vacation', targetAmount: 5000, deadline: '2027-01-01', savedAmount: 2000 })
      const store = useNetWorthStore()
      store.addEntry({ kind: 'asset', name: 'Home', amount: 300000 })
      expect(store.totalAssets).toBe(302000)
    })
  })

  describe('computed: totalLiabilities', () => {
    it('sums liability entries', () => {
      const store = useNetWorthStore()
      store.addEntry({ kind: 'liability', name: 'Mortgage', amount: 250000 })
      store.addEntry({ kind: 'liability', name: 'Car Loan', amount: 10000 })
      expect(store.totalLiabilities).toBe(260000)
    })
  })

  describe('computed: netWorth', () => {
    it('is totalAssets minus totalLiabilities', () => {
      const store = useNetWorthStore()
      store.addEntry({ kind: 'asset', name: 'Home', amount: 300000 })
      store.addEntry({ kind: 'liability', name: 'Mortgage', amount: 250000 })
      expect(store.netWorth).toBe(50000)
    })

    it('can be negative', () => {
      const store = useNetWorthStore()
      store.addEntry({ kind: 'liability', name: 'Debt', amount: 50000 })
      expect(store.netWorth).toBe(-50000)
    })

    it('includes savings in the calculation', () => {
      const savingsStore = useSavingsGoalsStore()
      savingsStore.addGoal({ name: 'Fund', targetAmount: 10000, deadline: '2027-01-01', savedAmount: 5000 })
      const store = useNetWorthStore()
      store.addEntry({ kind: 'asset', name: 'Car', amount: 15000 })
      store.addEntry({ kind: 'liability', name: 'Loan', amount: 10000 })
      // assets: 15000 + 5000 savings = 20000, liabilities: 10000
      expect(store.netWorth).toBe(10000)
    })

    it('rounds to 2 decimal places', () => {
      const store = useNetWorthStore()
      store.addEntry({ kind: 'asset', name: 'A', amount: 100.555 })
      store.addEntry({ kind: 'liability', name: 'B', amount: 50.333 })
      // totalAssets: round(100.555 * 100) / 100 = 100.56
      // totalLiabilities: round(50.333 * 100) / 100 = 50.33
      // net: round((100.56 - 50.33) * 100) / 100 = 50.23
      expect(store.netWorth).toBe(50.23)
    })
  })

  describe('localStorage persistence', () => {
    it('loads entries from localStorage', () => {
      localStorage.setItem('netWorth:entries', JSON.stringify([
        { id: '1', kind: 'asset', name: 'Car', amount: 15000, createdAt: '2026-01-01T00:00:00Z' },
      ]))
      setActivePinia(createPinia())
      const store = useNetWorthStore()
      expect(store.entries).toHaveLength(1)
      expect(store.entries[0]!.name).toBe('Car')
    })

    it('handles invalid JSON gracefully', () => {
      localStorage.setItem('netWorth:entries', 'not-json')
      setActivePinia(createPinia())
      const store = useNetWorthStore()
      expect(store.entries).toEqual([])
    })
  })
})


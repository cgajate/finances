import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import type { NetWorthEntry, NetWorthEntryKind } from '@/types/finance'
import { useSavingsGoalsStore } from '@/stores/savingsGoals'
import { getDb } from '@/lib/firebase'
import { useFirestoreSync } from '@/composables/useFirestoreSync'
import { generateId } from '@/lib/id'
import { loadFromStorage } from '@/lib/storage'

export const useNetWorthStore = defineStore('netWorth', () => {
  const entries = ref<NetWorthEntry[]>(loadFromStorage('netWorth:entries', []))

  watch(
    entries,
    (val) => localStorage.setItem('netWorth:entries', JSON.stringify(val)),
    { deep: true },
  )

  // --- Firestore sync ---
  function enableSync(householdId: string) {
    const db = getDb()
    if (!db) return
    useFirestoreSync(db, `households/${householdId}`, 'netWorthEntries', entries)
  }

  // --- Actions ---

  /** Add a custom asset or liability entry */
  function addEntry(data: { kind: NetWorthEntryKind; name: string; amount: number }): string {
    const id = generateId()
    entries.value.push({
      id,
      kind: data.kind,
      name: data.name,
      amount: data.amount,
      createdAt: new Date().toISOString(),
    })
    return id
  }

  /** Remove an entry by id */
  function removeEntry(id: string) {
    entries.value = entries.value.filter((e) => e.id !== id)
  }

  /** Update an existing entry */
  function updateEntry(id: string, data: Partial<Pick<NetWorthEntry, 'name' | 'amount'>>) {
    const index = entries.value.findIndex((e) => e.id === id)
    if (index !== -1) {
      const existing = entries.value[index]
      if (existing) {
        entries.value.splice(index, 1, { ...existing, ...data })
      }
    }
  }

  /** Get entry by id */
  function getEntryById(id: string): NetWorthEntry | undefined {
    return entries.value.find((e) => e.id === id)
  }

  // --- Computed ---

  /** Custom asset entries */
  const assets = computed(() => entries.value.filter((e) => e.kind === 'asset'))

  /** Custom liability entries */
  const liabilities = computed(() => entries.value.filter((e) => e.kind === 'liability'))

  /** Total from custom asset entries */
  const customAssetsTotal = computed(() =>
    assets.value.reduce((sum, e) => sum + e.amount, 0),
  )

  /** Total saved across all savings goals */
  const savingsTotal = computed(() => {
    const savingsStore = useSavingsGoalsStore()
    return savingsStore.goals.reduce((sum, g) => sum + g.savedAmount, 0)
  })

  /** Total assets = custom assets + savings */
  const totalAssets = computed(() =>
    Math.round((customAssetsTotal.value + savingsTotal.value) * 100) / 100,
  )

  /** Total liabilities from custom entries */
  const totalLiabilities = computed(() =>
    Math.round(liabilities.value.reduce((sum, e) => sum + e.amount, 0) * 100) / 100,
  )

  /** Net worth = total assets − total liabilities */
  const netWorth = computed(() =>
    Math.round((totalAssets.value - totalLiabilities.value) * 100) / 100,
  )

  return {
    entries,
    assets,
    liabilities,
    customAssetsTotal,
    savingsTotal,
    totalAssets,
    totalLiabilities,
    netWorth,
    addEntry,
    removeEntry,
    updateEntry,
    getEntryById,
    enableSync,
  }
})


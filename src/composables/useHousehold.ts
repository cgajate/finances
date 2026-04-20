import { ref, computed } from 'vue'
import { getDb, ensureAuth, isConfigured } from '@/lib/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'

const HOUSEHOLD_KEY = 'household:id'

const householdId = ref<string | null>(localStorage.getItem(HOUSEHOLD_KEY))

export function useHousehold() {
  const hasHousehold = computed(() => !!householdId.value)

  const firebaseReady = computed(() => isConfigured())

  function generateCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  async function createHousehold(): Promise<string | null> {
    const db = getDb()
    if (!db) return null
    await ensureAuth()

    const code = generateCode()
    await setDoc(doc(db, 'households', code), {
      createdAt: new Date().toISOString(),
      incomes: [],
      expenses: [],
      dismissedIncomeIds: [],
      mutedExpenses: [],
    })

    householdId.value = code
    localStorage.setItem(HOUSEHOLD_KEY, code)
    return code
  }

  async function joinHousehold(code: string): Promise<boolean> {
    const db = getDb()
    if (!db) return false
    await ensureAuth()

    const normalised = code.trim().toUpperCase()
    const snap = await getDoc(doc(db, 'households', normalised))
    if (!snap.exists()) return false

    householdId.value = normalised
    localStorage.setItem(HOUSEHOLD_KEY, normalised)
    return true
  }

  function leaveHousehold() {
    householdId.value = null
    localStorage.removeItem(HOUSEHOLD_KEY)
  }

  return {
    householdId,
    hasHousehold,
    firebaseReady,
    createHousehold,
    joinHousehold,
    leaveHousehold,
  }
}


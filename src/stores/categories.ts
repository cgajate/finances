import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'

export interface CategoryItem {
  id: string
  name: string
  type: 'income' | 'expense'
  deleted: boolean
  createdAt: string
}

const STORAGE_KEY = 'finances:categories'

/** Built-in defaults — seeded on first use */
const DEFAULT_EXPENSE: string[] = [
  'Housing',
  'Food',
  'Transport',
  'Utilities',
  'Entertainment',
  'Healthcare',
  'Education',
  'Savings',
  'Other',
]

const DEFAULT_INCOME: string[] = ['Salary', 'Freelance', 'Investment', 'Gift', 'Other']

function generateId(): string {
  return crypto.randomUUID()
}

function loadFromStorage(): CategoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as CategoryItem[]
  } catch {
    // ignore
  }
  return []
}

function seedDefaults(): CategoryItem[] {
  const now = new Date().toISOString()
  const items: CategoryItem[] = []
  for (const name of DEFAULT_EXPENSE) {
    items.push({ id: generateId(), name, type: 'expense', deleted: false, createdAt: now })
  }
  for (const name of DEFAULT_INCOME) {
    items.push({ id: generateId(), name, type: 'income', deleted: false, createdAt: now })
  }
  return items
}

export const useCategoriesStore = defineStore('categories', () => {
  const stored = loadFromStorage()
  const categories = ref<CategoryItem[]>(stored.length > 0 ? stored : seedDefaults())

  // Persist
  watch(
    categories,
    (val) => localStorage.setItem(STORAGE_KEY, JSON.stringify(val)),
    { deep: true, immediate: true },
  )

  // --- Computed ---
  const allCategories = computed(() => categories.value)

  const activeExpenseCategories = computed(() =>
    categories.value
      .filter((c) => c.type === 'expense' && !c.deleted)
      .map((c) => c.name)
      .sort((a, b) => a.localeCompare(b)),
  )

  const activeIncomeCategories = computed(() =>
    categories.value
      .filter((c) => c.type === 'income' && !c.deleted)
      .map((c) => c.name)
      .sort((a, b) => a.localeCompare(b)),
  )

  const expenseCategories = computed(() =>
    [...categories.value.filter((c) => c.type === 'expense')].sort((a, b) =>
      a.name.localeCompare(b.name),
    ),
  )

  const incomeCategories = computed(() =>
    [...categories.value.filter((c) => c.type === 'income')].sort((a, b) =>
      a.name.localeCompare(b.name),
    ),
  )

  // --- Actions ---
  function addCategory(name: string, type: 'income' | 'expense') {
    const trimmed = name.trim()
    if (!trimmed) return
    // Check for duplicate (including soft-deleted — restore instead)
    const existing = categories.value.find(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase() && c.type === type,
    )
    if (existing) {
      if (existing.deleted) {
        existing.deleted = false
      }
      return
    }
    categories.value.push({
      id: generateId(),
      name: trimmed,
      type,
      deleted: false,
      createdAt: new Date().toISOString(),
    })
  }

  function editCategory(id: string, newName: string) {
    const trimmed = newName.trim()
    if (!trimmed) return
    const cat = categories.value.find((c) => c.id === id)
    if (cat) {
      cat.name = trimmed
    }
  }

  function deleteCategory(id: string) {
    const cat = categories.value.find((c) => c.id === id)
    if (cat) {
      cat.deleted = true
    }
  }

  function restoreCategory(id: string) {
    const cat = categories.value.find((c) => c.id === id)
    if (cat) {
      cat.deleted = false
    }
  }

  return {
    categories: allCategories,
    activeExpenseCategories,
    activeIncomeCategories,
    expenseCategories,
    incomeCategories,
    addCategory,
    editCategory,
    deleteCategory,
    restoreCategory,
  }
})


import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCategoriesStore } from '@/stores/categories'

describe('categories store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('seeds default categories on first init', () => {
    const store = useCategoriesStore()
    expect(store.categories.length).toBeGreaterThan(0)
    expect(store.activeExpenseCategories).toContain('Food')
    expect(store.activeIncomeCategories).toContain('Salary')
  })

  it('loads from localStorage when data exists', () => {
    localStorage.setItem(
      'finances:categories',
      JSON.stringify([
        { id: '1', name: 'Custom', type: 'expense', deleted: false, createdAt: '2026-01-01' },
      ]),
    )
    setActivePinia(createPinia())
    const store = useCategoriesStore()
    expect(store.categories).toHaveLength(1)
    expect(store.categories[0]!.name).toBe('Custom')
  })

  it('handles invalid JSON in localStorage', () => {
    localStorage.setItem('finances:categories', 'bad-json')
    setActivePinia(createPinia())
    const store = useCategoriesStore()
    // Should fallback to seeded defaults
    expect(store.categories.length).toBeGreaterThan(0)
  })

  it('addCategory adds a new expense category', () => {
    const store = useCategoriesStore()
    const before = store.categories.length
    store.addCategory('Pets', 'expense')
    expect(store.categories.length).toBe(before + 1)
    expect(store.activeExpenseCategories).toContain('Pets')
  })

  it('addCategory adds a new income category', () => {
    const store = useCategoriesStore()
    store.addCategory('Royalties', 'income')
    expect(store.activeIncomeCategories).toContain('Royalties')
  })

  it('addCategory ignores empty name', () => {
    const store = useCategoriesStore()
    const before = store.categories.length
    store.addCategory('', 'expense')
    store.addCategory('   ', 'expense')
    expect(store.categories.length).toBe(before)
  })

  it('addCategory ignores duplicate name (same type)', () => {
    const store = useCategoriesStore()
    const before = store.categories.length
    store.addCategory('Food', 'expense')
    expect(store.categories.length).toBe(before)
  })

  it('addCategory restores soft-deleted duplicate', () => {
    const store = useCategoriesStore()
    const foodCat = store.categories.find((c) => c.name === 'Food' && c.type === 'expense')
    expect(foodCat).toBeDefined()
    store.deleteCategory(foodCat!.id)
    expect(store.activeExpenseCategories).not.toContain('Food')
    store.addCategory('Food', 'expense')
    expect(store.activeExpenseCategories).toContain('Food')
  })

  it('editCategory changes the name', () => {
    const store = useCategoriesStore()
    const cat = store.categories[0]!
    store.editCategory(cat.id, 'NewName')
    expect(store.categories.find((c) => c.id === cat.id)!.name).toBe('NewName')
  })

  it('editCategory trims whitespace', () => {
    const store = useCategoriesStore()
    const cat = store.categories[0]!
    store.editCategory(cat.id, '  Trimmed  ')
    expect(store.categories.find((c) => c.id === cat.id)!.name).toBe('Trimmed')
  })

  it('editCategory ignores empty name', () => {
    const store = useCategoriesStore()
    const cat = store.categories[0]!
    const oldName = cat.name
    store.editCategory(cat.id, '')
    expect(store.categories.find((c) => c.id === cat.id)!.name).toBe(oldName)
  })

  it('editCategory with non-existent id does nothing', () => {
    const store = useCategoriesStore()
    const before = store.categories.length
    store.editCategory('non-existent', 'Test')
    expect(store.categories.length).toBe(before)
  })

  it('deleteCategory soft-deletes', () => {
    const store = useCategoriesStore()
    const cat = store.categories.find((c) => c.type === 'expense' && !c.deleted)!
    store.deleteCategory(cat.id)
    expect(store.categories.find((c) => c.id === cat.id)!.deleted).toBe(true)
    expect(store.activeExpenseCategories).not.toContain(cat.name)
  })

  it('deleteCategory with non-existent id does nothing', () => {
    const store = useCategoriesStore()
    store.deleteCategory('non-existent')
    // no error
  })

  it('restoreCategory restores a soft-deleted category', () => {
    const store = useCategoriesStore()
    const cat = store.categories.find((c) => c.type === 'expense' && !c.deleted)!
    store.deleteCategory(cat.id)
    store.restoreCategory(cat.id)
    expect(store.categories.find((c) => c.id === cat.id)!.deleted).toBe(false)
  })

  it('restoreCategory with non-existent id does nothing', () => {
    const store = useCategoriesStore()
    store.restoreCategory('non-existent')
    // no error
  })

  it('activeExpenseCategories returns sorted non-deleted expense names', () => {
    const store = useCategoriesStore()
    const cats = store.activeExpenseCategories
    expect(cats).toContain('Food')
    // Should be sorted
    for (let i = 1; i < cats.length; i++) {
      expect(cats[i]!.localeCompare(cats[i - 1]!)).toBeGreaterThanOrEqual(0)
    }
  })

  it('activeIncomeCategories returns sorted non-deleted income names', () => {
    const store = useCategoriesStore()
    const cats = store.activeIncomeCategories
    expect(cats).toContain('Salary')
  })

  it('expenseCategories returns all expense CategoryItems', () => {
    const store = useCategoriesStore()
    const cats = store.expenseCategories
    expect(cats.length).toBeGreaterThan(0)
    expect(cats.every((c) => c.type === 'expense')).toBe(true)
  })

  it('incomeCategories returns all income CategoryItems', () => {
    const store = useCategoriesStore()
    const cats = store.incomeCategories
    expect(cats.length).toBeGreaterThan(0)
    expect(cats.every((c) => c.type === 'income')).toBe(true)
  })

  it('persists to localStorage on change', async () => {
    const store = useCategoriesStore()
    store.addCategory('NewCat', 'expense')
    await new Promise((r) => setTimeout(r, 10))
    const stored = JSON.parse(localStorage.getItem('finances:categories')!)
    expect(stored.some((c: { name: string }) => c.name === 'NewCat')).toBe(true)
  })
})


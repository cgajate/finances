import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { nextTick } from 'vue'
import { useActivityFeedStore } from '@/stores/activityFeed'

vi.mock('@/lib/firebase', () => ({
  getDb: vi.fn(() => null),
}))

vi.mock('@/composables/useFirestoreSync', () => ({
  useFirestoreSync: vi.fn(),
}))

import { getDb } from '@/lib/firebase'
import { useFirestoreSync } from '@/composables/useFirestoreSync'

describe('activityFeed store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('starts with empty activities', () => {
    const store = useActivityFeedStore()
    expect(store.activities).toEqual([])
  })

  it('logActivity adds an entry', () => {
    const store = useActivityFeedStore()
    store.logActivity('user1', 'add', 'income', 'inc-1', 'Added income "Salary"')
    expect(store.activities).toHaveLength(1)
    const entry = store.activities[0]!
    expect(entry.userId).toBe('user1')
    expect(entry.action).toBe('add')
    expect(entry.entity).toBe('income')
    expect(entry.entityId).toBe('inc-1')
    expect(entry.description).toBe('Added income "Salary"')
    expect(entry.id).toBeTruthy()
    expect(entry.timestamp).toBeTruthy()
  })

  it('logActivity prepends (newest first)', () => {
    const store = useActivityFeedStore()
    store.logActivity('user1', 'add', 'income', '1', 'First')
    store.logActivity('user1', 'add', 'expense', '2', 'Second')
    expect(store.activities[0]!.description).toBe('Second')
    expect(store.activities[1]!.description).toBe('First')
  })

  it('sortedActivities returns newest first', () => {
    const store = useActivityFeedStore()
    store.logActivity('user1', 'add', 'income', '1', 'First')
    store.logActivity('user1', 'add', 'expense', '2', 'Second')
    expect(store.sortedActivities[0]!.description).toBe('Second')
  })

  it('caps at 200 entries', () => {
    const store = useActivityFeedStore()
    for (let i = 0; i < 210; i++) {
      store.logActivity('user1', 'add', 'income', `id-${i}`, `Entry ${i}`)
    }
    expect(store.activities.length).toBeLessThanOrEqual(200)
  })

  it('clearAll removes all entries', () => {
    const store = useActivityFeedStore()
    store.logActivity('user1', 'add', 'income', '1', 'Test')
    store.logActivity('user1', 'delete', 'expense', '2', 'Test2')
    store.clearAll()
    expect(store.activities).toEqual([])
  })

  it('persists to localStorage', async () => {
    const store = useActivityFeedStore()
    store.logActivity('user1', 'add', 'income', '1', 'Test')
    await nextTick()
    const raw = localStorage.getItem('activityFeed:entries')
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw!) as unknown[]
    expect(parsed).toHaveLength(1)
  })

  it('loads from localStorage on init', () => {
    localStorage.setItem(
      'activityFeed:entries',
      JSON.stringify([
        { id: 'x', userId: 'u1', action: 'add', entity: 'income', entityId: 'e1', description: 'Saved', timestamp: '2026-01-01T00:00:00.000Z' },
      ]),
    )
    setActivePinia(createPinia())
    const store = useActivityFeedStore()
    expect(store.activities).toHaveLength(1)
    expect(store.activities[0]!.description).toBe('Saved')
  })

  it('enableSync does nothing when db is null', () => {
    vi.mocked(getDb).mockReturnValue(null)
    const store = useActivityFeedStore()
    store.enableSync('household-1')
    expect(useFirestoreSync).not.toHaveBeenCalled()
  })

  it('enableSync calls useFirestoreSync when db is available', () => {
    const fakeDb = {} as any
    vi.mocked(getDb).mockReturnValue(fakeDb)
    const store = useActivityFeedStore()
    store.enableSync('household-1')
    expect(useFirestoreSync).toHaveBeenCalledWith(
      fakeDb,
      'households/household-1',
      'activityFeed',
      expect.anything(),
    )
  })
})

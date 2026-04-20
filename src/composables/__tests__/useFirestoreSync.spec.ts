import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, nextTick } from 'vue'

const { mockUnsubscribe, mockOnSnapshot, mockUpdateDoc, mockDoc } = vi.hoisted(() => {
  const mockUnsubscribe = vi.fn()
  return {
    mockUnsubscribe,
    mockOnSnapshot: vi.fn(() => mockUnsubscribe),
    mockUpdateDoc: vi.fn().mockResolvedValue(undefined),
    mockDoc: vi.fn(() => 'mock-doc-ref'),
  }
})

vi.mock('firebase/firestore', () => ({
  doc: mockDoc,
  onSnapshot: mockOnSnapshot,
  updateDoc: mockUpdateDoc,
}))

import { useFirestoreSync } from '@/composables/useFirestoreSync'

type SnapshotCb = (snap: { exists: () => boolean; data: () => Record<string, unknown> }) => void

function getSnapshotCb(): SnapshotCb {
  return (mockOnSnapshot.mock.calls[0] as unknown[])[1] as SnapshotCb
}

describe('useFirestoreSync', () => {
  const fakeDb = {} as any

  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns an unsubscribe function', () => {
    const localRef = ref<string[]>([])
    const unsub = useFirestoreSync(fakeDb, 'households/ABC', 'incomes', localRef)
    expect(unsub).toBe(mockUnsubscribe)
  })

  it('sets up onSnapshot listener', () => {
    const localRef = ref<string[]>([])
    useFirestoreSync(fakeDb, 'households/ABC', 'incomes', localRef)
    expect(mockOnSnapshot).toHaveBeenCalledTimes(1)
  })

  it('updates localRef when snapshot fires with data', async () => {
    const localRef = ref<string[]>([])
    useFirestoreSync(fakeDb, 'households/ABC', 'incomes', localRef)

    const snapshotCb = getSnapshotCb()
    snapshotCb({
      exists: () => true,
      data: () => ({ incomes: ['a', 'b'] }),
    })

    expect(localRef.value).toEqual(['a', 'b'])
  })

  it('does not update localRef when snapshot does not exist', () => {
    const localRef = ref<string[]>(['existing'])
    useFirestoreSync(fakeDb, 'households/ABC', 'incomes', localRef)

    const snapshotCb = getSnapshotCb()
    snapshotCb({ exists: () => false, data: () => ({}) })

    expect(localRef.value).toEqual(['existing'])
  })

  it('does not write back to Firestore when snapshot updates localRef (skip echo)', async () => {
    const localRef = ref<string[]>([])
    useFirestoreSync(fakeDb, 'households/ABC', 'incomes', localRef)

    const snapshotCb = getSnapshotCb()
    snapshotCb({
      exists: () => true,
      data: () => ({ incomes: ['a'] }),
    })

    await nextTick()
    vi.advanceTimersByTime(600)

    expect(mockUpdateDoc).not.toHaveBeenCalled()
  })

  it('writes to Firestore when localRef changes locally (debounced)', async () => {
    const localRef = ref<string[]>([])
    useFirestoreSync(fakeDb, 'households/ABC', 'incomes', localRef)

    // Simulate a local change (not from snapshot)
    // Wait for skipWrite to be false (default)
    localRef.value = ['new-item']
    await nextTick()

    // Should not fire immediately
    expect(mockUpdateDoc).not.toHaveBeenCalled()

    // After debounce
    vi.advanceTimersByTime(600)
    expect(mockUpdateDoc).toHaveBeenCalledTimes(1)
    expect(mockUpdateDoc).toHaveBeenCalledWith('mock-doc-ref', { incomes: ['new-item'] })
  })
})

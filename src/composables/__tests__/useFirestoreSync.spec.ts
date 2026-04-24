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
type ErrorCb = (err: Error) => void

function getSnapshotCb(): SnapshotCb {
  return (mockOnSnapshot.mock.calls[0] as unknown[])[1] as SnapshotCb
}

function getErrorCb(): ErrorCb {
  return (mockOnSnapshot.mock.calls[0] as unknown[])[2] as ErrorCb
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

  it('logs warning when onSnapshot error callback fires', () => {
    const localRef = ref<string[]>([])
    useFirestoreSync(fakeDb, 'households/ABC', 'incomes', localRef)

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const errCb = getErrorCb()
    errCb(new Error('permission denied'))

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Firestore sync error'),
      expect.any(Error),
    )
    consoleSpy.mockRestore()
  })

  it('logs warning when updateDoc fails', async () => {
    const localRef = ref<string[]>([])
    mockUpdateDoc.mockRejectedValueOnce(new Error('write failed'))
    useFirestoreSync(fakeDb, 'households/ABC', 'incomes', localRef)

    localRef.value = ['fail-item']
    await nextTick()
    vi.advanceTimersByTime(600)

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    // Flush the rejected promise
    await vi.runAllTimersAsync()
    await nextTick()

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Firestore write error'),
      expect.any(Error),
    )
    consoleSpy.mockRestore()
  })

  it('does not update localRef when field is undefined in snapshot', () => {
    const localRef = ref<string[]>(['keep'])
    useFirestoreSync(fakeDb, 'households/ABC', 'incomes', localRef)

    const snapshotCb = getSnapshotCb()
    snapshotCb({
      exists: () => true,
      data: () => ({ otherField: 'value' }),
    })

    expect(localRef.value).toEqual(['keep'])
  })

  it('debounces multiple rapid local changes', async () => {
    const localRef = ref<string[]>([])
    useFirestoreSync(fakeDb, 'households/ABC', 'incomes', localRef)

    localRef.value = ['first']
    await nextTick()
    vi.advanceTimersByTime(200)

    localRef.value = ['second']
    await nextTick()
    vi.advanceTimersByTime(200)

    localRef.value = ['third']
    await nextTick()
    vi.advanceTimersByTime(600)

    // Should only write once with the final value
    expect(mockUpdateDoc).toHaveBeenCalledTimes(1)
    expect(mockUpdateDoc).toHaveBeenCalledWith('mock-doc-ref', { incomes: ['third'] })
  })

  it('resets skipWrite after timeout so subsequent local changes are written', async () => {
    const localRef = ref<string[]>([])
    useFirestoreSync(fakeDb, 'households/ABC', 'incomes', localRef)

    // Simulate remote update
    const snapshotCb = getSnapshotCb()
    snapshotCb({
      exists: () => true,
      data: () => ({ incomes: ['remote'] }),
    })
    await nextTick()

    // Advance past the 50ms skipWrite reset
    vi.advanceTimersByTime(100)

    // Now make a local change — should write
    localRef.value = ['local-change']
    await nextTick()
    vi.advanceTimersByTime(600)

    expect(mockUpdateDoc).toHaveBeenCalledTimes(1)
  })
})

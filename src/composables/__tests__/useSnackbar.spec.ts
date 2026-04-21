import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useSnackbar, SNACKBAR_DURATION } from '@/composables/useSnackbar'

describe('useSnackbar', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Dismiss all from previous tests
    const { dismissAll } = useSnackbar()
    dismissAll()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows a snackbar message', () => {
    const { show, items } = useSnackbar()
    show('Item deleted')
    expect(items.value).toHaveLength(1)
    expect(items.value[0]!.message).toBe('Item deleted')
  })

  it('returns incrementing IDs', () => {
    const { show } = useSnackbar()
    const id1 = show('First')
    const id2 = show('Second')
    expect(id2).toBeGreaterThan(id1)
  })

  it('auto-dismisses after duration', () => {
    const { show, items } = useSnackbar()
    show('Will disappear')
    expect(items.value).toHaveLength(1)
    vi.advanceTimersByTime(SNACKBAR_DURATION)
    expect(items.value).toHaveLength(0)
  })

  it('dismiss removes a specific snackbar', () => {
    const { show, dismiss, items } = useSnackbar()
    const id = show('To dismiss')
    expect(items.value).toHaveLength(1)
    dismiss(id)
    expect(items.value).toHaveLength(0)
  })

  it('dismiss is a no-op for unknown id', () => {
    const { show, dismiss, items } = useSnackbar()
    show('Stays')
    dismiss(99999)
    expect(items.value).toHaveLength(1)
  })

  it('undo calls the undo function and removes snackbar', () => {
    const undoFn = vi.fn()
    const { show, undo, items } = useSnackbar()
    const id = show('Deleted', undoFn)
    expect(items.value).toHaveLength(1)
    undo(id)
    expect(undoFn).toHaveBeenCalledOnce()
    expect(items.value).toHaveLength(0)
  })

  it('undo is a no-op for unknown id', () => {
    const undoFn = vi.fn()
    const { show, undo } = useSnackbar()
    show('Test', undoFn)
    undo(99999)
    expect(undoFn).not.toHaveBeenCalled()
  })

  it('undo clears the auto-dismiss timer', () => {
    const undoFn = vi.fn()
    const { show, undo, items } = useSnackbar()
    const id = show('Test', undoFn)
    undo(id)
    vi.advanceTimersByTime(SNACKBAR_DURATION)
    // Should still be 0 — no double-removal
    expect(items.value).toHaveLength(0)
    expect(undoFn).toHaveBeenCalledOnce()
  })

  it('snackbar without undo has null undoFn', () => {
    const { show, items } = useSnackbar()
    show('No undo')
    expect(items.value[0]!.undoFn).toBeNull()
  })

  it('supports multiple concurrent snackbars', () => {
    const { show, items } = useSnackbar()
    show('First')
    show('Second')
    show('Third')
    expect(items.value).toHaveLength(3)
  })

  it('dismissAll clears all snackbars', () => {
    const { show, dismissAll, items } = useSnackbar()
    show('A')
    show('B')
    show('C')
    dismissAll()
    expect(items.value).toHaveLength(0)
  })

  it('dismissAll clears timers so they do not fire', () => {
    const { show, dismissAll, items } = useSnackbar()
    show('A')
    show('B')
    dismissAll()
    vi.advanceTimersByTime(SNACKBAR_DURATION)
    expect(items.value).toHaveLength(0)
  })

  it('multiple snackbars auto-dismiss independently', () => {
    const { show, items } = useSnackbar()
    show('First')
    vi.advanceTimersByTime(2000)
    show('Second')
    vi.advanceTimersByTime(SNACKBAR_DURATION - 2000)
    // First should be gone, second still visible
    expect(items.value).toHaveLength(1)
    expect(items.value[0]!.message).toBe('Second')
    vi.advanceTimersByTime(2000)
    expect(items.value).toHaveLength(0)
  })
})


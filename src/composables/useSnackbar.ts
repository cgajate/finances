import { ref, readonly } from 'vue'

export interface SnackbarItem {
  id: number
  message: string
  undoFn: (() => void) | null
  copyText: string | null
  persistent: boolean
  timer: ReturnType<typeof setTimeout> | null
}

const items = ref<SnackbarItem[]>([])
let nextId = 0

const SNACKBAR_DURATION = 5000

export function useSnackbar() {
  function show(
    message: string,
    optionsOrUndo?:
      | {
          undoFn?: () => void
          copyText?: string
          persistent?: boolean
          duration?: number
        }
      | (() => void),
  ) {
    const id = nextId++
    const opts =
      typeof optionsOrUndo === 'function'
        ? { undoFn: optionsOrUndo }
        : (optionsOrUndo ?? {})
    const persistent = opts.persistent ?? false
    const duration = opts.duration ?? SNACKBAR_DURATION
    const item: SnackbarItem = {
      id,
      message,
      undoFn: opts.undoFn ?? null,
      copyText: opts.copyText ?? null,
      persistent,
      timer: null,
    }
    if (!persistent) {
      item.timer = setTimeout(() => {
        dismiss(id)
      }, duration)
    }
    items.value.push(item)
    return id
  }

  function undo(id: number) {
    const idx = items.value.findIndex((i) => i.id === id)
    if (idx === -1) return
    const item = items.value[idx]!
    if (item.timer) clearTimeout(item.timer)
    if (item.undoFn) item.undoFn()
    items.value.splice(idx, 1)
  }

  function dismiss(id: number) {
    const idx = items.value.findIndex((i) => i.id === id)
    if (idx === -1) return
    const item = items.value[idx]!
    if (item.timer) clearTimeout(item.timer)
    items.value.splice(idx, 1)
  }

  function dismissAll() {
    for (const item of items.value) {
      if (item.timer) clearTimeout(item.timer)
    }
    items.value.splice(0)
  }

  return {
    items: readonly(items),
    show,
    undo,
    dismiss,
    dismissAll,
  }
}

/** Exposed for testing only */
export { SNACKBAR_DURATION }

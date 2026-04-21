import { ref, readonly } from 'vue'

export interface SnackbarItem {
  id: number
  message: string
  undoFn: (() => void) | null
  timer: ReturnType<typeof setTimeout> | null
}

const items = ref<SnackbarItem[]>([])
let nextId = 0

const SNACKBAR_DURATION = 5000

export function useSnackbar() {
  function show(message: string, undoFn?: () => void) {
    const id = nextId++
    const item: SnackbarItem = {
      id,
      message,
      undoFn: undoFn ?? null,
      timer: null,
    }
    item.timer = setTimeout(() => {
      dismiss(id)
    }, SNACKBAR_DURATION)
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


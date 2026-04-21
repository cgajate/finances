import { ref, computed, watch } from 'vue'

export type ThemeMode = 'light' | 'dark' | 'system'

const THEME_KEY = 'theme:mode'
const HC_KEY = 'theme:highContrast'

function loadString<T extends string>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return raw as T
  } catch {
    // ignore
  }
  return fallback
}

function loadBool(key: string, fallback: boolean): boolean {
  try {
    const raw = localStorage.getItem(key)
    if (raw !== null) return raw === 'true'
  } catch {
    // ignore
  }
  return fallback
}

function getSystemDark(): boolean {
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  return false
}

// Module-level singletons so multiple calls share state
const mode = ref<ThemeMode>(loadString(THEME_KEY, 'system'))
const highContrast = ref<boolean>(loadBool(HC_KEY, false))
const systemDark = ref<boolean>(getSystemDark())

let mediaListenerAttached = false

function attachMediaListener() {
  if (mediaListenerAttached || typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  const handler = (e: MediaQueryListEvent) => {
    systemDark.value = e.matches
  }
  mq.addEventListener('change', handler)
  mediaListenerAttached = true
}

function applyToDocument() {
  if (typeof document === 'undefined') return
  const el = document.documentElement

  const isDark = mode.value === 'dark' || (mode.value === 'system' && systemDark.value)

  el.classList.toggle('dark', isDark)
  el.classList.toggle('light', !isDark)
  el.classList.toggle('high-contrast', highContrast.value)
  el.setAttribute('data-theme', isDark ? 'dark' : 'light')
}

export function useTheme() {
  attachMediaListener()

  const resolvedTheme = computed<'light' | 'dark'>(() => {
    if (mode.value === 'system') {
      return systemDark.value ? 'dark' : 'light'
    }
    return mode.value
  })

  const isDark = computed(() => resolvedTheme.value === 'dark')

  function setMode(m: ThemeMode) {
    mode.value = m
    localStorage.setItem(THEME_KEY, m)
    applyToDocument()
  }

  function toggleDark() {
    if (mode.value === 'system') {
      setMode(systemDark.value ? 'light' : 'dark')
    } else {
      setMode(mode.value === 'dark' ? 'light' : 'dark')
    }
  }

  function setHighContrast(val: boolean) {
    highContrast.value = val
    localStorage.setItem(HC_KEY, String(val))
    applyToDocument()
  }

  function toggleHighContrast() {
    setHighContrast(!highContrast.value)
  }

  // React to system preference changes
  watch(systemDark, () => {
    applyToDocument()
  })

  // Apply immediately
  applyToDocument()

  return {
    mode,
    highContrast,
    resolvedTheme,
    isDark,
    setMode,
    toggleDark,
    setHighContrast,
    toggleHighContrast,
  }
}

/** Reset shared state — for testing only. Call after setting localStorage if needed. */
export function _resetTheme() {
  mode.value = loadString(THEME_KEY, 'system')
  highContrast.value = loadBool(HC_KEY, false)
  systemDark.value = getSystemDark()
  if (typeof document !== 'undefined') {
    document.documentElement.className = ''
    document.documentElement.removeAttribute('data-theme')
  }
}


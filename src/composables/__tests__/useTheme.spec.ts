import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock matchMedia for jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

import { useTheme, _resetTheme } from '@/composables/useTheme'

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear()
    _resetTheme()
  })

  it('defaults to system mode', () => {
    const { mode } = useTheme()
    expect(mode.value).toBe('system')
  })

  it('applies light class by default (system with no dark preference)', () => {
    useTheme()
    expect(document.documentElement.classList.contains('light')).toBe(true)
  })

  it('sets data-theme attribute', () => {
    useTheme()
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('toggleDark switches from system to explicit mode', () => {
    const { mode, toggleDark } = useTheme()
    // system resolves to light in jsdom (no dark preference)
    toggleDark()
    expect(mode.value).toBe('dark')
  })

  it('toggleDark toggles between light and dark', () => {
    const { mode, setMode, toggleDark } = useTheme()
    setMode('light')
    toggleDark()
    expect(mode.value).toBe('dark')
    toggleDark()
    expect(mode.value).toBe('light')
  })

  it('setMode changes mode', () => {
    const { mode, setMode } = useTheme()
    setMode('dark')
    expect(mode.value).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('persists mode to localStorage', () => {
    const { setMode } = useTheme()
    setMode('dark')
    expect(localStorage.getItem('theme:mode')).toBe('dark')
  })

  it('loads mode from localStorage', () => {
    localStorage.setItem('theme:mode', 'dark')
    _resetTheme()
    const { mode } = useTheme()
    expect(mode.value).toBe('dark')
  })

  it('highContrast defaults to false', () => {
    const { highContrast } = useTheme()
    expect(highContrast.value).toBe(false)
  })

  it('toggleHighContrast enables high contrast', () => {
    const { highContrast, toggleHighContrast } = useTheme()
    toggleHighContrast()
    expect(highContrast.value).toBe(true)
    expect(document.documentElement.classList.contains('high-contrast')).toBe(true)
  })

  it('toggleHighContrast toggles off', () => {
    const { highContrast, toggleHighContrast } = useTheme()
    toggleHighContrast()
    expect(highContrast.value).toBe(true)
    toggleHighContrast()
    expect(highContrast.value).toBe(false)
    expect(document.documentElement.classList.contains('high-contrast')).toBe(false)
  })

  it('setHighContrast sets explicit value', () => {
    const { highContrast, setHighContrast } = useTheme()
    setHighContrast(true)
    expect(highContrast.value).toBe(true)
    setHighContrast(false)
    expect(highContrast.value).toBe(false)
  })

  it('persists highContrast to localStorage', () => {
    const { toggleHighContrast } = useTheme()
    toggleHighContrast()
    expect(localStorage.getItem('theme:highContrast')).toBe('true')
  })

  it('loads highContrast from localStorage', () => {
    localStorage.setItem('theme:highContrast', 'true')
    _resetTheme()
    const { highContrast } = useTheme()
    expect(highContrast.value).toBe(true)
  })

  it('isDark computed reflects resolved theme', () => {
    const { isDark, setMode } = useTheme()
    setMode('light')
    expect(isDark.value).toBe(false)
    setMode('dark')
    expect(isDark.value).toBe(true)
  })

  it('resolvedTheme returns light or dark', () => {
    const { resolvedTheme, setMode } = useTheme()
    setMode('light')
    expect(resolvedTheme.value).toBe('light')
    setMode('dark')
    expect(resolvedTheme.value).toBe('dark')
  })

  it('dark mode applies correct classes and removes light', () => {
    const { setMode } = useTheme()
    setMode('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.classList.contains('light')).toBe(false)
  })

  it('light mode applies correct classes and removes dark', () => {
    const { setMode } = useTheme()
    setMode('dark')
    setMode('light')
    expect(document.documentElement.classList.contains('light')).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('high contrast + dark applies both classes', () => {
    const { setMode, setHighContrast } = useTheme()
    setMode('dark')
    setHighContrast(true)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.classList.contains('high-contrast')).toBe(true)
  })

  it('high contrast + light applies both classes', () => {
    const { setMode, setHighContrast } = useTheme()
    setMode('light')
    setHighContrast(true)
    expect(document.documentElement.classList.contains('light')).toBe(true)
    expect(document.documentElement.classList.contains('high-contrast')).toBe(true)
  })
})


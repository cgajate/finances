import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { usePin } from '@/composables/usePin'

// Mock crypto.subtle.digest without replacing the entire crypto global
const mockDigest = vi.fn()
const originalSubtle = globalThis.crypto?.subtle

describe('usePin', () => {
  beforeEach(() => {
    // Replace only subtle.digest, keeping the rest of crypto intact
    Object.defineProperty(globalThis.crypto, 'subtle', {
      value: { ...originalSubtle, digest: mockDigest },
      configurable: true,
    })
    localStorage.clear()
    // Return a deterministic hash
    mockDigest.mockResolvedValue(new Uint8Array([0xab, 0xcd, 0x12, 0x34]).buffer)
    // Reset module-level authenticated state
    const { lock } = usePin()
    lock()
  })

  afterEach(() => {
    Object.defineProperty(globalThis.crypto, 'subtle', {
      value: originalSubtle,
      configurable: true,
    })
  })

  it('hasPin is false when no hash stored', () => {
    const { hasPin } = usePin()
    expect(hasPin.value).toBe(false)
  })

  it('hasPin is true when hash exists in localStorage', () => {
    localStorage.setItem('pin:hash', 'somehash')
    const { hasPin } = usePin()
    expect(hasPin.value).toBe(true)
  })

  describe('setPin', () => {
    it('stores hash and sets authenticated', async () => {
      const { setPin, authenticated, hasPin } = usePin()
      await setPin('1234')
      expect(localStorage.getItem('pin:hash')).toBe('abcd1234')
      expect(authenticated.value).toBe(true)
      expect(hasPin.value).toBe(true)
    })
  })

  describe('verifyPin', () => {
    it('returns true and authenticates when PIN matches', async () => {
      const { setPin, verifyPin, authenticated } = usePin()
      await setPin('1234')
      authenticated.value = false
      const result = await verifyPin('1234')
      expect(result).toBe(true)
      expect(authenticated.value).toBe(true)
    })

    it('returns false when no hash stored', async () => {
      const { verifyPin } = usePin()
      const result = await verifyPin('1234')
      expect(result).toBe(false)
    })

    it('returns false when PIN does not match', async () => {
      localStorage.setItem('pin:hash', 'differenthash')
      const { verifyPin, authenticated } = usePin()
      const result = await verifyPin('9999')
      expect(result).toBe(false)
      expect(authenticated.value).toBe(false)
    })
  })

  describe('checkRemembered', () => {
    it('returns false when nothing stored', () => {
      const { checkRemembered } = usePin()
      expect(checkRemembered()).toBe(false)
    })

    it('returns true and authenticates when not expired', () => {
      localStorage.setItem('pin:remembered', JSON.stringify({ expiry: Date.now() + 100000 }))
      const { checkRemembered, authenticated } = usePin()
      expect(checkRemembered()).toBe(true)
      expect(authenticated.value).toBe(true)
    })

    it('returns false and clears when expired', () => {
      localStorage.setItem('pin:remembered', JSON.stringify({ expiry: Date.now() - 1 }))
      const { checkRemembered } = usePin()
      expect(checkRemembered()).toBe(false)
      expect(localStorage.getItem('pin:remembered')).toBeNull()
    })

    it('returns false on invalid JSON', () => {
      localStorage.setItem('pin:remembered', 'not-json')
      const { checkRemembered } = usePin()
      expect(checkRemembered()).toBe(false)
    })
  })

  describe('remember', () => {
    it('stores expiry in localStorage', () => {
      const { remember } = usePin()
      remember()
      const raw = localStorage.getItem('pin:remembered')
      expect(raw).toBeTruthy()
      const parsed = JSON.parse(raw!) as { expiry: number }
      expect(parsed.expiry).toBeGreaterThan(Date.now())
    })
  })

  describe('lock', () => {
    it('sets authenticated to false and clears remembered', async () => {
      const { setPin, remember, lock, authenticated } = usePin()
      await setPin('1234')
      remember()
      expect(authenticated.value).toBe(true)
      lock()
      expect(authenticated.value).toBe(false)
      expect(localStorage.getItem('pin:remembered')).toBeNull()
    })
  })
})

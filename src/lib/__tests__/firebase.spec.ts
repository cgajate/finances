import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock firebase modules before importing
const mockInitializeApp = vi.fn().mockReturnValue({})
const mockGetFirestore = vi.fn().mockReturnValue({})
const mockGetAuth = vi.fn().mockReturnValue({ currentUser: null })
const mockSignInAnonymously = vi.fn()
const mockEnablePersistence = vi.fn().mockResolvedValue(undefined)

vi.mock('firebase/app', () => ({
  initializeApp: mockInitializeApp,
}))

vi.mock('firebase/firestore', () => ({
  getFirestore: mockGetFirestore,
  enableMultiTabIndexedDbPersistence: mockEnablePersistence,
}))

vi.mock('firebase/auth', () => ({
  getAuth: mockGetAuth,
  signInAnonymously: mockSignInAnonymously,
}))

describe('firebase lib', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset module state by re-importing
    vi.resetModules()
  })

  it('getDb returns null when not configured', async () => {
    vi.stubEnv('VITE_FIREBASE_API_KEY', '')
    const { getDb } = await import('@/lib/firebase')
    expect(getDb()).toBeNull()
    vi.unstubAllEnvs()
  })

  it('getDb initializes and returns db when configured', async () => {
    vi.stubEnv('VITE_FIREBASE_API_KEY', 'test-key')
    vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', 'test.firebaseapp.com')
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'test-project')
    vi.stubEnv('VITE_FIREBASE_STORAGE_BUCKET', 'test.appspot.com')
    vi.stubEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', '123')
    vi.stubEnv('VITE_FIREBASE_APP_ID', 'app-id')
    const { getDb } = await import('@/lib/firebase')
    const result = getDb()
    expect(mockInitializeApp).toHaveBeenCalled()
    expect(mockGetFirestore).toHaveBeenCalled()
    expect(result).toBeDefined()
    vi.unstubAllEnvs()
  })

  it('getFirebaseAuth returns null when not configured', async () => {
    vi.stubEnv('VITE_FIREBASE_API_KEY', '')
    const { getFirebaseAuth } = await import('@/lib/firebase')
    expect(getFirebaseAuth()).toBeNull()
    vi.unstubAllEnvs()
  })

  it('getFirebaseAuth returns auth when configured', async () => {
    vi.stubEnv('VITE_FIREBASE_API_KEY', 'test-key')
    vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', 'test.firebaseapp.com')
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'test-project')
    vi.stubEnv('VITE_FIREBASE_STORAGE_BUCKET', 'test.appspot.com')
    vi.stubEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', '123')
    vi.stubEnv('VITE_FIREBASE_APP_ID', 'app-id')
    const { getFirebaseAuth } = await import('@/lib/firebase')
    expect(getFirebaseAuth()).toBeDefined()
    vi.unstubAllEnvs()
  })

  it('ensureAuth returns null when not configured', async () => {
    vi.stubEnv('VITE_FIREBASE_API_KEY', '')
    const { ensureAuth } = await import('@/lib/firebase')
    const result = await ensureAuth()
    expect(result).toBeNull()
    vi.unstubAllEnvs()
  })

  it('ensureAuth returns currentUser uid when already signed in', async () => {
    vi.stubEnv('VITE_FIREBASE_API_KEY', 'test-key')
    vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', 'test.firebaseapp.com')
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'test-project')
    vi.stubEnv('VITE_FIREBASE_STORAGE_BUCKET', 'test.appspot.com')
    vi.stubEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', '123')
    vi.stubEnv('VITE_FIREBASE_APP_ID', 'app-id')
    mockGetAuth.mockReturnValue({ currentUser: { uid: 'user123' } })
    const { ensureAuth } = await import('@/lib/firebase')
    const result = await ensureAuth()
    expect(result).toBe('user123')
    vi.unstubAllEnvs()
  })

  it('ensureAuth signs in anonymously when no current user', async () => {
    vi.stubEnv('VITE_FIREBASE_API_KEY', 'test-key')
    vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', 'test.firebaseapp.com')
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'test-project')
    vi.stubEnv('VITE_FIREBASE_STORAGE_BUCKET', 'test.appspot.com')
    vi.stubEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', '123')
    vi.stubEnv('VITE_FIREBASE_APP_ID', 'app-id')
    mockGetAuth.mockReturnValue({ currentUser: null })
    mockSignInAnonymously.mockResolvedValue({ user: { uid: 'anon123' } })
    const { ensureAuth } = await import('@/lib/firebase')
    const result = await ensureAuth()
    expect(result).toBe('anon123')
    vi.unstubAllEnvs()
  })

  it('ensureAuth returns null when sign-in fails', async () => {
    vi.stubEnv('VITE_FIREBASE_API_KEY', 'test-key')
    vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', 'test.firebaseapp.com')
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'test-project')
    vi.stubEnv('VITE_FIREBASE_STORAGE_BUCKET', 'test.appspot.com')
    vi.stubEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', '123')
    vi.stubEnv('VITE_FIREBASE_APP_ID', 'app-id')
    mockGetAuth.mockReturnValue({ currentUser: null })
    mockSignInAnonymously.mockRejectedValue(new Error('fail'))
    const { ensureAuth } = await import('@/lib/firebase')
    const result = await ensureAuth()
    expect(result).toBeNull()
    vi.unstubAllEnvs()
  })

  it('isConfigured returns false when no API key', async () => {
    vi.stubEnv('VITE_FIREBASE_API_KEY', '')
    const { isConfigured } = await import('@/lib/firebase')
    expect(isConfigured()).toBe(false)
    vi.unstubAllEnvs()
  })

  it('isConfigured returns true when API key set', async () => {
    vi.stubEnv('VITE_FIREBASE_API_KEY', 'test-key')
    const { isConfigured } = await import('@/lib/firebase')
    expect(isConfigured()).toBe(true)
    vi.unstubAllEnvs()
  })

  it('init only runs once', async () => {
    vi.stubEnv('VITE_FIREBASE_API_KEY', 'test-key')
    vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', 'test.firebaseapp.com')
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'test-project')
    vi.stubEnv('VITE_FIREBASE_STORAGE_BUCKET', 'test.appspot.com')
    vi.stubEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', '123')
    vi.stubEnv('VITE_FIREBASE_APP_ID', 'app-id')
    const { getDb } = await import('@/lib/firebase')
    getDb()
    getDb()
    expect(mockInitializeApp).toHaveBeenCalledTimes(1)
    vi.unstubAllEnvs()
  })

  it('handles persistence failure gracefully', async () => {
    vi.stubEnv('VITE_FIREBASE_API_KEY', 'test-key')
    vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', 'test.firebaseapp.com')
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'test-project')
    vi.stubEnv('VITE_FIREBASE_STORAGE_BUCKET', 'test.appspot.com')
    vi.stubEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', '123')
    vi.stubEnv('VITE_FIREBASE_APP_ID', 'app-id')
    mockEnablePersistence.mockRejectedValue({ code: 'failed-precondition' })
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { getDb } = await import('@/lib/firebase')
    getDb()
    // Wait for the promise rejection to be handled
    await new Promise((r) => setTimeout(r, 10))
    expect(consoleWarn).toHaveBeenCalled()
    consoleWarn.mockRestore()
    vi.unstubAllEnvs()
  })
})


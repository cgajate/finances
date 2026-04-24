import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { User, Auth } from 'firebase/auth'

// Mock firebase/auth
const mockSignInWithPopup = vi.fn()
const mockSignInWithCredential = vi.fn()
const mockSignInAnonymously = vi.fn()
const mockOnAuthStateChanged = vi.fn()
const mockGoogleAuthProvider: ReturnType<typeof vi.fn> & { credential: ReturnType<typeof vi.fn> } = Object.assign(vi.fn(), {
  credential: vi.fn(),
})

vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: mockGoogleAuthProvider,
  signInWithPopup: mockSignInWithPopup,
  signInWithCredential: mockSignInWithCredential,
  signInAnonymously: mockSignInAnonymously,
  onAuthStateChanged: mockOnAuthStateChanged,
}))

// Mock Capacitor
let mockIsNative = false
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => mockIsNative,
  },
}))

// Mock @capgo/capacitor-social-login
const mockSocialLoginInit = vi.fn()
const mockSocialLoginLogin = vi.fn()
vi.mock('@capgo/capacitor-social-login', () => ({
  SocialLogin: {
    initialize: (...args: unknown[]) => mockSocialLoginInit(...args),
    login: (...args: unknown[]) => mockSocialLoginLogin(...args),
  },
}))

// Mock firebase lib
const mockGetFirebaseAuth = vi.fn<() => Auth | null>()
const mockInit = vi.fn()

vi.mock('@/lib/firebase', () => ({
  getFirebaseAuth: () => mockGetFirebaseAuth(),
  init: () => mockInit(),
}))

// We need to reset the module-level state between tests
let useAuth: typeof import('@/composables/useAuth').useAuth

describe('useAuth', () => {
  beforeEach(async () => {
    vi.resetAllMocks()
    mockIsNative = false
    mockGoogleAuthProvider.credential = vi.fn()
    // Re-import to reset module-level refs
    vi.resetModules()

    // Re-setup mocks after resetModules
    vi.doMock('firebase/auth', () => ({
      GoogleAuthProvider: mockGoogleAuthProvider,
      signInWithPopup: mockSignInWithPopup,
      signInWithCredential: mockSignInWithCredential,
      signInAnonymously: mockSignInAnonymously,
      onAuthStateChanged: mockOnAuthStateChanged,
    }))
    vi.doMock('@capacitor/core', () => ({
      Capacitor: {
        isNativePlatform: () => mockIsNative,
      },
    }))
    vi.doMock('@capgo/capacitor-social-login', () => ({
      SocialLogin: {
        initialize: (...args: unknown[]) => mockSocialLoginInit(...args),
        login: (...args: unknown[]) => mockSocialLoginLogin(...args),
      },
    }))
    vi.doMock('@/lib/firebase', () => ({
      getFirebaseAuth: () => mockGetFirebaseAuth(),
      init: () => mockInit(),
    }))

    const mod = await import('@/composables/useAuth')
    useAuth = mod.useAuth
  })

  // --- computed defaults ---
  it('starts with loading true and not authenticated', () => {
    const { authenticated, loading } = useAuth()
    expect(loading.value).toBe(true)
    expect(authenticated.value).toBe(false)
  })

  it('displayName returns empty string when no user', () => {
    const { displayName } = useAuth()
    expect(displayName.value).toBe('')
  })

  it('userId returns empty string when no user', () => {
    const { userId } = useAuth()
    expect(userId.value).toBe('')
  })

  it('photoURL returns null when no user', () => {
    const { photoURL } = useAuth()
    expect(photoURL.value).toBeNull()
  })

  it('isAnonymous returns false when no user', () => {
    const { isAnonymous } = useAuth()
    expect(isAnonymous.value).toBe(false)
  })

  // --- displayName branches ---
  it('displayName returns displayName when set', () => {
    const { firebaseUser, displayName } = useAuth()
    firebaseUser.value = { displayName: 'John', email: 'john@test.com', providerData: [] } as unknown as User
    expect(displayName.value).toBe('John')
  })

  it('displayName returns email prefix when no displayName', () => {
    const { firebaseUser, displayName } = useAuth()
    firebaseUser.value = { displayName: null, email: 'jane@example.com', providerData: [] } as unknown as User
    expect(displayName.value).toBe('jane')
  })

  it('displayName returns "Anonymous" when no displayName or email', () => {
    const { firebaseUser, displayName } = useAuth()
    firebaseUser.value = { displayName: null, email: null, providerData: [] } as unknown as User
    expect(displayName.value).toBe('Anonymous')
  })

  // --- userId branches ---
  it('userId returns displayName when set', () => {
    const { firebaseUser, userId } = useAuth()
    firebaseUser.value = { displayName: 'Bob', email: 'bob@test.com', uid: 'u1', providerData: [] } as unknown as User
    expect(userId.value).toBe('Bob')
  })

  it('userId returns email when no displayName', () => {
    const { firebaseUser, userId } = useAuth()
    firebaseUser.value = { displayName: null, email: 'bob@test.com', uid: 'u1', providerData: [] } as unknown as User
    expect(userId.value).toBe('bob@test.com')
  })

  it('userId returns uid when no displayName or email', () => {
    const { firebaseUser, userId } = useAuth()
    firebaseUser.value = { displayName: null, email: null, uid: 'u1', providerData: [] } as unknown as User
    expect(userId.value).toBe('u1')
  })

  // --- photoURL branches ---
  it('photoURL returns user photoURL when set', () => {
    const { firebaseUser, photoURL } = useAuth()
    firebaseUser.value = { photoURL: 'https://photo.jpg', providerData: [] } as unknown as User
    expect(photoURL.value).toBe('https://photo.jpg')
  })

  it('photoURL falls back to provider data photoURL', () => {
    const { firebaseUser, photoURL } = useAuth()
    firebaseUser.value = {
      photoURL: null,
      providerData: [{ photoURL: 'https://provider.jpg' }],
    } as unknown as User
    expect(photoURL.value).toBe('https://provider.jpg')
  })

  it('photoURL returns null when no photo anywhere', () => {
    const { firebaseUser, photoURL } = useAuth()
    firebaseUser.value = { photoURL: null, providerData: [{ photoURL: null }] } as unknown as User
    expect(photoURL.value).toBeNull()
  })

  it('photoURL returns null when providerData is empty', () => {
    const { firebaseUser, photoURL } = useAuth()
    firebaseUser.value = { photoURL: null, providerData: [] } as unknown as User
    expect(photoURL.value).toBeNull()
  })

  // --- isAnonymous ---
  it('isAnonymous returns true for anonymous user', () => {
    const { firebaseUser, isAnonymous } = useAuth()
    firebaseUser.value = { isAnonymous: true, providerData: [] } as unknown as User
    expect(isAnonymous.value).toBe(true)
  })

  // --- initAuth ---
  it('initAuth sets loading false when no firebase auth configured', async () => {
    mockGetFirebaseAuth.mockReturnValue(null)
    const { initAuth, loading } = useAuth()
    await initAuth()
    expect(mockInit).toHaveBeenCalled()
    expect(loading.value).toBe(false)
  })

  it('initAuth registers onAuthStateChanged when auth is available', async () => {
    const fakeAuth = {} as Auth
    mockGetFirebaseAuth.mockReturnValue(fakeAuth)
    const { initAuth } = useAuth()
    await initAuth()
    expect(mockOnAuthStateChanged).toHaveBeenCalledWith(fakeAuth, expect.any(Function))
  })

  it('initAuth only initializes once', async () => {
    mockGetFirebaseAuth.mockReturnValue(null)
    const { initAuth } = useAuth()
    await initAuth()
    await initAuth()
    expect(mockInit).toHaveBeenCalledTimes(1)
  })

  it('onAuthStateChanged callback updates firebaseUser and loading', async () => {
    const fakeAuth = {} as Auth
    mockGetFirebaseAuth.mockReturnValue(fakeAuth)
    const { initAuth, firebaseUser, loading } = useAuth()
    await initAuth()

    const callback = mockOnAuthStateChanged.mock.calls[0]![1] as (user: User | null) => void
    const fakeUser = { uid: 'u1', displayName: 'Test', providerData: [] } as unknown as User
    callback(fakeUser)

    expect(firebaseUser.value).toStrictEqual(fakeUser)
    expect(loading.value).toBe(false)
  })

  it('initAuth initializes SocialLogin on native', async () => {
    mockIsNative = true
    vi.resetModules()
    vi.doMock('firebase/auth', () => ({
      GoogleAuthProvider: mockGoogleAuthProvider,
      signInWithPopup: mockSignInWithPopup,
      signInWithCredential: mockSignInWithCredential,
      signInAnonymously: mockSignInAnonymously,
      onAuthStateChanged: mockOnAuthStateChanged,
    }))
    vi.doMock('@capacitor/core', () => ({
      Capacitor: { isNativePlatform: () => mockIsNative },
    }))
    vi.doMock('@capgo/capacitor-social-login', () => ({
      SocialLogin: {
        initialize: (...args: unknown[]) => mockSocialLoginInit(...args),
        login: (...args: unknown[]) => mockSocialLoginLogin(...args),
      },
    }))
    vi.doMock('@/lib/firebase', () => ({
      getFirebaseAuth: () => mockGetFirebaseAuth(),
      init: () => mockInit(),
    }))
    const mod = await import('@/composables/useAuth')
    const fakeAuth = {} as Auth
    mockGetFirebaseAuth.mockReturnValue(fakeAuth)
    mockSocialLoginInit.mockResolvedValue(undefined)
    const { initAuth } = mod.useAuth()
    await initAuth()
    expect(mockSocialLoginInit).toHaveBeenCalledTimes(1)
    const callArg = mockSocialLoginInit.mock.calls[0]![0] as Record<string, unknown>
    expect(callArg).toHaveProperty('google')
    expect(callArg.google).toHaveProperty('webClientId')
  })

  // --- signInWithGoogle ---
  it('signInWithGoogle returns false when no auth', async () => {
    mockGetFirebaseAuth.mockReturnValue(null)
    const { signInWithGoogle } = useAuth()
    expect(await signInWithGoogle()).toBe(false)
  })

  it('signInWithGoogle uses popup on web', async () => {
    const fakeAuth = {} as Auth
    mockGetFirebaseAuth.mockReturnValue(fakeAuth)
    mockSignInWithPopup.mockResolvedValue({})
    const { signInWithGoogle } = useAuth()
    expect(await signInWithGoogle()).toBe(true)
    expect(mockSignInWithPopup).toHaveBeenCalled()
  })

  it('signInWithGoogle returns false on web error', async () => {
    const fakeAuth = {} as Auth
    mockGetFirebaseAuth.mockReturnValue(fakeAuth)
    mockSignInWithPopup.mockRejectedValue(new Error('popup blocked'))
    const { signInWithGoogle } = useAuth()
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(await signInWithGoogle()).toBe(false)
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('signInWithGoogle uses native SocialLogin and signInWithCredential on native', async () => {
    mockIsNative = true
    vi.resetModules()
    vi.doMock('firebase/auth', () => ({
      GoogleAuthProvider: mockGoogleAuthProvider,
      signInWithPopup: mockSignInWithPopup,
      signInWithCredential: mockSignInWithCredential,
      signInAnonymously: mockSignInAnonymously,
      onAuthStateChanged: mockOnAuthStateChanged,
    }))
    vi.doMock('@capacitor/core', () => ({
      Capacitor: { isNativePlatform: () => mockIsNative },
    }))
    vi.doMock('@capgo/capacitor-social-login', () => ({
      SocialLogin: {
        initialize: (...args: unknown[]) => mockSocialLoginInit(...args),
        login: (...args: unknown[]) => mockSocialLoginLogin(...args),
      },
    }))
    vi.doMock('@/lib/firebase', () => ({
      getFirebaseAuth: () => mockGetFirebaseAuth(),
      init: () => mockInit(),
    }))
    const mod = await import('@/composables/useAuth')
    const fakeAuth = {} as Auth
    mockGetFirebaseAuth.mockReturnValue(fakeAuth)
    const fakeCred = { token: 'fake' }
    mockGoogleAuthProvider.credential.mockReturnValue(fakeCred)
    mockSignInWithCredential.mockResolvedValue({})
    mockSocialLoginLogin.mockResolvedValue({
      result: { responseType: 'online', idToken: 'native-id-token', profile: {} },
    })
    const { signInWithGoogle } = mod.useAuth()
    expect(await signInWithGoogle()).toBe(true)
    expect(mockSocialLoginLogin).toHaveBeenCalled()
    expect(mockGoogleAuthProvider.credential).toHaveBeenCalledWith('native-id-token')
    expect(mockSignInWithCredential).toHaveBeenCalledWith(fakeAuth, fakeCred)
    expect(mockSignInWithPopup).not.toHaveBeenCalled()
  })

  it('signInWithGoogle returns false when native returns no idToken', async () => {
    mockIsNative = true
    vi.resetModules()
    vi.doMock('firebase/auth', () => ({
      GoogleAuthProvider: mockGoogleAuthProvider,
      signInWithPopup: mockSignInWithPopup,
      signInWithCredential: mockSignInWithCredential,
      signInAnonymously: mockSignInAnonymously,
      onAuthStateChanged: mockOnAuthStateChanged,
    }))
    vi.doMock('@capacitor/core', () => ({
      Capacitor: { isNativePlatform: () => mockIsNative },
    }))
    vi.doMock('@capgo/capacitor-social-login', () => ({
      SocialLogin: {
        initialize: (...args: unknown[]) => mockSocialLoginInit(...args),
        login: (...args: unknown[]) => mockSocialLoginLogin(...args),
      },
    }))
    vi.doMock('@/lib/firebase', () => ({
      getFirebaseAuth: () => mockGetFirebaseAuth(),
      init: () => mockInit(),
    }))
    const mod = await import('@/composables/useAuth')
    const fakeAuth = {} as Auth
    mockGetFirebaseAuth.mockReturnValue(fakeAuth)
    mockSocialLoginLogin.mockResolvedValue({
      result: { responseType: 'online', idToken: null, profile: {} },
    })
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { signInWithGoogle } = mod.useAuth()
    expect(await signInWithGoogle()).toBe(false)
    consoleSpy.mockRestore()
  })

  it('signInWithGoogle returns false when native returns offline response', async () => {
    mockIsNative = true
    vi.resetModules()
    vi.doMock('firebase/auth', () => ({
      GoogleAuthProvider: mockGoogleAuthProvider,
      signInWithPopup: mockSignInWithPopup,
      signInWithCredential: mockSignInWithCredential,
      signInAnonymously: mockSignInAnonymously,
      onAuthStateChanged: mockOnAuthStateChanged,
    }))
    vi.doMock('@capacitor/core', () => ({
      Capacitor: { isNativePlatform: () => mockIsNative },
    }))
    vi.doMock('@capgo/capacitor-social-login', () => ({
      SocialLogin: {
        initialize: (...args: unknown[]) => mockSocialLoginInit(...args),
        login: (...args: unknown[]) => mockSocialLoginLogin(...args),
      },
    }))
    vi.doMock('@/lib/firebase', () => ({
      getFirebaseAuth: () => mockGetFirebaseAuth(),
      init: () => mockInit(),
    }))
    const mod = await import('@/composables/useAuth')
    const fakeAuth = {} as Auth
    mockGetFirebaseAuth.mockReturnValue(fakeAuth)
    mockSocialLoginLogin.mockResolvedValue({
      result: { responseType: 'offline', serverAuthCode: 'code' },
    })
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { signInWithGoogle } = mod.useAuth()
    expect(await signInWithGoogle()).toBe(false)
    consoleSpy.mockRestore()
  })

  // --- signInAnon ---
  it('signInAnon returns false when no auth', async () => {
    mockGetFirebaseAuth.mockReturnValue(null)
    const { signInAnon } = useAuth()
    expect(await signInAnon()).toBe(false)
  })

  it('signInAnon returns true on success', async () => {
    const fakeAuth = {} as Auth
    mockGetFirebaseAuth.mockReturnValue(fakeAuth)
    mockSignInAnonymously.mockResolvedValue({})
    const { signInAnon } = useAuth()
    expect(await signInAnon()).toBe(true)
  })

  it('signInAnon returns false on error', async () => {
    const fakeAuth = {} as Auth
    mockGetFirebaseAuth.mockReturnValue(fakeAuth)
    mockSignInAnonymously.mockRejectedValue(new Error('fail'))
    const { signInAnon } = useAuth()
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(await signInAnon()).toBe(false)
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  // --- signOut ---
  it('signOut does nothing when no auth', async () => {
    mockGetFirebaseAuth.mockReturnValue(null)
    const { signOut } = useAuth()
    await signOut() // should not throw
  })

  it('signOut calls auth.signOut', async () => {
    const mockSignOutFn = vi.fn().mockResolvedValue(undefined)
    const fakeAuth = { signOut: mockSignOutFn } as unknown as Auth
    mockGetFirebaseAuth.mockReturnValue(fakeAuth)
    const { signOut } = useAuth()
    await signOut()
    expect(mockSignOutFn).toHaveBeenCalled()
  })
})


import { ref, computed } from 'vue'
import { Capacitor } from '@capacitor/core'
import {
  getFirebaseAuth,
  init as initFirebase,
} from '@/lib/firebase'
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  signInAnonymously,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'

/** Reactive auth state shared across all consumers */
const firebaseUser = ref<User | null>(null)
const loading = ref(true)
const initialized = ref(false)
const lastError = ref('')

/** Whether the app is running on a native platform (Android/iOS) */
const isNative = Capacitor.isNativePlatform()

/** Lazy-load the SocialLogin plugin only on native platforms */
async function getNativeSocialLogin() {
  const { SocialLogin } = await import('@capgo/capacitor-social-login')
  return SocialLogin
}

/**
 * Composable for Firebase Authentication with Google sign-in
 * and anonymous fallback.
 *
 * On native (Android/iOS), uses `@capgo/capacitor-social-login` for native
 * Google Sign-In, then bridges the ID token into Firebase via
 * `signInWithCredential`. On web, uses Firebase's `signInWithPopup`.
 */
export function useAuth() {
  const authenticated = computed(() => !!firebaseUser.value)

  /** Display name: Google name → email prefix → "Anonymous" */
  const displayName = computed(() => {
    const u = firebaseUser.value
    if (!u) return ''
    if (u.displayName) return u.displayName
    if (u.email) return u.email.split('@')[0] ?? u.email
    return 'Anonymous'
  })

  /** Short identifier for activity logs / approvals */
  const userId = computed(() => {
    const u = firebaseUser.value
    if (!u) return ''
    return u.displayName ?? u.email ?? u.uid
  })

  const photoURL = computed(() => {
    const u = firebaseUser.value
    if (!u) return null
    // Top-level photoURL may be null; fall back to provider data
    return u.photoURL ?? u.providerData[0]?.photoURL ?? null
  })
  const isAnonymous = computed(() => firebaseUser.value?.isAnonymous ?? false)

  /** Bootstrap: listen for auth state once */
  async function initAuth() {
    if (initialized.value) return
    initialized.value = true

    initFirebase()
    const auth = getFirebaseAuth()
    if (!auth) {
      // Firebase not configured — skip auth, treat as authenticated
      loading.value = false
      return
    }

    onAuthStateChanged(auth, (user) => {
      firebaseUser.value = user
      loading.value = false
    })

    // Initialize the native social login plugin on Android/iOS
    if (isNative) {
      try {
        const SocialLogin = await getNativeSocialLogin()
        await SocialLogin.initialize({
          google: {
            webClientId: import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID as string,
          },
        })
      } catch (err) {
        console.error('SocialLogin initialization failed:', err)
      }
    }
  }

  /**
   * Sign in with Google.
   * On native platforms, uses the device's native Google Sign-In (via
   * `@capgo/capacitor-social-login`) to obtain an ID token, then signs
   * into Firebase with that credential. This avoids the WebView
   * "secure browsers" policy block.
   * On web, uses Firebase's `signInWithPopup` directly.
   */
  async function signInWithGoogle(): Promise<boolean> {
    const auth = getFirebaseAuth()
    lastError.value = ''
    if (!auth) {
      lastError.value = 'Firebase auth not available'
      return false
    }

    try {
      if (isNative) {
        const SocialLogin = await getNativeSocialLogin()
        const res = await SocialLogin.login({
          provider: 'google',
          options: {},
        })

        if (res.result.responseType !== 'online') {
          lastError.value = 'Google returned offline response'
          return false
        }

        const idToken = res.result.idToken
        if (!idToken) {
          lastError.value = 'No ID token returned from Google'
          return false
        }

        // Bridge the native ID token into Firebase Auth
        const credential = GoogleAuthProvider.credential(idToken)
        await signInWithCredential(auth, credential)
      } else {
        const provider = new GoogleAuthProvider()
        await signInWithPopup(auth, provider)
      }
      return true
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      const code = (err as Record<string, unknown>)?.['code'] ?? ''
      lastError.value = code ? `[${code}] ${msg}` : msg
      console.error('Google sign-in failed:', err)
      return false
    }
  }

  /** Sign in anonymously (no account required) */
  async function signInAnon(): Promise<boolean> {
    const auth = getFirebaseAuth()
    if (!auth) return false

    try {
      await signInAnonymously(auth)
      return true
    } catch (err) {
      console.error('Anonymous sign-in failed:', err)
      return false
    }
  }

  /** Sign out the current user */
  async function signOut(): Promise<void> {
    const auth = getFirebaseAuth()
    if (!auth) return
    await auth.signOut()
  }

  return {
    firebaseUser,
    loading,
    lastError,
    authenticated,
    displayName,
    userId,
    photoURL,
    isAnonymous,
    initAuth,
    signInWithGoogle,
    signInAnon,
    signOut,
  }
}

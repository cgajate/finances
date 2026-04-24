import { ref, computed } from 'vue'
import {
  getFirebaseAuth,
  init as initFirebase,
} from '@/lib/firebase'
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'

/** Reactive auth state shared across all consumers */
const firebaseUser = ref<User | null>(null)
const loading = ref(true)
const initialized = ref(false)

/**
 * Composable for Firebase Authentication with Google sign-in
 * and anonymous fallback. Replaces the old PIN-based gate.
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
  function initAuth() {
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
  }

  /** Sign in with Google popup */
  async function signInWithGoogle(): Promise<boolean> {
    const auth = getFirebaseAuth()
    if (!auth) return false

    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
      return true
    } catch (err) {
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


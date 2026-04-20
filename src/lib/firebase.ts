import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getFirestore, enableMultiTabIndexedDbPersistence, type Firestore } from 'firebase/firestore'
import { getAuth, signInAnonymously, type Auth } from 'firebase/auth'

let app: FirebaseApp | null = null
let db: Firestore | null = null
let auth: Auth | null = null

function isConfigured(): boolean {
  return !!import.meta.env.VITE_FIREBASE_API_KEY
}

function init() {
  if (app) return
  if (!isConfigured()) return

  app = initializeApp({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
    appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
  })

  db = getFirestore(app)
  auth = getAuth(app)

  // Enable offline persistence
  enableMultiTabIndexedDbPersistence(db).catch((err) => {
    console.warn('Firestore persistence failed:', err.code)
  })
}

export function getDb(): Firestore | null {
  init()
  return db
}

export function getFirebaseAuth(): Auth | null {
  init()
  return auth
}

export async function ensureAuth(): Promise<string | null> {
  const a = getFirebaseAuth()
  if (!a) return null

  if (a.currentUser) return a.currentUser.uid

  try {
    const cred = await signInAnonymously(a)
    return cred.user.uid
  } catch (err) {
    console.warn('Anonymous auth failed:', err)
    return null
  }
}

export { isConfigured }


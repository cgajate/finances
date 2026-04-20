import { watch, type Ref } from 'vue'
import { doc, onSnapshot, updateDoc, type Firestore } from 'firebase/firestore'

/**
 * Two-way sync between a Pinia ref and a field on a Firestore document.
 * - Listens for Firestore changes via onSnapshot → updates the ref
 * - Watches the ref for local changes → writes to Firestore (debounced)
 * - Uses a _skipWrite flag to avoid echo loops
 */
export function useFirestoreSync<T>(
  db: Firestore,
  docPath: string,
  fieldName: string,
  localRef: Ref<T>,
) {
  let skipWrite = false
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  // Listen for remote changes
  const unsubscribe = onSnapshot(
    doc(db, ...docPath.split('/') as [string, string]),
    (snap) => {
      if (!snap.exists()) return
      const data = snap.data()
      const remote = data[fieldName] as T | undefined
      if (remote !== undefined) {
        skipWrite = true
        localRef.value = remote
        // Reset skip after Vue processes the update
        setTimeout(() => { skipWrite = false }, 50)
      }
    },
    (err) => {
      console.warn(`Firestore sync error (${docPath}/${fieldName}):`, err)
    },
  )

  // Write local changes to Firestore (debounced 500ms)
  watch(
    localRef,
    (val) => {
      if (skipWrite) return
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        const ref = doc(db, ...docPath.split('/') as [string, string])
        updateDoc(ref, { [fieldName]: JSON.parse(JSON.stringify(val)) }).catch((err) => {
          console.warn(`Firestore write error (${fieldName}):`, err)
        })
      }, 500)
    },
    { deep: true },
  )

  return unsubscribe
}


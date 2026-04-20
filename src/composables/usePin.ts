import { ref, computed } from 'vue'

const HASH_KEY = 'pin:hash'
const REMEMBERED_KEY = 'pin:remembered'
const REMEMBER_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin)
  const buffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

const authenticated = ref(false)

export function usePin() {
  const hasPin = computed(() => !!localStorage.getItem(HASH_KEY))

  function checkRemembered(): boolean {
    try {
      const raw = localStorage.getItem(REMEMBERED_KEY)
      if (!raw) return false
      const { expiry } = JSON.parse(raw) as { expiry: number }
      if (Date.now() < expiry) {
        authenticated.value = true
        return true
      }
      localStorage.removeItem(REMEMBERED_KEY)
    } catch {
      // ignore
    }
    return false
  }

  async function setPin(pin: string) {
    const hash = await hashPin(pin)
    localStorage.setItem(HASH_KEY, hash)
    authenticated.value = true
  }

  async function verifyPin(pin: string): Promise<boolean> {
    const stored = localStorage.getItem(HASH_KEY)
    if (!stored) return false
    const hash = await hashPin(pin)
    const valid = hash === stored
    if (valid) authenticated.value = true
    return valid
  }

  function remember() {
    localStorage.setItem(
      REMEMBERED_KEY,
      JSON.stringify({ expiry: Date.now() + REMEMBER_TTL_MS }),
    )
  }

  function lock() {
    authenticated.value = false
    localStorage.removeItem(REMEMBERED_KEY)
  }

  return { authenticated, hasPin, checkRemembered, setPin, verifyPin, remember, lock }
}


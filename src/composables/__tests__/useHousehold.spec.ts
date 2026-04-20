import { describe, it, expect, beforeEach, vi } from 'vitest'

const { mockGetDb, mockEnsureAuth, mockIsConfigured, mockDocFn, mockGetDoc, mockSetDoc } =
  vi.hoisted(() => ({
    mockGetDb: vi.fn(),
    mockEnsureAuth: vi.fn().mockResolvedValue('uid-123'),
    mockIsConfigured: vi.fn(),
    mockDocFn: vi.fn(() => 'mock-doc-ref'),
    mockGetDoc: vi.fn(),
    mockSetDoc: vi.fn().mockResolvedValue(undefined),
  }))

vi.mock('@/lib/firebase', () => ({
  getDb: mockGetDb,
  ensureAuth: mockEnsureAuth,
  isConfigured: mockIsConfigured,
}))

vi.mock('firebase/firestore', () => ({
  doc: mockDocFn,
  getDoc: mockGetDoc,
  setDoc: mockSetDoc,
}))

import { useHousehold } from '@/composables/useHousehold'

describe('useHousehold', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    mockEnsureAuth.mockResolvedValue('uid-123')
    mockSetDoc.mockResolvedValue(undefined)
    // Reset module-level state via the composable
    const { leaveHousehold } = useHousehold()
    leaveHousehold()
  })

  it('hasHousehold is false initially', () => {
    const { hasHousehold } = useHousehold()
    expect(hasHousehold.value).toBe(false)
  })

  it('firebaseReady reflects isConfigured', () => {
    mockIsConfigured.mockReturnValue(true)
    const { firebaseReady } = useHousehold()
    expect(firebaseReady.value).toBe(true)
  })

  describe('createHousehold', () => {
    it('returns null when db is not available', async () => {
      mockGetDb.mockReturnValue(null)
      const { createHousehold } = useHousehold()
      const code = await createHousehold()
      expect(code).toBeNull()
    })

    it('creates household and stores code', async () => {
      mockGetDb.mockReturnValue({} as any)

      const { createHousehold, hasHousehold, householdId } = useHousehold()
      const code = await createHousehold()

      expect(code).toBeTruthy()
      expect(typeof code).toBe('string')
      expect(hasHousehold.value).toBe(true)
      expect(householdId.value).toBe(code)
      expect(localStorage.getItem('household:id')).toBe(code)
    })
  })

  describe('joinHousehold', () => {
    it('returns false when db is not available', async () => {
      mockGetDb.mockReturnValue(null)
      const { joinHousehold } = useHousehold()
      expect(await joinHousehold('ABC123')).toBe(false)
    })

    it('returns false when household does not exist', async () => {
      mockGetDb.mockReturnValue({} as any)
      mockGetDoc.mockResolvedValue({ exists: () => false } as any)

      const { joinHousehold } = useHousehold()
      expect(await joinHousehold('NOPE')).toBe(false)
    })

    it('joins and stores code when household exists', async () => {
      mockGetDb.mockReturnValue({} as any)
      mockGetDoc.mockResolvedValue({ exists: () => true } as any)

      const { joinHousehold, hasHousehold, householdId } = useHousehold()
      expect(await joinHousehold('abc123')).toBe(true)
      expect(householdId.value).toBe('ABC123')
      expect(hasHousehold.value).toBe(true)
      expect(localStorage.getItem('household:id')).toBe('ABC123')
    })
  })

  describe('leaveHousehold', () => {
    it('clears householdId and localStorage', async () => {
      mockGetDb.mockReturnValue({} as any)

      const { createHousehold, leaveHousehold, hasHousehold, householdId } = useHousehold()
      await createHousehold()
      expect(hasHousehold.value).toBe(true)

      leaveHousehold()
      expect(householdId.value).toBeNull()
      expect(hasHousehold.value).toBe(false)
      expect(localStorage.getItem('household:id')).toBeNull()
    })
  })
})

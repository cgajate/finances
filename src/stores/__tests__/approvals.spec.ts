import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useApprovalsStore } from '@/stores/approvals'

describe('approvals store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  describe('initial state', () => {
    it('starts with no requests', () => {
      const store = useApprovalsStore()
      expect(store.requests).toEqual([])
    })

    it('starts disabled by default', () => {
      const store = useApprovalsStore()
      expect(store.approvalEnabled).toBe(false)
    })

    it('has a default threshold of 500', () => {
      const store = useApprovalsStore()
      expect(store.approvalThreshold).toBe(500)
    })
  })

  describe('requiresApproval', () => {
    it('returns false when disabled', () => {
      const store = useApprovalsStore()
      expect(store.requiresApproval(1000)).toBe(false)
    })

    it('returns true when enabled and amount meets threshold', () => {
      const store = useApprovalsStore()
      store.setEnabled(true)
      expect(store.requiresApproval(500)).toBe(true)
    })

    it('returns true when enabled and amount exceeds threshold', () => {
      const store = useApprovalsStore()
      store.setEnabled(true)
      expect(store.requiresApproval(999)).toBe(true)
    })

    it('returns false when enabled but amount is below threshold', () => {
      const store = useApprovalsStore()
      store.setEnabled(true)
      expect(store.requiresApproval(499)).toBe(false)
    })

    it('respects custom threshold', () => {
      const store = useApprovalsStore()
      store.setEnabled(true)
      store.setThreshold(100)
      expect(store.requiresApproval(100)).toBe(true)
      expect(store.requiresApproval(99)).toBe(false)
    })
  })

  describe('submitForApproval', () => {
    it('creates a pending request', () => {
      const store = useApprovalsStore()
      const id = store.submitForApproval({
        expenseId: 'exp-1',
        amount: 600,
        description: 'New laptop',
        requestedBy: 'Alice',
      })
      expect(store.requests).toHaveLength(1)
      const req = store.requests[0]!
      expect(req.id).toBe(id)
      expect(req.expenseId).toBe('exp-1')
      expect(req.amount).toBe(600)
      expect(req.description).toBe('New laptop')
      expect(req.requestedBy).toBe('Alice')
      expect(req.status).toBe('pending')
      expect(req.reviewedBy).toBeNull()
      expect(req.resolvedAt).toBeNull()
      expect(req.createdAt).toBeTruthy()
    })
  })

  describe('approveRequest', () => {
    it('approves a pending request', () => {
      const store = useApprovalsStore()
      const id = store.submitForApproval({
        expenseId: 'exp-1',
        amount: 600,
        description: 'Laptop',
        requestedBy: 'Alice',
      })
      const result = store.approveRequest(id, 'Bob')
      expect(result).toBe(true)
      const req = store.getRequestById(id)!
      expect(req.status).toBe('approved')
      expect(req.reviewedBy).toBe('Bob')
      expect(req.resolvedAt).toBeTruthy()
    })

    it('returns false for non-existent request', () => {
      const store = useApprovalsStore()
      expect(store.approveRequest('nope', 'Bob')).toBe(false)
    })

    it('returns false for already approved request', () => {
      const store = useApprovalsStore()
      const id = store.submitForApproval({
        expenseId: 'exp-1',
        amount: 600,
        description: 'Laptop',
        requestedBy: 'Alice',
      })
      store.approveRequest(id, 'Bob')
      expect(store.approveRequest(id, 'Charlie')).toBe(false)
    })
  })

  describe('rejectRequest', () => {
    it('rejects a pending request', () => {
      const store = useApprovalsStore()
      const id = store.submitForApproval({
        expenseId: 'exp-1',
        amount: 600,
        description: 'Laptop',
        requestedBy: 'Alice',
      })
      const result = store.rejectRequest(id, 'Bob')
      expect(result).toBe(true)
      const req = store.getRequestById(id)!
      expect(req.status).toBe('rejected')
      expect(req.reviewedBy).toBe('Bob')
      expect(req.resolvedAt).toBeTruthy()
    })

    it('returns false for non-existent request', () => {
      const store = useApprovalsStore()
      expect(store.rejectRequest('nope', 'Bob')).toBe(false)
    })

    it('returns false for already rejected request', () => {
      const store = useApprovalsStore()
      const id = store.submitForApproval({
        expenseId: 'exp-1',
        amount: 600,
        description: 'Laptop',
        requestedBy: 'Alice',
      })
      store.rejectRequest(id, 'Bob')
      expect(store.rejectRequest(id, 'Charlie')).toBe(false)
    })
  })

  describe('computed and lookups', () => {
    it('pendingRequests filters only pending', () => {
      const store = useApprovalsStore()
      store.submitForApproval({ expenseId: 'e1', amount: 500, description: 'A', requestedBy: 'Alice' })
      const id2 = store.submitForApproval({ expenseId: 'e2', amount: 600, description: 'B', requestedBy: 'Alice' })
      store.approveRequest(id2, 'Bob')
      expect(store.pendingRequests).toHaveLength(1)
      expect(store.pendingCount).toBe(1)
    })

    it('reviewableRequests excludes own requests', () => {
      const store = useApprovalsStore()
      store.submitForApproval({ expenseId: 'e1', amount: 500, description: 'A', requestedBy: 'Alice' })
      store.submitForApproval({ expenseId: 'e2', amount: 600, description: 'B', requestedBy: 'Bob' })
      expect(store.reviewableRequests('Alice')).toHaveLength(1)
      expect(store.reviewableRequests('Alice')[0]!.requestedBy).toBe('Bob')
    })

    it('getRequestByExpenseId returns correct request', () => {
      const store = useApprovalsStore()
      store.submitForApproval({ expenseId: 'exp-99', amount: 700, description: 'C', requestedBy: 'Alice' })
      const req = store.getRequestByExpenseId('exp-99')
      expect(req).toBeDefined()
      expect(req!.expenseId).toBe('exp-99')
    })

    it('getRequestByExpenseId returns undefined for missing', () => {
      const store = useApprovalsStore()
      expect(store.getRequestByExpenseId('nope')).toBeUndefined()
    })

    it('getRequestById returns undefined for missing', () => {
      const store = useApprovalsStore()
      expect(store.getRequestById('nope')).toBeUndefined()
    })
  })

  describe('settings', () => {
    it('setThreshold updates the threshold', () => {
      const store = useApprovalsStore()
      store.setThreshold(1000)
      expect(store.approvalThreshold).toBe(1000)
    })

    it('setEnabled toggles approval on/off', () => {
      const store = useApprovalsStore()
      store.setEnabled(true)
      expect(store.approvalEnabled).toBe(true)
      store.setEnabled(false)
      expect(store.approvalEnabled).toBe(false)
    })
  })

  describe('localStorage persistence', () => {
    it('loads requests from localStorage', () => {
      localStorage.setItem('approvals:requests', JSON.stringify([
        { id: 'r1', expenseId: 'e1', amount: 500, description: 'Test', requestedBy: 'Alice', reviewedBy: null, status: 'pending', createdAt: '2026-01-01T00:00:00Z', resolvedAt: null },
      ]))
      setActivePinia(createPinia())
      const store = useApprovalsStore()
      expect(store.requests).toHaveLength(1)
      expect(store.requests[0]!.id).toBe('r1')
    })

    it('loads threshold from localStorage', () => {
      localStorage.setItem('approvals:threshold', '1000')
      setActivePinia(createPinia())
      const store = useApprovalsStore()
      expect(store.approvalThreshold).toBe(1000)
    })

    it('loads enabled from localStorage', () => {
      localStorage.setItem('approvals:enabled', 'true')
      setActivePinia(createPinia())
      const store = useApprovalsStore()
      expect(store.approvalEnabled).toBe(true)
    })

    it('handles invalid JSON gracefully', () => {
      localStorage.setItem('approvals:requests', 'not-json')
      setActivePinia(createPinia())
      const store = useApprovalsStore()
      expect(store.requests).toEqual([])
    })
  })
})


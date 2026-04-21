import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import type { ApprovalRequest } from '@/types/finance'
import { getDb } from '@/lib/firebase'
import { useFirestoreSync } from '@/composables/useFirestoreSync'

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw) as T
  } catch {
    // ignore
  }
  return fallback
}

/** Default threshold in dollars — expenses at or above this need approval */
const DEFAULT_THRESHOLD = 500

export const useApprovalsStore = defineStore('approvals', () => {
  const approvalThreshold = ref<number>(
    loadFromStorage('approvals:threshold', DEFAULT_THRESHOLD),
  )
  const approvalEnabled = ref<boolean>(
    loadFromStorage('approvals:enabled', false),
  )
  const requests = ref<ApprovalRequest[]>(
    loadFromStorage('approvals:requests', []),
  )

  // Persist
  watch(approvalThreshold, (val) => localStorage.setItem('approvals:threshold', JSON.stringify(val)))
  watch(approvalEnabled, (val) => localStorage.setItem('approvals:enabled', JSON.stringify(val)))
  watch(requests, (val) => localStorage.setItem('approvals:requests', JSON.stringify(val)), { deep: true })

  /** Check whether an expense amount requires approval */
  function requiresApproval(amount: number): boolean {
    return approvalEnabled.value && amount >= approvalThreshold.value
  }

  /** Submit an expense for approval. Returns the approval request id. */
  function submitForApproval(data: {
    expenseId: string
    amount: number
    description: string
    requestedBy: string
  }): string {
    const id = crypto.randomUUID()
    requests.value.push({
      id,
      expenseId: data.expenseId,
      amount: data.amount,
      description: data.description,
      requestedBy: data.requestedBy,
      reviewedBy: null,
      status: 'pending',
      createdAt: new Date().toISOString(),
      resolvedAt: null,
    })
    return id
  }

  /** Approve an approval request */
  function approveRequest(requestId: string, reviewedBy: string): boolean {
    const req = requests.value.find((r) => r.id === requestId)
    if (!req || req.status !== 'pending') return false
    req.status = 'approved'
    req.reviewedBy = reviewedBy
    req.resolvedAt = new Date().toISOString()
    return true
  }

  /** Reject an approval request */
  function rejectRequest(requestId: string, reviewedBy: string): boolean {
    const req = requests.value.find((r) => r.id === requestId)
    if (!req || req.status !== 'pending') return false
    req.status = 'rejected'
    req.reviewedBy = reviewedBy
    req.resolvedAt = new Date().toISOString()
    return true
  }

  /** Get approval request by expense id */
  function getRequestByExpenseId(expenseId: string): ApprovalRequest | undefined {
    return requests.value.find((r) => r.expenseId === expenseId)
  }

  function getRequestById(id: string): ApprovalRequest | undefined {
    return requests.value.find((r) => r.id === id)
  }

  const pendingRequests = computed(() =>
    requests.value.filter((r) => r.status === 'pending'),
  )

  const pendingCount = computed(() => pendingRequests.value.length)

  /** Requests that the given user can review (not their own) */
  function reviewableRequests(userId: string) {
    return pendingRequests.value.filter((r) => r.requestedBy !== userId)
  }

  function setThreshold(value: number) {
    approvalThreshold.value = value
  }

  function setEnabled(value: boolean) {
    approvalEnabled.value = value
  }

  // --- Firestore sync ---
  function enableSync(householdId: string) {
    const db = getDb()
    if (!db) return
    const path = `households/${householdId}`
    useFirestoreSync(db, path, 'approvalRequests', requests)
    useFirestoreSync(db, path, 'approvalThreshold', approvalThreshold)
    useFirestoreSync(db, path, 'approvalEnabled', approvalEnabled)
  }

  return {
    approvalThreshold,
    approvalEnabled,
    requests,
    requiresApproval,
    submitForApproval,
    approveRequest,
    rejectRequest,
    getRequestByExpenseId,
    getRequestById,
    pendingRequests,
    pendingCount,
    reviewableRequests,
    setThreshold,
    setEnabled,
    enableSync,
  }
})


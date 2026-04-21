import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import type { ActivityEntry, ActivityAction, ActivityEntity } from '@/types/finance'
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

export const useActivityFeedStore = defineStore('activityFeed', () => {
  const activities = ref<ActivityEntry[]>(loadFromStorage('activityFeed:entries', []))

  watch(
    activities,
    (val) => localStorage.setItem('activityFeed:entries', JSON.stringify(val)),
    { deep: true },
  )

  function enableSync(householdId: string) {
    const db = getDb()
    if (!db) return
    useFirestoreSync(db, `households/${householdId}`, 'activityFeed', activities)
  }

  function logActivity(
    userId: string,
    action: ActivityAction,
    entity: ActivityEntity,
    entityId: string,
    description: string,
  ) {
    activities.value.unshift({
      id: crypto.randomUUID(),
      userId,
      action,
      entity,
      entityId,
      description,
      timestamp: new Date().toISOString(),
    })

    // Keep only the last 200 entries
    if (activities.value.length > 200) {
      activities.value = activities.value.slice(0, 200)
    }
  }

  /** Activities sorted newest first (already inserted that way, but ensures correctness) */
  const sortedActivities = computed(() =>
    [...activities.value].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    ),
  )

  function clearAll() {
    activities.value = []
  }

  return {
    activities,
    sortedActivities,
    logActivity,
    clearAll,
    enableSync,
  }
})


import { ref, computed, type ComputedRef, type Ref, isRef } from 'vue'

/**
 * Composable that layers a text search on top of a pre-sorted/filtered list.
 * Searches across all string-coercible fields provided by `fieldsFn`.
 *
 * @param items - Reactive list of already-sorted/filtered items (Ref, ComputedRef, or getter).
 * @param fieldsFn - Extracts searchable string values from each item.
 */
export function useSearchFilter<T>(
  items: ComputedRef<T[]> | Ref<T[]> | (() => T[]),
  fieldsFn: (item: T) => (string | number | null | undefined)[],
) {
  const searchQuery = ref('')

  const itemsRef = isRef(items) ? items : computed(items as () => T[])

  const filtered = computed(() => {
    const q = searchQuery.value.trim().toLowerCase()
    if (!q) return itemsRef.value
    return itemsRef.value.filter((item) =>
      fieldsFn(item)
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q)),
    )
  })

  return { searchQuery, filtered }
}

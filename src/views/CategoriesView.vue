<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useCategoriesStore } from '@/stores/categories'
import { useSnackbar } from '@/composables/useSnackbar'
import TabBar from '@/components/TabBar.vue'

const store = useCategoriesStore()
const { expenseCategories, incomeCategories } = storeToRefs(store)
const snackbar = useSnackbar()

const tab = ref<'expense' | 'income'>('expense')
const categoryTabs = [
  { value: 'expense', label: 'Expense', icon: ['fas', 'receipt'] },
  { value: 'income', label: 'Income', icon: ['fas', 'money-bill-wave'] },
]
const newName = ref('')
const editingId = ref<string | null>(null)
const editingName = ref('')
const showDeleted = ref(false)

function addCategory() {
  const name = newName.value.trim()
  if (!name) return
  store.addCategory(name, tab.value)
  snackbar.show(`Added ${tab.value} category "${name}"`, { duration: 5000 })
  newName.value = ''
}

function startEdit(id: string, currentName: string) {
  editingId.value = id
  editingName.value = currentName
}

function saveEdit(id: string) {
  const name = editingName.value.trim()
  if (!name) return
  store.editCategory(id, name)
  snackbar.show(`Renamed category to "${name}"`, { duration: 5000 })
  editingId.value = null
  editingName.value = ''
}

function cancelEdit() {
  editingId.value = null
  editingName.value = ''
}

function softDelete(id: string, name: string) {
  store.deleteCategory(id)
  snackbar.show(`Removed category "${name}"`, {
    undoFn: () => store.restoreCategory(id),
    duration: 8000,
  })
}

function restore(id: string, name: string) {
  store.restoreCategory(id)
  snackbar.show(`Restored category "${name}"`, { duration: 5000 })
}
</script>

<template>
  <div class="page">
    <h1>
      <font-awesome-icon :icon="['fas', 'tags']" />
      Manage Categories
    </h1>

    <TabBar :tabs="categoryTabs" v-model="tab" />

    <!-- Add form -->
    <form class="add-form" @submit.prevent="addCategory">
      <input
        v-model="newName"
        type="text"
        :placeholder="`New ${tab} category name...`"
        class="add-input"
      />
      <button type="submit" class="add-btn" :disabled="!newName.trim()">
        <font-awesome-icon :icon="['fas', 'plus']" />
        Add
      </button>
    </form>

    <!-- Active categories -->
    <h2>Active Categories</h2>
    <div class="category-list">
      <div
        v-for="cat in (tab === 'expense' ? expenseCategories : incomeCategories).filter(c => !c.deleted)"
        :key="cat.id"
        class="category-item"
      >
        <!-- Editing mode -->
        <template v-if="editingId === cat.id">
          <input
            v-model="editingName"
            type="text"
            class="edit-input"
            @keyup.enter="saveEdit(cat.id)"
            @keyup.escape="cancelEdit"
          />
          <div class="item-actions">
            <button class="action-btn save" @click="saveEdit(cat.id)" title="Save">
              <font-awesome-icon :icon="['fas', 'check']" />
            </button>
            <button class="action-btn cancel" @click="cancelEdit" title="Cancel">
              <font-awesome-icon :icon="['fas', 'xmark']" />
            </button>
          </div>
        </template>

        <!-- Display mode -->
        <template v-else>
          <span class="category-name">
            <font-awesome-icon :icon="['fas', 'tag']" class="tag-icon" />
            {{ cat.name }}
          </span>
          <div class="item-actions">
            <button class="action-btn edit" @click="startEdit(cat.id, cat.name)" title="Edit">
              <font-awesome-icon :icon="['fas', 'pen']" />
            </button>
            <button class="action-btn delete" @click="softDelete(cat.id, cat.name)" title="Remove">
              <font-awesome-icon :icon="['fas', 'trash']" />
            </button>
          </div>
        </template>
      </div>
      <p
        v-if="(tab === 'expense' ? expenseCategories : incomeCategories).filter(c => !c.deleted).length === 0"
        class="empty"
      >
        No active categories. Add one above.
      </p>
    </div>

    <!-- Deleted categories -->
    <div class="deleted-section">
      <button class="toggle-deleted" @click="showDeleted = !showDeleted">
        <font-awesome-icon :icon="['fas', showDeleted ? 'chevron-up' : 'chevron-down']" />
        {{ showDeleted ? 'Hide' : 'Show' }} Removed Categories
        <span class="deleted-count">
          ({{ (tab === 'expense' ? expenseCategories : incomeCategories).filter(c => c.deleted).length }})
        </span>
      </button>

      <div v-if="showDeleted" class="category-list deleted-list">
        <div
          v-for="cat in (tab === 'expense' ? expenseCategories : incomeCategories).filter(c => c.deleted)"
          :key="cat.id"
          class="category-item deleted"
        >
          <span class="category-name muted">
            <font-awesome-icon :icon="['fas', 'tag']" class="tag-icon" />
            {{ cat.name }}
          </span>
          <button class="action-btn restore" @click="restore(cat.id, cat.name)" title="Restore">
            <font-awesome-icon :icon="['fas', 'rotate-left']" />
            Restore
          </button>
        </div>
        <p
          v-if="(tab === 'expense' ? expenseCategories : incomeCategories).filter(c => c.deleted).length === 0"
          class="empty"
        >
          No removed categories.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>

h1 {
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

h2 {
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  font-size: 1rem;
  color: var(--color-text-secondary);
}


/* Add form */
.add-form {
  display: flex;
  gap: 0.5rem;
}

.add-input {
  flex: 1;
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--color-input-border);
  border-radius: 8px;
  font-size: 0.95rem;
  background: var(--color-input-bg);
  color: var(--color-input-text);
}

.add-btn {
  padding: 0.6rem 1rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  white-space: nowrap;
  transition: opacity 0.15s;
}

.add-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Category list */
.category-list {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.category-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  gap: 0.5rem;
}

.category-item.deleted {
  opacity: 0.6;
  border-style: dashed;
}

.category-name {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  font-size: 0.95rem;
}

.category-name.muted {
  color: var(--color-text-muted);
  text-decoration: line-through;
}

.tag-icon {
  color: var(--color-primary);
  font-size: 0.8rem;
}

.item-actions {
  display: flex;
  gap: 0.3rem;
  flex-shrink: 0;
}

.action-btn {
  background: none;
  border: none;
  padding: 0.3rem 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: background 0.15s;
}

.action-btn.edit {
  color: var(--color-primary);
}

.action-btn.edit:hover {
  background: var(--color-primary-light);
}

.action-btn.delete {
  color: var(--color-expense);
}

.action-btn.delete:hover {
  background: var(--color-expense-bg);
}

.action-btn.save {
  color: var(--color-income);
}

.action-btn.save:hover {
  background: var(--color-income-bg);
}

.action-btn.cancel {
  color: var(--color-text-muted);
}

.action-btn.cancel:hover {
  background: var(--color-badge-bg);
}

.action-btn.restore {
  color: var(--color-primary);
  font-weight: 500;
}

.action-btn.restore:hover {
  background: var(--color-primary-light);
}

/* Edit input */
.edit-input {
  flex: 1;
  padding: 0.4rem 0.6rem;
  border: 2px solid var(--color-primary);
  border-radius: 6px;
  font-size: 0.95rem;
  background: var(--color-input-bg);
  color: var(--color-input-text);
}

/* Deleted section */
.deleted-section {
  margin-top: 1.5rem;
}

.toggle-deleted {
  background: none;
  border: none;
  color: var(--color-text-muted);
  font-size: 0.85rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0;
  font-weight: 500;
}

.toggle-deleted:hover {
  color: var(--color-text-secondary);
}

.deleted-count {
  font-weight: 400;
}

.deleted-list {
  margin-top: 0.5rem;
}

.empty {
  color: var(--color-text-muted);
  font-style: italic;
  font-size: 0.9rem;
  padding: 0.5rem 0;
}
</style>


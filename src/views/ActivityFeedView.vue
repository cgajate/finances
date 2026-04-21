<script setup lang="ts">
import { computed } from 'vue'
import { useActivityFeedStore } from '@/stores/activityFeed'

const store = useActivityFeedStore()

const actionEmoji: Record<string, string> = {
  add: '➕',
  edit: '✏️',
  delete: '🗑️',
}

const entityLabel: Record<string, string> = {
  income: 'Income',
  expense: 'Expense',
  budget: 'Budget',
  'savings-goal': 'Savings Goal',
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60_000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const hasActivities = computed(() => store.sortedActivities.length > 0)
</script>

<template>
  <div class="activity-feed">
    <div class="feed-header">
      <h1>📋 Activity Feed</h1>
      <button v-if="hasActivities" class="btn-clear" @click="store.clearAll()">
        Clear All
      </button>
    </div>

    <p v-if="!hasActivities" class="empty">No activity yet. Actions by household members will appear here.</p>

    <ul v-else class="feed-list">
      <li v-for="entry in store.sortedActivities" :key="entry.id" class="feed-item">
        <span class="feed-emoji">{{ actionEmoji[entry.action] ?? '•' }}</span>
        <div class="feed-body">
          <div class="feed-description">{{ entry.description }}</div>
          <div class="feed-meta">
            <span class="feed-user">{{ entry.userId }}</span>
            <span class="feed-dot">·</span>
            <span class="feed-entity">{{ entityLabel[entry.entity] ?? entry.entity }}</span>
            <span class="feed-dot">·</span>
            <time class="feed-time" :datetime="entry.timestamp">{{ formatTimestamp(entry.timestamp) }}</time>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.activity-feed {
  max-width: 700px;
  margin: 0 auto;
}

.feed-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.feed-header h1 {
  margin: 0;
}

.btn-clear {
  padding: 0.4rem 0.8rem;
  background: none;
  border: 1px solid var(--color-btn-delete);
  color: var(--color-expense);
  border-radius: 8px;
  font-size: 0.85rem;
  cursor: pointer;
}

.btn-clear:hover {
  background: var(--color-expense-bg);
}

.empty {
  color: var(--color-text-muted);
  font-style: italic;
  text-align: center;
  padding: 3rem 1rem;
}

.feed-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.feed-item {
  display: flex;
  gap: 0.75rem;
  padding: 0.85rem 0;
  border-bottom: 1px solid var(--color-border-light);
}

.feed-item:last-child {
  border-bottom: none;
}

.feed-emoji {
  font-size: 1.2rem;
  flex-shrink: 0;
  margin-top: 2px;
}

.feed-body {
  flex: 1;
  min-width: 0;
}

.feed-description {
  font-weight: 500;
  font-size: 0.95rem;
  margin-bottom: 0.2rem;
}

.feed-meta {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.feed-user {
  font-weight: 600;
  color: var(--color-text-secondary);
}

.feed-dot {
  color: var(--color-border);
}

.feed-time {
  color: var(--color-text-muted);
}
</style>


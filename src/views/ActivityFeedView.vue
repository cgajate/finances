<script setup lang="ts">
import { computed } from 'vue'
import { useActivityFeedStore } from '@/stores/activityFeed'
import { formatRelativeTime } from '@/lib/formatRelativeTime'
import EmptyState from '@/components/EmptyState.vue'

const store = useActivityFeedStore()

const actionIcon: Record<string, string> = {
  add: 'plus',
  edit: 'pen-to-square',
  delete: 'trash',
}

const entityLabel: Record<string, string> = {
  income: 'Income',
  expense: 'Expense',
  budget: 'Budget',
  'savings-goal': 'Savings Goal',
}


const hasActivities = computed(() => store.sortedActivities.length > 0)
</script>

<template>
  <div class="activity-feed">
    <div class="feed-header">
      <h1><span aria-hidden="true">📋</span> Activity Feed</h1>
      <button v-if="hasActivities" class="btn-clear" @click="store.clearAll()">
        Clear All
      </button>
    </div>

    <EmptyState v-if="!hasActivities" message="No activity yet. Actions by household members will appear here." />

    <ul v-else class="feed-list" role="menu">
      <li v-for="entry in store.sortedActivities" :key="entry.id" class="feed-item">
        <span class="feed-icon"><font-awesome-icon :icon="['fas', actionIcon[entry.action] ?? 'circle']" /></span>
        <div class="feed-body">
          <div class="feed-description">{{ entry.description }}</div>
          <div class="feed-meta">
            <span class="feed-user">{{ entry.userId }}</span>
            <span class="feed-dot">·</span>
            <span class="feed-entity">{{ entityLabel[entry.entity] ?? entry.entity }}</span>
            <span class="feed-dot">·</span>
            <time class="feed-time" :datetime="entry.timestamp">{{ formatRelativeTime(entry.timestamp) }}</time>
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


.feed-icon {
  font-size: 1rem;
  flex-shrink: 0;
  margin-top: 2px;
  color: var(--color-text-secondary);
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

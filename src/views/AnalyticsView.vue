<script setup lang="ts">
import { ref } from 'vue'
import { useFinancesStore } from '@/stores/finances'
import { useForecasting } from '@/composables/useForecasting'
import TabBar from '@/components/TabBar.vue'
import AnalyticsTimeline from '@/components/AnalyticsTimeline.vue'
import AnalyticsProjection from '@/components/AnalyticsProjection.vue'
import SpendingTrends from '@/components/SpendingTrends.vue'
import YearReview from '@/components/YearReview.vue'

const store = useFinancesStore()

const monthsBefore = ref(6)
const monthsAfter = ref(12)

const { breakdown, yearProjection } = useForecasting(
  store.incomes,
  store.expenses,
  monthsBefore,
  monthsAfter,
)

const activeTab = ref<'timeline' | 'projection' | 'trends' | 'year-review'>('timeline')

const analyticsTabs = [
  { value: 'timeline', label: 'Month-by-Month' },
  { value: 'projection', label: '12-Month Projection' },
  { value: 'trends', label: 'Spending Trends' },
  { value: 'year-review', label: 'Year Review' },
]
</script>

<template>
  <div class="page--wide">
    <h1>Analytics & Forecasting</h1>

    <TabBar :tabs="analyticsTabs" v-model="activeTab" />

    <AnalyticsProjection
      v-if="activeTab === 'projection'"
      :year-projection="yearProjection"
    />

    <AnalyticsTimeline
      v-if="activeTab === 'timeline'"
      :breakdown="breakdown"
      :months-before="monthsBefore"
      :months-after="monthsAfter"
      @update:months-before="monthsBefore = $event"
      @update:months-after="monthsAfter = $event"
    />

    <SpendingTrends v-if="activeTab === 'trends'" />

    <YearReview v-if="activeTab === 'year-review'" />
  </div>
</template>

<style scoped>
h1 { margin-bottom: 1.5rem; }
</style>


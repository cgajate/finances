<script setup lang="ts">
import { useRouter } from 'vue-router'

const props = defineProps<{
  title: string
  backTo: string
}>()

const router = useRouter()
</script>

<template>
  <div class="page-header">
    <button class="btn-back" @click="router.push(backTo)" aria-label="Go back">
      <font-awesome-icon :icon="['fas', 'arrow-left']" />
    </button>
    <h2>{{ title }}</h2>
  </div>
</template>


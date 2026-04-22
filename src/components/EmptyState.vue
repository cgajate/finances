<script setup lang="ts">
defineProps<{
  message: string
}>()
</script>

<template>
  <p class="empty">{{ message }}</p>
</template>


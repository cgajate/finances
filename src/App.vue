<script setup lang="ts">
import { ref } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import MobileSidebar from '@/components/MobileSidebar.vue'
import PinGate from '@/components/PinGate.vue'
import HouseholdSetup from '@/components/HouseholdSetup.vue'
import SnackbarNotification from '@/components/SnackbarNotification.vue'

const menuOpen = ref(false)
const syncModalOpen = ref(false)
</script>

<template>
  <PinGate>
    <div class="app-shell">
      <AppHeader
        :collapsed="menuOpen"
        @toggle-menu="menuOpen = !menuOpen"
        @open-sync="syncModalOpen = true"
      />

      <MobileSidebar :open="menuOpen" @close="menuOpen = false" />

      <HouseholdSetup :open="syncModalOpen" @close="syncModalOpen = false" />
      <main class="app-main">
        <RouterView />
      </main>
    </div>
  </PinGate>
  <SnackbarNotification />
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: transparent;
}

.app-main {
  flex: 1;
  padding: 1.5rem 1rem;
}
</style>

<script setup lang="ts">
import { ref } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import MobileSidebar from '@/components/MobileSidebar.vue'
import AuthGate from '@/components/AuthGate.vue'
import HouseholdSetup from '@/components/HouseholdSetup.vue'
import SnackbarNotification from '@/components/SnackbarNotification.vue'

const menuOpen = ref(false)
const syncModalOpen = ref(false)
</script>

<template>
  <AuthGate>
    <div class="app-shell">
      <a href="#main-content" class="skip-link">Skip to content</a>
      <AppHeader
        :collapsed="menuOpen"
        @toggle-menu="menuOpen = !menuOpen"
        @open-sync="syncModalOpen = true"
      />

      <MobileSidebar :open="menuOpen" @close="menuOpen = false" />

      <HouseholdSetup :open="syncModalOpen" @close="syncModalOpen = false" />
      <main id="main-content" class="app-main">
        <RouterView />
      </main>
    </div>
  </AuthGate>
  <SnackbarNotification />
</template>

<style scoped>
.skip-link {
  position: absolute;
  left: -9999px;
  top: 0;
  z-index: 10001;
  background: var(--color-primary);
  color: #fff;
  padding: 0.5rem 1rem;
  border-radius: 0 0 4px 0;
  font-weight: 600;
}

.skip-link:focus {
  left: 0;
}

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

<script setup lang="ts">
import { useAuth } from '@/composables/useAuth'

defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const { displayName, photoURL, isAnonymous, signOut } = useAuth()

/** Retry loading avatar once on error by appending a cache-busting param */
let avatarRetried = false
function handleAvatarError(e: Event) {
  if (avatarRetried || !photoURL.value) return
  avatarRetried = true
  const img = e.target as HTMLImageElement
  const separator = photoURL.value.includes('?') ? '&' : '?'
  img.src = `${photoURL.value}${separator}t=${Date.now()}`
}

function closeMenu() {
  emit('close')
}

function handleSignOut() {
  signOut()
  closeMenu()
}
</script>

<template>
  <!-- Backdrop -->
  <Transition name="fade">
    <div v-if="open" class="sidebar-backdrop" @click="closeMenu"></div>
  </Transition>

  <!-- Sidebar -->
  <Transition name="slide-left">
    <nav v-if="open" class="mobile-sidebar">
      <!-- Header: Logo/Title -->
      <div class="sidebar-header">
          <img src="/mg-logo.webp" alt="Logo" class="sidebar-logo" />
          <span class="sidebar-title">Montajate Financier</span>
      </div>

      <!-- Main nav links -->
      <div class="sidebar-nav">
        <RouterLink to="/" class="sidebar-link" @click="closeMenu">
          <font-awesome-icon :icon="['fas', 'house']" /> Dashboard
        </RouterLink>
        <RouterLink to="/finances" class="sidebar-link" @click="closeMenu">
          <font-awesome-icon :icon="['fas', 'money-bill-wave']" /> Finances
        </RouterLink>
        <RouterLink to="/goals" class="sidebar-link" @click="closeMenu">
          <font-awesome-icon :icon="['fas', 'bullseye']" /> Goals
        </RouterLink>
        <RouterLink to="/calendar" class="sidebar-link" @click="closeMenu">
          <font-awesome-icon :icon="['fas', 'calendar-days']" /> Calendar
        </RouterLink>
        <RouterLink to="/analytics" class="sidebar-link" @click="closeMenu">
          <font-awesome-icon :icon="['fas', 'chart-line']" /> Analytics
        </RouterLink>

      </div>

      <!-- Spacer pushes footer to bottom -->
      <div class="sidebar-spacer"></div>

      <!-- User footer -->
      <div v-if="!isAnonymous" class="sidebar-footer">
        <div class="sidebar-user">
          <img
            v-if="photoURL"
            :src="photoURL"
            alt=""
            class="sidebar-avatar"
            referrerpolicy="no-referrer"
            crossorigin="anonymous"
            @error="handleAvatarError"
          />
          <font-awesome-icon v-else :icon="['fas', 'user']" class="sidebar-avatar-fallback" />
          <span class="sidebar-user-name">{{ displayName }}</span>
          <button
            class="sidebar-logout"
            aria-label="Sign Out"
            @click="handleSignOut"
          >
            <font-awesome-icon :icon="['fas', 'right-from-bracket']" />
          </button>
        </div>
      </div>
    </nav>
  </Transition>
</template>

<style scoped>
.sidebar-backdrop {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 150;
}

.mobile-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 260px;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  z-index: 200;
  display: flex;
  flex-direction: column;
  padding: 1rem 0 0;
  overflow-y: auto;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 1rem 1rem;
  border-bottom: 1px solid var(--color-border-light);
  margin-bottom: 0.5rem;
}

.sidebar-logo {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  object-fit: contain;
}

.sidebar-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text);
}


.sidebar-nav {
  display: flex;
  flex-direction: column;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.7rem 1.25rem;
  text-decoration: none;
  color: var(--color-text-secondary);
  font-size: 0.95rem;
  font-weight: 500;
  border: none;
  background: none;
  width: 100%;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s, color 0.15s, padding-left 0.15s;
}

.sidebar-link:hover {
  background: var(--color-primary-light);
  color: var(--color-primary-text);
  padding-left: 1.5rem;
}

.sidebar-link.router-link-exact-active {
  color: var(--color-primary);
  background: var(--color-primary-light);
}


.sidebar-spacer {
  flex: 1;
}

/* ─── User footer ─── */
.sidebar-footer {
  border-top: 1px solid var(--color-border-light, var(--color-border));
  padding: 0.75rem 1rem;
}

.sidebar-user {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.sidebar-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.sidebar-avatar-fallback {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-icon-bg);
  color: var(--color-text-muted);
  border-radius: 50%;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.sidebar-user-name {
  flex: 1;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-logout {
  background: none;
  border: none;
  color: var(--color-text-muted);
  font-size: 1rem;
  cursor: pointer;
  padding: 0.35rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  min-width: 24px;
  min-height: 24px;
  transition: background 0.15s, color 0.15s;
}

.sidebar-logout:hover {
  background: var(--color-expense-bg);
  color: var(--color-expense);
}

/* ─── Transitions ─── */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-left-enter-active, .slide-left-leave-active { transition: transform 0.25s ease; }
.slide-left-enter-from, .slide-left-leave-to { transform: translateX(-100%); }
</style>


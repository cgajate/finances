<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAuth } from '@/composables/useAuth'

const { authenticated, loading, initAuth, signInWithGoogle, signInAnon } = useAuth()

const signingIn = ref(false)
const error = ref('')

onMounted(() => {
  initAuth()
})

async function handleGoogle() {
  signingIn.value = true
  error.value = ''
  const ok = await signInWithGoogle()
  if (!ok) error.value = 'Google sign-in failed. Please try again.'
  signingIn.value = false
}

async function handleAnonymous() {
  signingIn.value = true
  error.value = ''
  const ok = await signInAnon()
  if (!ok) error.value = 'Anonymous sign-in failed. Please try again.'
  signingIn.value = false
}
</script>

<template>
  <!-- Loading spinner while Firebase checks auth state -->
  <div v-if="loading" class="auth-overlay">
    <div class="auth-card">
      <div class="auth-spinner" aria-label="Loading">
        <font-awesome-icon :icon="['fas', 'spinner']" spin />
      </div>
    </div>
  </div>

  <!-- Auth gate: not signed in -->
  <div v-else-if="!authenticated" class="auth-overlay">
    <div class="auth-card">
      <div class="auth-logo" aria-hidden="true">
        <img src="/mg-logo.webp" alt="" class="auth-logo-img" />
      </div>
      <h1>Montajate Financier</h1>
      <p class="auth-subtitle">Sign in to manage your finances</p>

      <button
        class="auth-btn auth-btn--google"
        :disabled="signingIn"
        @click="handleGoogle"
      >
        <font-awesome-icon :icon="['fab', 'google']" aria-hidden="true" />
        Sign in with Google
      </button>

      <div class="auth-divider">
        <span>or</span>
      </div>

      <button
        class="auth-btn auth-btn--anon"
        :disabled="signingIn"
        @click="handleAnonymous"
      >
        <font-awesome-icon :icon="['fas', 'user']" aria-hidden="true" />
        Continue without an account
      </button>

      <p v-if="error" class="auth-error" role="alert" aria-live="assertive">{{ error }}</p>

      <p class="auth-hint">
        Anonymous sessions are local to this device and cannot sync across devices.
      </p>
    </div>
  </div>

  <!-- Authenticated: render the app -->
  <slot v-else />
</template>

<style scoped>
.auth-overlay {
  position: fixed;
  inset: 0;
  background: linear-gradient(135deg, var(--color-header-bg), var(--color-primary));
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

.auth-card {
  background: var(--color-surface);
  border-radius: 16px;
  padding: 2.5rem 2rem;
  width: 100%;
  max-width: 380px;
  box-shadow: 0 12px 40px var(--color-card-shadow);
  text-align: center;
}

.auth-logo-img {
  width: 72px;
  height: 72px;
  border-radius: 12px;
  object-fit: contain;
  margin-bottom: 0.5rem;
}

.auth-spinner {
  font-size: 2rem;
  color: var(--color-primary);
  padding: 2rem;
}

h1 {
  font-size: 1.4rem;
  color: var(--color-text);
  margin: 0 0 0.25rem;
}

.auth-subtitle {
  color: var(--color-text-muted);
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
}

.auth-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: filter 0.15s, transform 0.1s;
}

.auth-btn:hover:not(:disabled) {
  filter: brightness(0.92);
  transform: translateY(-1px);
}

.auth-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-btn--google {
  background: #4285f4;
  color: #fff;
}

.auth-btn--anon {
  background: var(--color-icon-bg);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.auth-divider {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 1rem 0;
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.auth-divider::before,
.auth-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--color-border);
}

.auth-error {
  color: var(--color-expense);
  font-size: 0.85rem;
  margin-top: 0.75rem;
  font-weight: 500;
}

.auth-hint {
  color: var(--color-text-muted);
  font-size: 0.78rem;
  margin-top: 1rem;
  line-height: 1.4;
}
</style>


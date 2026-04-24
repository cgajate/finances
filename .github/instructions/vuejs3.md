---
description: 'Vue 3 development standards and best practices with Composition API and TypeScript'
applyTo: '**/*.vue, **/*.ts, **/*.scss'
---

# Vue 3 Development Instructions

Instructions for building high-quality Vue 3 applications with the Composition API, TypeScript, and modern best practices.

## Project Context
- Vue 3.5+ with Composition API as default
- TypeScript 6 with strict mode (`noUncheckedIndexedAccess` enabled)
- Single File Components (`.vue`) with `<script setup lang="ts">` syntax
- Vite 8 for build tooling
- Pinia 3 for application state management (composition/setup syntax)
- Vue Router 5 with HTML5 history mode
- Firebase (Firestore + anonymous Auth) for backend, lazy-initialized and env-gated via `VITE_FIREBASE_API_KEY`
- Font Awesome (solid icons) registered globally as `<font-awesome-icon>`
- Capacitor 8 for Android deployment
- Path alias: `@` → `./src` (configured in both `vite.config.ts` and `tsconfig.app.json`)

## Development Standards

### Architecture
- Use the Composition API with `<script setup lang="ts">` — never use the Options API
- Organize shared UI components in `src/components/` and route-level pages in `src/views/`
- Extract reusable logic into composable functions in `src/composables/` with `use` prefix (e.g., `useForecasting`, `useBillCalendar`)
- Structure Pinia stores by domain in `src/stores/`
- Define domain types in `src/types/`
- Firebase interactions go through composables (e.g., `useFirestoreSync`)

### TypeScript Integration
- `noUncheckedIndexedAccess` is enabled — always handle `undefined` for array/object index access
- Use `<script setup lang="ts">` with `defineProps<T>()` and `defineEmits<T>()` for typed props and events
- Prefer explicit typing over `any`
- Use `const` and `let` consistently; never use `var`
- Prefer arrow functions for anonymous functions
- Use `async/await` for asynchronous operations
- Use `@/` path alias for all imports from `src/`
- Add comments only for complex logic or non-obvious design choices

### Component Design
- Adhere to the single responsibility principle for components
- Use PascalCase for component names (e.g., `SpendingTrends`, `CurrencyInput`)
- Keep components small and focused on one concern
- Use `<script setup lang="ts">` syntax exclusively
- Validate props with TypeScript using `defineProps<T>()`
- Use `defineEmits<T>()` with typed event signatures and kebab-case event names (e.g., `item-selected`)
- Favor slots and scoped slots for flexible composition
- Use props (down) and events (up) for parent–child communication

### State Management
- Use Pinia 3 with the composition/setup syntax: `defineStore('name', () => { ... })`
- Use `ref`/`computed` inside stores — never use the options syntax
- For simple local state, use `ref` for primitives and `reactive` for objects within `setup`
- Use `computed` for derived state

### Composition API Patterns
- Create reusable composables for shared logic in `src/composables/`
- Use `watch` and `watchEffect` with precise dependency lists
- Cleanup side effects in `onUnmounted` or `watch` cleanup callbacks
- Use `provide`/`inject` sparingly for deep dependency injection

### Styling
- Use `<style scoped>` in Vue SFCs to avoid style leakage
- Follow BEM methodology for class naming
- Use SCSS for stylesheets (via `sass` dependency)
- Prefer `rem` and `em` for font sizes and spacing; use `vh` and `vw` for responsive layouts
- Leverage CSS Grid, Flexbox, and custom properties
- Use media queries for responsive design
- Ensure styles are accessible (contrast, focus states)

### Performance Optimization
- Lazy-load route components with dynamic `import()` (except the dashboard)
- Use `defineAsyncComponent` for heavy non-route components
- Apply `v-once` and `v-memo` for static or infrequently changing elements
- Avoid unnecessary watchers; prefer `computed` where possible
- Manual chunks configured in Vite for `vue-vendor`, `fontawesome`, and `firebase` bundles

### Error Handling
- Use global error handler (`app.config.errorHandler`) for uncaught errors
- Wrap risky logic in `try/catch`; provide user-friendly messages
- Use `errorCaptured` hook in components for local boundaries
- Display fallback UI or snackbar toasts (via `useSnackbar`) gracefully

### Forms and Validation
- Build forms with controlled `v-model` bindings
- Use `aria-required="true"` for required fields
- Use `aria-invalid="true"` and `aria-describedby` for error states
- Ensure accessible labeling, error announcements, and focus management

### Routing
- Use Vue Router 5 with `createRouter` and `createWebHistory`
- Lazy-load route components with dynamic `import()` (except the dashboard)
- Route definitions in `src/router/index.ts`
- Protect routes with navigation guards where needed
- Use `useRoute` and `useRouter` in `setup` for programmatic navigation

### Testing
- Write unit tests using Vitest and Vue Test Utils in `src/**/__tests__/` directories
- Write E2E tests using Playwright in `e2e/`
- Focus on behavior, not implementation details
- Use `mount` and `shallowMount` for component isolation
- Mock global plugins (router, Pinia) as needed

### Linting and Formatting
- Two-pass lint: oxlint runs first (fast), then ESLint — both with `--fix`
- Prettier handles formatting (ESLint formatting rules disabled via `eslint-config-prettier`)
- ESLint uses `eslint-plugin-vue` (`flat/essential`), `@vue/eslint-config-typescript`, `@vitest/eslint-plugin`, and `eslint-plugin-playwright`

### Security
- Avoid using `v-html`; sanitize any HTML inputs rigorously
- Validate and escape data in templates and directives
- Firebase is lazy-initialized and env-gated — never expose raw credentials
- Mobile-specific code should be guarded with platform checks from `@capacitor/core`

### Icons
- Use `<font-awesome-icon :icon="['fas', 'icon-name']" />` for icons
- Icons must be imported from `@fortawesome/free-solid-svg-icons` and added to the library in `src/main.ts`

## Additional Guidelines
- Generate TSDoc comments for public APIs and complex functions
- Follow Vue's official style guide (vuejs.org/style-guide)
- Write meaningful commit messages and maintain clean git history
- Keep dependencies up to date and audit for vulnerabilities
- Node requires `^20.19.0 || >=22.12.0` (uses `.nvmrc`)

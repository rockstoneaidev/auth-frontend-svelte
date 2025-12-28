# auth-frontend-svelte

Beautiful, accessible Firebase authentication components for Svelte apps - built with [shadcn-svelte](https://shadcn-svelte.com).

## Features

- 🔥 **Firebase Auth Integration** - Complete Firebase Authentication support
- 🎨 **Beautiful UI** - Built with shadcn-svelte components and Tailwind CSS
- ♿ **Accessible** - ARIA-compliant, keyboard navigable components
- 🎯 **Type-Safe** - Full TypeScript support
- 📦 **Composable** - Use individual components or the complete auth flow
- 🌙 **Dark Mode** - Built-in dark mode support
- 📱 **Responsive** - Mobile-first responsive design

## Components

- `LoginForm` - Email/password login with forgot password link
- `RegisterForm` - User registration with email verification
- `ForgotPasswordForm` - Password reset request form
- `ResetPasswordForm` - New password entry (for reset links)
- `MfaSetupForm` - Multi-factor authentication enrollment
- `MfaChallengeForm` - MFA verification during login

## Installation

```bash
npm install @rockstoneaidev/auth-frontend-svelte firebase
```

### Peer Dependencies

This package requires:
- `svelte` ^5.0.0
- `firebase` ^11.0.0

### Tailwind CSS Setup

This package uses Tailwind CSS. Add it to your project:

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Update your `tailwind.config.js`:

```js
import { fontFamily } from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
\tdarkMode: ['class'],
\tcontent: [
\t\t'./src/**/*.{html,js,svelte,ts}',
\t\t'./node_modules/@rockstoneaidev/auth-frontend-svelte/dist/**/*.{js,svelte}'
\t],
\ttheme: {
\t\textend: {
\t\t\tcolors: {
\t\t\t\tborder: 'hsl(var(--border) / <alpha-value>)',
\t\t\t\tinput: 'hsl(var(--input) / <alpha-value>)',
\t\t\t\tring: 'hsl(var(--ring) / <alpha-value>)',
\t\t\t\tbackground: 'hsl(var(--background) / <alpha-value>)',
\t\t\t\tforeground: 'hsl(var(--foreground) / <alpha-value>)',
\t\t\t\tprimary: {
\t\t\t\t\tDEFAULT: 'hsl(var(--primary) / <alpha-value>)',
\t\t\t\t\tforeground: 'hsl(var(--primary-foreground) / <alpha-value>)'
\t\t\t\t},
\t\t\t\t// ... other colors (see package source for full config)
\t\t\t},
\t\t\tborderRadius: {
\t\t\t\tlg: 'var(--radius)',
\t\t\t\tmd: 'calc(var(--radius) - 2px)',
\t\t\t\tsm: 'calc(var(--radius) - 4px)'
\t\t\t}
\t\t}
\t},
\tplugins: [require('tailwindcss-animate')]
};
```

Install required Tailwind plugin:

```bash
npm install -D tailwindcss-animate
```

Import the styles in your root layout (optional if using Tailwind v4):

```svelte
<!-- src/routes/+layout.svelte -->
<script>
\timport '@rockstoneaidev/auth-frontend-svelte/styles';
</script>

<slot />
```

> **Note for Tailwind v4 users**: You generally do not need to import the CSS file if you have already defined the shadcn design tokens (CSS variables) in your own CSS. Tailwind's content scanner will pick up the classes from the components automatically.

## Quick Start

### 1. Initialize Firebase

Create a Firebase project and initialize the auth service:

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
\timport { onMount } from 'svelte';
\timport { initFirebaseAuth } from '@rockstoneaidev/auth-frontend-svelte';
\timport '@rockstoneaidev/auth-frontend-svelte/styles';

\tonMount(() => {
\t\tinitFirebaseAuth({
\t\t\tconfig: {
\t\t\t\tapiKey: import.meta.env.VITE_FIREBASE_API_KEY,
\t\t\t\tauthDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
\t\t\t\tprojectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
\t\t\t\tappId: import.meta.env.VITE_FIREBASE_APP_ID
\t\t\t},
\t\t\tpersistence: 'local', // or 'session' or 'none'
\t\t\tonAuthStateChanged: (user) => {
\t\t\t\tconsole.log('Auth state changed:', user?.email);
\t\t\t}
\t\t});
\t});
</script>

<slot />
```

### 2. Create Login Page

```svelte
<!-- src/routes/login/+page.svelte -->
<script lang="ts">
\timport { LoginForm } from '@rockstoneaidev/auth-frontend-svelte';
\timport { goto } from '$app/navigation';

\tfunction handleSuccess(event: CustomEvent<{ email: string }>) {
\t\tconsole.log('Login successful:', event.detail.email);
\t\t// User is redirected automatically by default
\t}

\tfunction handleError(event: CustomEvent) {
\t\tconsole.error('Login error:', event.detail.error);
\t}
</script>

<div class="flex min-h-screen items-center justify-center p-4">
\t<LoginForm
\t\tredirectOnSuccess={true}
\t\tredirectUrl="/dashboard"
\t\tshowRegisterLink={true}
\t\tshowForgotPasswordLink={true}
\t\ton:success={handleSuccess}
\t\ton:error={handleError}
\t\ton:register={() => goto('/register')}
\t\ton:forgotPassword={() => goto('/forgot-password')}
\t/>
</div>
```

### 3. Create Register Page

```svelte
<!-- src/routes/register/+page.svelte -->
<script lang="ts">
\timport { RegisterForm } from '@rockstoneaidev/auth-frontend-svelte';
\timport { goto } from '$app/navigation';
</script>

<div class="flex min-h-screen items-center justify-center p-4">
\t<RegisterForm
\t\tredirectOnSuccess={true}
\t\tredirectUrl="/dashboard"
\t\tshowLoginLink={true}
\t\trequireDisplayName={true}
\t\ton:success={(e) => console.log('Registered:', e.detail.email)}
\t\ton:error={(e) => console.error('Error:', e.detail.error)}
\t\ton:login={() => goto('/login')}
\t/>
</div>
```

### 4. Password Reset Flow

**Forgot Password Page:**

```svelte
<!-- src/routes/forgot-password/+page.svelte -->
<script lang="ts">
\timport { ForgotPasswordForm } from '@rockstoneaidev/auth-frontend-svelte';
\timport { goto } from '$app/navigation';
</script>

<div class="flex min-h-screen items-center justify-center p-4">
\t<ForgotPasswordForm
\t\tshowLoginLink={true}
\t\ton:success={(e) => console.log('Reset email sent to:', e.detail.email)}
\t\ton:login={() => goto('/login')}
\t/>
</div>
```

**Reset Password Page** (handles Firebase email link):

```svelte
<!-- src/routes/reset-password/+page.svelte -->
<script lang="ts">
\timport { ResetPasswordForm } from '@rockstoneaidev/auth-frontend-svelte';
\timport { page } from '$app/stores';

\tconst oobCode = $page.url.searchParams.get('oobCode') || '';
</script>

<div class="flex min-h-screen items-center justify-center p-4">
\t<ResetPasswordForm
\t\t{oobCode}
\t\tredirectOnSuccess={true}
\t\tredirectUrl="/login"
\t/>
</div>
```

### 5. Multi-Factor Authentication (Optional)

**MFA Setup Page:**

```svelte
<!-- src/routes/settings/security/+page.svelte -->
<script lang="ts">
\timport { MfaSetupForm } from '@rockstoneaidev/auth-frontend-svelte';
\timport { goto } from '$app/navigation';
</script>

<div class="flex min-h-screen items-center justify-center p-4">
\t<MfaSetupForm
\t\tshowBackButton={true}
\t\ton:success={() => {
\t\t\talert('2FA enabled successfully!');
\t\t\tgoto('/dashboard');
\t\t}}
\t\ton:back={() => goto('/settings')}
\t/>
</div>
```

**MFA Challenge** (triggered during login when MFA is required):

```svelte
<!-- Handle in your login page when MFA is required -->
<script lang="ts">
\timport { LoginForm, MfaChallengeForm } from '@rockstoneaidev/auth-frontend-svelte';
\timport { goto } from '$app/navigation';
\timport type { MultiFactorResolver } from 'firebase/auth';

\tlet mfaResolver: MultiFactorResolver | null = $state(null);

\tfunction handleLoginError(event: CustomEvent) {
\t\tconst error = event.detail.error;
\t\tif (error.code === 'auth/multi-factor-auth-required') {
\t\t\tmfaResolver = error.resolver;
\t\t} else {
\t\t\tconsole.error('Login error:', error);
\t\t}
\t}
</script>

<div class="flex min-h-screen items-center justify-center p-4">
\t{#if mfaResolver}
\t\t<MfaChallengeForm
\t\t\tresolver={mfaResolver}
\t\t\ton:success={() => goto('/dashboard')}
\t\t\ton:cancel={() => (mfaResolver = null)}
\t\t/>
\t{:else}
\t\t<LoginForm on:error={handleLoginError} />
\t{/if}
</div>
```

## Component Props

### LoginForm

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `redirectOnSuccess` | `boolean` | `true` | Auto-redirect after successful login |
| `redirectUrl` | `string` | `'/dashboard'` | URL to redirect to after login |
| `showRegisterLink` | `boolean` | `true` | Show "Sign up" link |
| `showForgotPasswordLink` | `boolean` | `true` | Show "Forgot password?" link |

**Events:**
- `on:success` - `{ email: string }`
- `on:error` - `{ error: AuthError }`
- `on:register` - Triggered when user clicks register link
- `on:forgotPassword` - Triggered when user clicks forgot password

### RegisterForm

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `redirectOnSuccess` | `boolean` | `true` | Auto-redirect after registration |
| `redirectUrl` | `string` | `'/dashboard'` | URL to redirect to |
| `showLoginLink` | `boolean` | `true` | Show "Already have an account?" link |
| `requireDisplayName` | `boolean` | `true` | Require user to enter their name |

**Events:**
- `on:success` - `{ email: string }`
- `on:error` - `{ error: AuthError }`
- `on:login` - Triggered when user clicks login link

### ForgotPasswordForm

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showLoginLink` | `boolean` | `true` | Show "Back to login" link |

**Events:**
- `on:success` - `{ email: string }`
- `on:error` - `{ error: AuthError }`
- `on:login` - Triggered when user clicks login link

### ResetPasswordForm

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `oobCode` | `string` | **required** | Code from Firebase email link |
| `redirectOnSuccess` | `boolean` | `true` | Auto-redirect after reset |
| `redirectUrl` | `string` | `'/login'` | URL to redirect to |

**Events:**
- `on:success` - Triggered on successful reset
- `on:error` - `{ error: AuthError }`

### MfaSetupForm

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showBackButton` | `boolean` | `true` | Show "Skip for now" button |

**Events:**
- `on:success` - Triggered when MFA is enabled
- `on:error` - `{ error: AuthError }`
- `on:back` - Triggered when user clicks skip/back

### MfaChallengeForm

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `resolver` | `MultiFactorResolver` | **required** | Firebase MFA resolver from error |
| `selectedIndex` | `number` | `0` | Index of MFA method if multiple |

**Events:**
- `on:success` - Triggered when MFA verified successfully
- `on:error` - `{ error: AuthError }`
- `on:cancel` - Triggered when user cancels

## Firebase Configuration

### Environment Variables

Create a `.env` file:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_APP_ID=your-app-id
```

### Per-App Per-Environment Strategy

This package supports **one Firebase project per app per environment**:

```
docs-staging      → Firebase project for Docs (staging)
docs-prod         → Firebase project for Docs (production)
dashboard-staging → Firebase project for Dashboard (staging)
dashboard-prod    → Firebase project for Dashboard (production)
```

Each app configures its own Firebase project via environment variables.

## Advanced Usage

### Using the Auth Service Directly

```typescript
import { getAuthService } from '@rockstoneaidev/auth-frontend-svelte';

const authService = getAuthService();

// Sign in
await authService.signIn({ email, password });

// Register
await authService.register({ email, password, displayName });

// Sign out
await authService.signOut();

// Get current user
const user = authService.getCurrentUser();

// Send password reset
await authService.sendPasswordReset(email);
```

### Custom Styling

All components use CSS custom properties (CSS variables) for theming. You can override them:

```css
:root {
\t--primary: 220 90% 56%;  /* HSL values */
\t--radius: 0.75rem;
}
```

### Dark Mode

The package includes dark mode support out of the box. Toggle dark mode by adding the `dark` class to your `<html>` element:

```svelte
<script>
\tlet darkMode = $state(false);
</script>

<svelte:head>
\t<html class:dark={darkMode} />
</svelte:head>

<button onclick={() => darkMode = !darkMode}>
\tToggle Dark Mode
</button>
```

## TypeScript

Full TypeScript support is included. Import types:

```typescript
import type {
\tFirebaseConfig,
\tAuthOptions,
\tAuthService,
\tAuthError,
\tLoginCredentials,
\tRegisterData
} from '@rockstoneaidev/auth-frontend-svelte';
```

## Browser Support

- Modern browsers with ES2020+ support
- Firebase SDK requirements apply

## License

MIT

## Credits

Built with:
- [Firebase](https://firebase.google.com/)
- [Svelte](https://svelte.dev/)
- [shadcn-svelte](https://shadcn-svelte.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [bits-ui](https://github.com/huntabyte/bits-ui)

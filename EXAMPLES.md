# Examples

This directory contains example implementations showing how to use auth-frontend-svelte in different scenarios.

## Complete Auth Flow Example

A full authentication flow implementation showing all components working together.

### Directory Structure

```
src/routes/
├── +layout.svelte                 # Firebase initialization
├── login/+page.svelte            # Login page
├── register/+page.svelte         # Registration page
├── forgot-password/+page.svelte  # Forgot password page
├── reset-password/+page.svelte   # Reset password handler
├── dashboard/+page.svelte        # Protected dashboard
└── settings/
    └── security/+page.svelte     # MFA setup
```

### 1. Root Layout - Initialize Firebase

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { initFirebaseAuth } from '@rockstoneaidev/auth-frontend-svelte';
  import '@rockstoneaidev/auth-frontend-svelte/styles';
  import { goto } from '$app/navigation';
  import { writable } from 'svelte/store';

  // Global auth state store
  export const currentUser = writable(null);

  onMount(() => {
    initFirebaseAuth({
      config: {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID
      },
      persistence: 'local',
      onAuthStateChanged: (user) => {
        currentUser.set(user);
        
        // Redirect logic
        const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];
        const isPublicRoute = publicRoutes.some(route => 
          window.location.pathname.startsWith(route)
        );

        if (user && isPublicRoute) {
          goto('/dashboard');
        } else if (!user && !isPublicRoute) {
          goto('/login');
        }
      }
    });
  });
</script>

<slot />
```

### 2. Login Page with MFA Support

```svelte
<!-- src/routes/login/+page.svelte -->
<script lang="ts">
  import { LoginForm, MfaChallengeForm } from '@rockstoneaidev/auth-frontend-svelte';
  import { goto } from '$app/navigation';
  import type { MultiFactorResolver } from 'firebase/auth';

  let mfaResolver: MultiFactorResolver | null = $state(null);
  let errorMessage = $state('');

  function handleLoginError(event: CustomEvent) {
    const error = event.detail.error;
    
    if (error.code === 'auth/multi-factor-auth-required') {
      // MFA is required - show MFA challenge
      mfaResolver = error.resolver;
    } else {
      errorMessage = error.message;
    }
  }

  function handleMfaSuccess() {
    goto('/dashboard');
  }
</script>

<div class="flex min-h-screen items-center justify-center p-4 bg-muted">
  {#if mfaResolver}
    <MfaChallengeForm
      resolver={mfaResolver}
      on:success={handleMfaSuccess}
      on:cancel={() => {
        mfaResolver = null;
        errorMessage = '';
      }}
      on:error={(e) => errorMessage = e.detail.error.message}
    />
  {:else}
    <LoginForm
      on:error={handleLoginError}
      on:register={() => goto('/register')}
      on:forgotPassword={() => goto('/forgot-password')}
    />
  {/if}

  {#if errorMessage && !mfaResolver}
    <div class="fixed bottom-4 right-4 rounded-lg bg-destructive p-4 text-destructive-foreground">
      {errorMessage}
    </div>
  {/if}
</div>
```

### 3. Protected Route Example

```svelte
<!-- src/routes/dashboard/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { getAuthService } from '@rockstoneaidev/auth-frontend-svelte';
  import { currentUser } from '../+layout.svelte';

  let user = $state(null);

  onMount(() => {
    const authService = getAuthService();
    user = authService.getCurrentUser();

    if (!user) {
      goto('/login');
    }
  });

  async function handleSignOut() {
    const authService = getAuthService();
    await authService.signOut();
    goto('/login');
  }
</script>

{#if user}
  <div class="container mx-auto p-6">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold">Dashboard</h1>
        <p class="text-muted-foreground">Welcome back, {user.displayName || user.email}</p>
      </div>
      <button
        onclick={handleSignOut}
        class="px-4 py-2 rounded-md bg-secondary hover:bg-secondary/80"
      >
        Sign Out
      </button>
    </div>

    <div class="grid gap-4">
      <a
        href="/settings/security"
        class="block p-4 rounded-lg border hover:bg-accent"
      >
        <h2 class="font-semibold">Security Settings</h2>
        <p class="text-sm text-muted-foreground">Manage your two-factor authentication</p>
      </a>
    </div>
  </div>
{/if}
```

### 4. Environment Variables Setup

Create `.env` file:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-app
VITE_FIREBASE_APP_ID=1:123456789:web:abc...
```

## Customization Examples

### Custom Styling

```svelte
<!-- Override theme colors -->
<style>
  :global(:root) {
    --primary: 262 83% 58%;  /* Purple */
    --primary-foreground: 0 0% 100%;
    --radius: 1rem;  /* More rounded corners */
  }
</style>
```

### Custom Error Handling

```typescript
import { getAuthService } from '@rockstoneaidev/auth-frontend-svelte';
import type { AuthError } from '@rockstoneaidev/auth-frontend-svelte';

function handleAuthError(error: AuthError) {
  // Log to error tracking service
  console.error('Auth error:', error.code, error.message);
  
  // Show user-friendly message
  switch (error.code) {
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    default:
      return error.message;
  }
}
```

### Social Providers (Coming Soon)

The package focuses on email/password and MFA flows. For social providers (Google, GitHub, etc.), you can add them directly using Firebase SDK:

```typescript
import { getAuthService } from '@rockstoneaidev/auth-frontend-svelte';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

async function signInWithGoogle() {
  const authService = getAuthService();
  const provider = new GoogleAuthProvider();
  
  try {
    await signInWithPopup(authService.auth, provider);
    // User is signed in
  } catch (error) {
    console.error('Google sign-in error:', error);
  }
}
```

## Testing

### Unit Testing Components

```typescript
import { render, fireEvent } from '@testing-library/svelte';
import { LoginForm } from '@rockstoneaidev/auth-frontend-svelte';

test('login form validates email', async () => {
  const { getByLabelText, getByRole } = render(LoginForm);
  
  const emailInput = getByLabelText('Email');
  const submitButton = getByRole('button', { name: /login/i });
  
  await fireEvent.input(emailInput, { target: { value: 'invalid-email' } });
  await fireEvent.click(submitButton);
  
  // Should show validation error
});
```

## Deployment

### Build for Production

```bash
npm run build
```

### Publish to npm

```bash
npm publish
```

### Use in Your App

```bash
npm install @rockstoneaidev/auth-frontend-svelte firebase
```

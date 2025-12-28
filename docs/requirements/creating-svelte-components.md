# Creating Svelte Components

This guide outlines the conventions for creating new components in the auth-frontend-svelte package.

## Component Structure

All components should follow this general structure:

```svelte
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { YourType } from '$lib/types';
  
  // Component props using Svelte 5 runes
  let {
    prop1,
    prop2 = 'default value',
    className,
    ...restProps
  }: {
    prop1: string;
    prop2?: string;
    className?: string;
  } = $props();

  // Event dispatcher
  const dispatch = createEventDispatcher<{
    success: { data: YourType };
    error: { error: Error };
  }>();

  // Local state
  let loading = $state(false);
  let error = $state<string | null>(null);

  // Computed values
  let isValid = $derived(prop1.length > 0);

  // Event handlers
  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    loading = true;
    error = null;

    try {
      // Your logic here
      dispatch('success', { data: {} });
    } catch (err) {
      error = err.message;
      dispatch('error', { error: err });
    } finally {
      loading = false;
    }
  }
</script>

<!-- Template -->
<div class={cn('base-classes', className)} {...restProps}>
  <!-- Content -->
</div>
```

## File Naming

- **Auth Components**: `component-name-form.svelte`
  - Examples: `login-form.svelte`, `register-form.svelte`
  
- **UI Components**: `component-name.svelte`
  - Examples: `button.svelte`, `input.svelte`

- All lowercase with hyphens (kebab-case)

## Component Location

```
src/lib/components/
├── auth/          # Authentication flow components
└── ui/            # Reusable UI primitives
```

## Props Pattern

### Using Svelte 5 Runes

```svelte
<script lang="ts">
  let {
    // Required props (no default)
    userId,
    
    // Optional props (with default)
    showHeader = true,
    redirectOnSuccess = false,
    redirectUrl = '/dashboard',
    
    // Style/className passthrough
    class: className,
    
    // Spread remaining props
    ...restProps
  }: {
    userId: string;
    showHeader?: boolean;
    redirectOnSuccess?: boolean;
    redirectUrl?: string;
    class?: string;
  } = $props();
</script>
```

### Benefits
- Type-safe props
- Clear defaults
- Allows prop spreading for native HTML attributes

## State Management

### Reactive State ($state)

```svelte
<script lang="ts">
  // Primitive reactive values
  let count = $state(0);
  let name = $state('');
  let items = $state<string[]>([]);

  // Objects (reactive properties)
  let user = $state({ name: '', email: '' });
</script>
```

### Derived State ($derived)

```svelte
<script lang="ts">
  let firstName = $state('John');
  let lastName = $state('Doe');
  
  // Computed full name
  let fullName = $derived(`${firstName} ${lastName}`);
  
  // Computed validation
  let isValid = $derived(firstName.length > 0 && lastName.length > 0);
</script>
```

## Event Dispatching

### Define Event Types

```svelte
<script lang="ts">
  const dispatch = createEventDispatcher<{
    success: { email: string };
    error: { error: AuthError };
    cancel: void;
  }>();

  function handleSuccess() {
    dispatch('success', { email: 'user@example.com' });
  }
</script>
```

### Usage in Parent

```svelte
<MyComponent
  on:success={(e) => console.log(e.detail.email)}
  on:error={(e) => console.error(e.detail.error)}
/>
```

## Styling Guidelines

### Use cn() Utility

```svelte
<script lang="ts">
  import { cn } from '$lib/utils';
  
  let { class: className } = $props();
</script>

<div class={cn('default classes', className)} />
```

### CSS Custom Properties

Always use design tokens:

```svelte
<div class="bg-primary text-primary-foreground">
  <!-- Not: bg-blue-500 text-white -->
</div>
```

### Conditional Classes

```svelte
<button
  class={cn(
    'base-button-classes',
    loading && 'opacity-50 cursor-not-allowed',
    variant === 'destructive' && 'bg-destructive',
    className
  )}
>
```

## Error Handling

### User-Friendly Messages

```svelte
<script lang="ts">
  import type { AuthError } from '$lib/types';
  
  let error = $state<string | null>(null);

  async function handleAction() {
    try {
      // Action
    } catch (err) {
      const authError = err as AuthError;
      error = authError.message; // Already translated
    }
  }
</script>

{#if error}
  <div class="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
    {error}
  </div>
{/if}
```

## Loading States

Always provide visual feedback:

```svelte
<script lang="ts">
  let loading = $state(false);
</script>

<Button type="submit" disabled={loading}>
  {loading ? 'Signing in...' : 'Sign in'}
</Button>
```

## Form Validation

### Client-Side Validation

```svelte
<script lang="ts">
  let email = $state('');
  let password = $state('');
  let confirmPassword = $state('');
  let error = $state<string | null>(null);

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    error = null;

    // Validate
    if (password !== confirmPassword) {
      error = 'Passwords do not match';
      return;
    }

    if (password.length < 6) {
      error = 'Password must be at least 6 characters';
      return;
    }

    // Proceed...
  }
</script>
```

### HTML5 Validation

```svelte
<Input
  type="email"
  required
  placeholder="m@example.com"
  bind:value={email}
/>
```

## Accessibility

### ARIA Labels

```svelte
<button
  aria-label="Close dialog"
  aria-disabled={loading}
>
  <Icon />
</button>
```

### Form Labels

Always associate labels with inputs:

```svelte
<Label for="email">Email</Label>
<Input
  id="email"
  type="email"
  bind:value={email}
/>
```

### Focus Management

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  
  let emailInput: HTMLInputElement;

  onMount(() => {
    emailInput?.focus();
  });
</script>

<Input bind:ref={emailInput} />
```

## TypeScript Usage

### Strict Typing

```svelte
<script lang="ts">
  import type { User } from 'firebase/auth';
  import type { AuthError } from '$lib/types';
  
  let user = $state<User | null>(null);
  let error = $state<AuthError | null>(null);
</script>
```

### Avoid `any`

```typescript
// ❌ Bad
function handleData(data: any) {
  // ...
}

// ✅ Good
function handleData(data: LoginCredentials) {
  // ...
}
```

## Component Documentation

### JSDoc Comments

```svelte
<script lang="ts">
  /**
   * Login form component with email/password authentication
   * 
   * @fires {success} - Emitted when login succeeds with user email
   * @fires {error} - Emitted when login fails with error details
   * @fires {forgotPassword} - Emitted when user clicks forgot password
   */
  
  let {
    /** Whether to redirect automatically after successful login */
    redirectOnSuccess = true,
    /** URL to redirect to after login */
    redirectUrl = '/dashboard'
  }: {
    redirectOnSuccess?: boolean;
    redirectUrl?: string;
  } = $props();
</script>
```

## Testing Considerations

### Make Components Testable

- Use semantic HTML
- Add data-testid attributes when needed
- Keep business logic separate from presentation
- Emit events rather than navigate directly

```svelte
<button
  data-testid="submit-button"
  type="submit"
>
  Submit
</button>
```

## Examples

See existing components for reference:
- `src/lib/components/auth/login-form.svelte`
- `src/lib/components/auth/register-form.svelte`
- `src/lib/components/ui/button.svelte`

---

_Last updated: 2025-12-28_

# Integration with Laravel App Template

This guide shows how to integrate `auth-frontend-svelte` with the `laravel-app-template` that uses Laravel + Inertia + Svelte.

## Installation

1. **Install the package:**

```bash
npm install @rockstoneaidev/auth-frontend-svelte firebase
npm install -D tailwindcss-animate
```

2. **Update Tailwind config:**

Edit `tailwind.config.js`:

```js
import { fontFamily } from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './resources/**/*.blade.php',
    './resources/**/*.{js,svelte,ts}',
    './node_modules/@rockstoneaidev/auth-frontend-svelte/dist/**/*.{js,svelte}'
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border) / <alpha-value>)',
        input: 'hsl(var(--input) / <alpha-value>)',
        ring: 'hsl(var(--ring) / <alpha-value>)',
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        primary: {
          DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground) / <alpha-value>)'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',
          foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',
          foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
          foreground: 'hsl(var(--muted-foreground) / <alpha-value>)'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
          foreground: 'hsl(var(--accent-foreground) / <alpha-value>)'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover) / <alpha-value>)',
          foreground: 'hsl(var(--popover-foreground) / <alpha-value>)'
        },
        card: {
          DEFAULT: 'hsl(var(--card) / <alpha-value>)',
          foreground: 'hsl(var(--card-foreground) / <alpha-value>)'
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      fontFamily: {
        sans: [...fontFamily.sans]
      }
    }
  },
  plugins: [require('tailwindcss-animate')]
};
```

3. **Import styles in app layout:**

Edit `resources/js/app.js` or your main Inertia layout:

```js
import '@rockstoneaidev/auth-frontend-svelte/styles';
import './app.css'; // Your existing styles
```

## Firebase Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project per environment:
   - `your-app-staging`
   - `your-app-prod`
3. Enable **Email/Password** authentication
4. Optionally enable **Multi-factor authentication**

### 2. Add Firebase Config to .env

**Staging (.env.staging):**
```env
VITE_FIREBASE_API_KEY=your-staging-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-app-staging.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-app-staging
VITE_FIREBASE_APP_ID=your-staging-app-id
```

**Production (.env):**
```env
VITE_FIREBASE_API_KEY=your-prod-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-app-prod.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-app-prod
VITE_FIREBASE_APP_ID=your-prod-app-id
```

## Laravel + Inertia Integration

### 1. Update auth-bridge-laravel

The `auth-bridge-laravel` package needs to verify Firebase tokens. It should be configured to:

```php
// config/auth_bridge.php
return [
    'provider' => env('AUTH_PROVIDER', 'firebase'), // or 'auth_api' for legacy
    
    'firebase' => [
        'project_id' => env('FIREBASE_PROJECT_ID'),
        // Firebase will auto-fetch public keys for token verification
    ],
];
```

### 2. Create Inertia Pages

**Login Page** (`resources/js/Pages/Auth/Login.svelte`):

```svelte
<script lang="ts">
  import { LoginForm } from '@rockstoneaidev/auth-frontend-svelte';
  import { router } from '@inertiajs/svelte';

  function handleSuccess(event: CustomEvent<{ email: string }>) {
    // Firebase auth successful, now authenticate with Laravel
    const user = getAuthService().getCurrentUser();
    
    user?.getIdToken().then(token => {
      // Send token to Laravel for verification and session creation
      router.post('/auth/firebase/verify', {
        token
      }, {
        onSuccess: () => {
          router.visit('/dashboard');
        }
      });
    });
  }

  function handleError(event: CustomEvent) {
    console.error('Login failed:', event.detail.error);
  }
</script>

<div class="flex min-h-screen items-center justify-center p-4">
  <LoginForm
    redirectOnSuccess={false}
    on:success={handleSuccess}
    on:error={handleError}
    on:register={() => router.visit('/register')}
    on:forgotPassword={() => router.visit('/forgot-password')}
  />
</div>
```

**Register Page** (`resources/js/Pages/Auth/Register.svelte`):

```svelte
<script lang="ts">
  import { RegisterForm } from '@rockstoneaidev/auth-frontend-svelte';
  import { router } from '@inertiajs/svelte';
  import { getAuthService } from '@rockstoneaidev/auth-frontend-svelte';

  async function handleSuccess(event: CustomEvent<{ email: string }>) {
    const user = getAuthService().getCurrentUser();
    const token = await user?.getIdToken();
    
    // Register in Laravel backend
    router.post('/auth/firebase/register', {
      token
    }, {
      onSuccess: () => {
        router.visit('/dashboard');
      }
    });
  }
</script>

<div class="flex min-h-screen items-center justify-center p-4">
  <RegisterForm
    redirectOnSuccess={false}
    on:success={handleSuccess}
    on:login={() => router.visit('/login')}
  />
</div>
```

### 3. Initialize Firebase in Layout

**App Layout** (`resources/js/Layouts/AppLayout.svelte`):

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { initFirebaseAuth } from '@rockstoneaidev/auth-frontend-svelte';
  import { router } from '@inertiajs/svelte';

  onMount(() => {
    initFirebaseAuth({
      config: {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID
      },
      persistence: 'local',
      onAuthStateChanged: async (user) => {
        if (user) {
          // Sync with Laravel session if needed
          const token = await user.getIdToken();
          // Could ping Laravel to verify session is still valid
        }
      }
    });
  });
</script>

<slot />
```

### 4. Laravel Backend Routes

```php
// routes/web.php
Route::post('/auth/firebase/verify', [AuthController::class, 'verifyFirebaseToken']);
Route::post('/auth/firebase/register', [AuthController::class, 'registerFirebaseUser']);
Route::post('/logout', [AuthController::class, 'logout']);
```

### 5. Laravel Controller

```php
// app/Http/Controllers/AuthController.php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;

class AuthController extends Controller
{
    public function verifyFirebaseToken(Request $request)
    {
        $token = $request->input('token');
        
        // auth-bridge-laravel verifies the token
        $firebaseUser = app('firebase.auth')->verifyIdToken($token);
        
        // Find or create local user
        $user = User::where('external_user_id', $firebaseUser->uid)->first();
        
        if ($user) {
            Auth::login($user);
            return redirect()->route('dashboard');
        }
        
        return response()->json(['error' => 'User not found'], 404);
    }
    
    public function registerFirebaseUser(Request $request)
    {
        $token = $request->input('token');
        $firebaseUser = app('firebase.auth')->verifyIdToken($token);
        
        // Create local user
        $user = User::create([
            'external_user_id' => $firebaseUser->uid,
            'email' => $firebaseUser->email,
            'name' => $firebaseUser->displayName ?? $firebaseUser->email,
            'email_verified_at' => $firebaseUser->emailVerified ? now() : null,
        ]);
        
        Auth::login($user);
        return redirect()->route('dashboard');
    }
    
    public function logout(Request $request)
    {
        Auth::logout();
        return redirect()->route('login');
    }
}
```

## Middleware

Create middleware to protect routes:

```php
// app/Http/Middleware/FirebaseAuth.php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class FirebaseAuth
{
    public function handle(Request $request, Closure $next)
    {
        if (!Auth::check()) {
            return redirect()->route('login');
        }
        
        return $next($request);
    }
}
```

Apply to protected routes:

```php
Route::middleware(['firebase.auth'])->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('Dashboard');
    });
});
```

## Testing

### Test Firebase Integration Locally

1. Start Laravel dev server: `php artisan serve`
2. Start Vite dev server: `npm run dev`
3. Visit `http://localhost:8000/login`
4. Register a new account
5. Verify email works (check Firebase console)
6. Test login flow
7. Test password reset
8. Test MFA setup (optional)

## Deployment

### Staging
```bash
# Set staging Firebase config
cp .env.staging .env

# Build assets
npm run build

# Deploy to staging server
./deploy-staging.sh
```

### Production
```bash
# Set production Firebase config  
cp .env.production .env

# Build assets
npm run build

# Deploy to production
./deploy-production.sh
```

## Security Considerations

1. **Token Verification**: Always verify Firebase tokens in Laravel backend
2. **CSRF Protection**: Ensure CSRF tokens are included in Inertia requests
3. **Session Security**: Configure secure session cookies
4. **Rate Limiting**: Add rate limits to login/register endpoints
5. **Email Verification**: Require email verification before full access

## Troubleshooting

### "Auth not initialized" Error

Make sure Firebase is initialized before rendering auth components:

```svelte
<script>
  let authReady = $state(false);
  
  onMount(() => {
    initFirebaseAuth({...});
    authReady = true;
  });
</script>

{#if authReady}
  <LoginForm />
{/if}
```

### Token Verification Fails

Check that:
1. Firebase project ID matches in `.env`
2. `auth-bridge-laravel` is configured correctly
3. Token hasn't expired (default 1 hour)

### Styles Not Loading

Ensure you've:
1. Imported `@rockstoneaidev/auth-frontend-svelte/styles`
2. Added package path to Tailwind `content` array
3. Installed `tailwindcss-animate`

## Next Steps

- Add social login (Google, GitHub) using Firebase
- Implement role-based access control in Laravel
- Add email templates for Firebase auth emails
- Set up monitoring and error tracking
- Add unit and E2E tests

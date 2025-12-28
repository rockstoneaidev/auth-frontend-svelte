// Firebase Auth Service
export { initFirebaseAuth, getAuthService } from './firebase.js';

// Types
export type {
    FirebaseConfig,
    AuthOptions,
    LoginCredentials,
    RegisterData,
    PasswordResetData,
    MfaEnrollmentData,
    MfaVerificationData,
    AuthError,
    AuthState,
    AuthService,
    AuthEvents
} from './types.js';

// Auth Components
export { default as LoginForm } from './components/auth/login-form.svelte';
export { default as RegisterForm } from './components/auth/register-form.svelte';
export { default as ForgotPasswordForm } from './components/auth/forgot-password-form.svelte';
export { default as ResetPasswordForm } from './components/auth/reset-password-form.svelte';
export { default as MfaSetupForm } from './components/auth/mfa-setup-form.svelte';
export { default as MfaChallengeForm } from './components/auth/mfa-challenge-form.svelte';

// UI Components  (optional - for customization)
export { default as Button } from './components/ui/button.svelte';
export { default as Input } from './components/ui/input.svelte';
export { default as Label } from './components/ui/label.svelte';
export { default as Card } from './components/ui/card.svelte';

// Utilities
export { cn } from './utils.js';

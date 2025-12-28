# Product Requirements Document (PRD): auth-frontend-svelte

## 1. Project Overview

**Project Name:** auth-frontend-svelte  
**Type:** npm Package / Svelte Component Library  
**Primary Stakeholders:**  
- Frontend developers (using laravel-app-template or any Svelte app)
- App maintainers (managing authentication UIs across multiple apps)
- AI developer agents (see [AI Collaboration Playbook](../ai/AGENTS.md))

**Summary:**  
auth-frontend-svelte is a reusable npm package providing beautiful, accessible Firebase authentication UI components for Svelte 5 applications. It supports the complete authentication flow:

1. **Login** - Email/password authentication
2. **Registration** - New user signup with email verification
3. **Password Reset** - Forgot password and reset via email link
4. **Multi-Factor Authentication (MFA)** - Phone-based 2FA enrollment and verification

Built with shadcn-svelte components, the package provides a consistent, modern UI that integrates seamlessly with apps created from **laravel-app-template** (at ../laravel-app-template/). Backend authentication is handled by **auth-bridge-laravel** (at ../auth-bridge-laravel/) which verifies Firebase tokens.

---

## 2. Goals & Success Metrics

**Business Goals:**
- Eliminate duplicate authentication UI code across apps.
- Provide production-ready auth components out of the box.
- Reduce auth implementation time from days to minutes.
- Enable rapid prototyping and testing of new apps.

**User Goals:**
- Developers: Install a single package and get complete auth UI.
- End Users: Experience modern, accessible, beautiful authentication flows.
- Designers: Easy customization via Tailwind CSS and design tokens.

**Success Metrics / KPIs:**
- Time to implement auth UI in new app < 30 minutes.
- Zero custom auth component code needed in consuming apps.
-Adoption across all new apps created from laravel-app-template.
- Consistent UX across all apps using the package.

---

## 3. Scope & Non-Scope

**In Scope:**
- npm package `@rockstoneaidev/auth-frontend-svelte` that:
    - **LoginForm**: Email/password login with "forgot password" link
    - **RegisterForm**: User registration with display name and email verification
    - **ForgotPasswordForm**: Request password reset email
    - **ResetPasswordForm**: Confirm password reset from email link
    - **MfaSetupForm**: Enroll in phone-based 2FA with reCAPTCHA
    - **MfaChallengeForm**: 2FA verification during login
    - **Firebase Service**: Abstraction layer for Firebase Authentication SDK
    - **Type Definitions**: Full TypeScript support for all exports
    - **Styling**: shadcn-svelte components with Tailwind CSS and dark mode
- Integration documentation for Laravel + Inertia + Svelte apps
- Per-app Firebase project strategy (one project per app per environment)

**Out of Scope:**
- Backend token verification (handled by auth-bridge-laravel)
- Social authentication providers (use Firebase SDK directly)
- Email link signin (future enhancement)
- TOTP/Authenticator app MFA (future enhancement)
- Session management (handled by backend)
- Password strength validation UI (future enhancement)

---

## 4. Core Architecture

| Framework      | Language    | Authentication | Styling     | Build Tool   | Package Manager | Deployment |
|----------------|-------------|----------------|-------------|--------------|-----------------|------------|
| Svelte 5       | TypeScript  | Firebase 11.x  | Tailwind 3.x| SvelteKit    | npm             | npm        |

**Key Components:**
- **Firebase Authentication SDK**: Identity provider, token generation, MFA.
- **shadcn-svelte**: UI component system for consistent design.
- **bits-ui**: Headless component primitives for accessibility.
- **Tailwind CSS**: Utility-first styling with design tokens.
- **SvelteKit**: Library build tooling via `svelte-package`.

---

## 5. Functional Requirements

### Authentication Components

- **LoginForm:**
    - Email and password inputs with validation
    - "Forgot password?" link (optional)
    - "Don't have an account?" link (optional)
    - Loading state during authentication
    - Error display with Firebase error translation
    - Success event dispatch with user email
    - Auto-redirect option

- **RegisterForm:**
    - Email, password, confirm password, and optional display name
    - Client-side validation (password match, min length)
    - Automatic email verification after registration
    - Error handling for existing accounts
    - Success event dispatch
    - Auto-redirect option

- **ForgotPasswordForm:**
    - Email input
    - Send password reset email
    - Success state showing confirmation
    - "Back to login" link

- **ResetPasswordForm:**
    - New password and confirm password inputs
    - Parse `oobCode` from URL query params
    - Validate code with Firebase
    - Success state with auto-redirect
    - Handle expired/invalid codes

- **MfaSetupForm:**
    - Phone number input with country code
    - reCAPTCHA integration
    - SMS code verification
    - Two-step enrollment flow
    - Skip/back option

- **MfaChallengeForm:**
    - Verification code input
    - Support for multiple factors (if enrolled)
    - Integration with Firebase MultiFactorResolver
    - Cancel option

### Firebase Service

- **initFirebaseAuth(options):**
    - Initialize Firebase app with config
    - Set persistence mode (local/session/none)
    - Register auth state listener
    - Return auth service interface

- **getAuthService():**
    - Get initialized auth service
    - Throw error if not initialized

- **Service Methods:**
    - `signIn(credentials)` - Email/password login
    - `register(data)` - Create new user
    - `signOut()` - Sign out current user
    - `sendPasswordReset(email)` - Send reset email
    - `confirmPasswordReset(code, password)` - Reset with code
    - `getCurrentUser()` - Get current Firebase user
    - `sendEmailVerification()` - Send verification email
    - `reloadUser()` - Refresh user data

### Styling & Theming

- CSS custom properties for all colors, spacing, and radii
- Dark mode support via class-based theme switching
- Responsive design (mobile-first)
- Accessible (ARIA labels, keyboard navigation)
- Customizable via Tailwind classes

---

## 6. Integration & Usage

**For a new Laravel + Inertia + Svelte app:**
1. Create from [laravel-app-template](https://github.com/rockstoneaidev/laravel-app-template).
2. Install: `npm install @rockstoneaidev/auth-frontend-svelte firebase`
3. Configure Firebase environment variables in `.env`.
4. Initialize Firebase in app layout.
5. Create Inertia pages importing auth components.
6. Backend verifies tokens via auth-bridge-laravel.

**For a standalone Svelte app:**
1. Install package.
2. Initialize Firebase with `initFirebaseAuth()`.
3. Use components in auth routes.
4. Handle success events to navigate users.

---

## 7. Firebase Project Strategy

**Per-App Per-Environment Configuration:**

Each app maintains its own set of Firebase projects:

```
docs-staging      → Firebase Project
docs-prod         → Firebase Project
dashboard-staging → Firebase Project
dashboard-prod    → Firebase Project
```

**Benefits:**
- **Isolation**: No cross-app user leakage
- **Security**: Independent security rules per app
- **Scalability**: Independent rate limits and quotas
- **Debugging**: Isolated logs and analytics

**Configuration Method:**
Apps configure via environment variables:
```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_APP_ID=...
```

---

## 8. TypeScript Support

**Type Safety:**
- All components export typed props
- All functions have type signatures
- Event payloads are typed
- Firebase types re-exported where needed

**Exported Types:**
```typescript
FirebaseConfig
AuthOptions
AuthService
LoginCredentials
RegisterData
PasswordResetData
MfaEnrollmentData
MfaVerificationData
AuthError
AuthState
AuthEvents
```

---

## 9. Accessibility Requirements

- All interactive elements keyboard accessible
- Proper focus management
- ARIA labels and roles
- Form validation messages announced to screen readers
- High contrast mode support
- Reduced motion support

---

## 10. Performance Requirements

- Package size < 50KB gzipped
- Tree-shakeable exports
- Lazy-loadable components
- No unnecessary Firebase SDK imports
- Optimized bundle splitting

---

## 11. References

- [AI Collaboration Playbook](../ai/AGENTS.md)
- [README.md](../README.md) - Installation and usage
- [EXAMPLES.md](../EXAMPLES.md) - Code examples
- [LARAVEL_INTEGRATION.md](../LARAVEL_INTEGRATION.md) - Laravel integration guide
- [laravel-app-template](https://github.com/rockstoneaidev/laravel-app-template)
- [auth-bridge-laravel](https://github.com/rockstoneaidev/auth-bridge-laravel)
- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [shadcn-svelte](https://www.shadcn-svelte.com/)

---

## 12. Change Log

- **2025-12-28:** Initial release (v0.1.0) with 6 auth components and Firebase integration.

---

## 13. Future Enhancements (Nice-to-Have)

- Password strength indicator component
- Email link signin support
- TOTP (authenticator app) MFA support
- Social provider UI components (Google, GitHub buttons)
- Biometric authentication support
- Session management UI (active sessions list)
- Account deletion flow
- Email change flow with verification
- Phone number verification without MFA
- Profile update components
- Avatar upload component

---

_Last updated: 2025-12-28_

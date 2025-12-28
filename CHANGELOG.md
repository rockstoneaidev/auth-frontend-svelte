# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - 2025-12-28

### Fixed
- Fixed Tailwind v4 build issues by removing global styles and JS-based CSS exports.
- Fixed incorrect CSS export path resolution.
- Improved documentation for Tailwind v4 integration.

## [0.1.0] - 2025-12-28

### Added
- Initial release of auth-frontend-svelte
- `LoginForm` component with email/password authentication
- `RegisterForm` component with email verification
- `ForgotPasswordForm` for password reset requests
- `ResetPasswordForm` for handling password reset links
- `MfaSetupForm` for enrolling in multi-factor authentication
- `MfaChallengeForm` for MFA verification during login
- Complete Firebase Authentication integration
- shadcn-svelte UI components with dark mode support
- Full TypeScript support
- Comprehensive documentation and examples

import type { FirebaseApp } from 'firebase/app';
import type { Auth, User, UserCredential } from 'firebase/auth';

/**
 * Firebase configuration object
 * @see https://firebase.google.com/docs/web/setup#config-object
 */
export interface FirebaseConfig {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket?: string;
    messagingSenderId?: string;
    appId: string;
    measurementId?: string;
}

/**
 * Options for initializing Firebase Auth
 */
export interface AuthOptions {
    /** Firebase configuration */
    config: FirebaseConfig;
    /** Optional persistence type (default: 'local') */
    persistence?: 'local' | 'session' | 'none';
    /** Optional callback when auth state changes */
    onAuthStateChanged?: (user: User | null) => void;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
    email: string;
    password: string;
}

/**
 * Registration data
 */
export interface RegisterData {
    email: string;
    password: string;
    displayName?: string;
}

/**
 * Password reset data
 */
export interface PasswordResetData {
    email: string;
}

/**
 * MFA enrollment data
 */
export interface MfaEnrollmentData {
    phoneNumber?: string;
}

/**
 * MFA verification data
 */
export interface MfaVerificationData {
    code: string;
}

/**
 * Auth error with Firebase-specific details
 */
export interface AuthError {
    code: string;
    message: string;
    originalError?: unknown;
}

/**
 * Auth state
 */
export interface AuthState {
    user: User | null;
    loading: boolean;
    error: AuthError | null;
}

/**
 * Exported auth service interface
 */
export interface AuthService {
    /** Firebase app instance */
    app: FirebaseApp;
    /** Firebase auth instance */
    auth: Auth;
    /** Sign in with email and password */
    signIn: (credentials: LoginCredentials) => Promise<UserCredential>;
    /** Register new user */
    register: (data: RegisterData) => Promise<UserCredential>;
    /** Sign out current user */
    signOut: () => Promise<void>;
    /** Send password reset email */
    sendPasswordReset: (email: string) => Promise<void>;
    /** Confirm password reset */
    confirmPasswordReset: (code: string, newPassword: string) => Promise<void>;
    /** Get current user */
    getCurrentUser: () => User | null;
    /** Send email verification */
    sendEmailVerification: () => Promise<void>;
    /** Reload user data */
    reloadUser: () => Promise<void>;
}

/**
 * Component event types
 */
export interface AuthEvents {
    success: { user: User };
    error: { error: AuthError };
}

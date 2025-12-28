import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    sendPasswordResetEmail,
    confirmPasswordReset as firebaseConfirmPasswordReset,
    sendEmailVerification as firebaseSendEmailVerification,
    updateProfile,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence,
    inMemoryPersistence,
    onAuthStateChanged,
    multiFactor,
    TotpMultiFactorGenerator,
    type TotpMultiFactorAssertion,
    type Auth,
    type User,
    type UserCredential
} from 'firebase/auth';
import type {
    AuthOptions,
    AuthService,
    LoginCredentials,
    RegisterData,
    AuthError,
    TotpSecret
} from './types';

let firebaseApp: FirebaseApp | null = null;
let auth: Auth | null = null;

/**
 * Initialize Firebase Auth
 * This should be called once at application startup
 */
export function initFirebaseAuth(options: AuthOptions): AuthService {
    // Initialize Firebase app if not already done
    if (!firebaseApp) {
        firebaseApp = initializeApp(options.config);
    }

    // Initialize Auth if not already done
    if (!auth) {
        auth = getAuth(firebaseApp);
    }

    // Set persistence
    const persistenceType =
        options.persistence === 'session'
            ? browserSessionPersistence
            : options.persistence === 'none'
                ? inMemoryPersistence
                : browserLocalPersistence;

    setPersistence(auth, persistenceType).catch((error) => {
        console.error('Failed to set auth persistence:', error);
    });

    // Set up auth state listener
    if (options.onAuthStateChanged) {
        onAuthStateChanged(auth, options.onAuthStateChanged);
    }

    /**
     * Sign in with email and password
     */
    async function signIn(credentials: LoginCredentials): Promise<UserCredential> {
        if (!auth) throw new Error('Auth not initialized');
        try {
            return await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
        } catch (error: unknown) {
            throw normalizeError(error);
        }
    }

    /**
     * Register new user with email and password
     */
    async function register(data: RegisterData): Promise<UserCredential> {
        if (!auth) throw new Error('Auth not initialized');
        try {
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                data.email,
                data.password
            );

            // Update profile with display name if provided
            if (data.displayName && userCredential.user) {
                await updateProfile(userCredential.user, {
                    displayName: data.displayName
                });
            }

            return userCredential;
        } catch (error: unknown) {
            throw normalizeError(error);
        }
    }

    /**
     * Sign out current user
     */
    async function signOut(): Promise<void> {
        if (!auth) throw new Error('Auth not initialized');
        try {
            await firebaseSignOut(auth);
        } catch (error: unknown) {
            throw normalizeError(error);
        }
    }

    /**
     * Send password reset email
     */
    async function sendPasswordReset(email: string): Promise<void> {
        if (!auth) throw new Error('Auth not initialized');
        try {
            await sendPasswordResetEmail(auth, email);
        } catch (error: unknown) {
            throw normalizeError(error);
        }
    }

    /**
     * Confirm password reset with code
     */
    async function confirmPasswordReset(code: string, newPassword: string): Promise<void> {
        if (!auth) throw new Error('Auth not initialized');
        try {
            await firebaseConfirmPasswordReset(auth, code, newPassword);
        } catch (error: unknown) {
            throw normalizeError(error);
        }
    }

    /**
     * Get currently signed-in user
     */
    function getCurrentUser(): User | null {
        if (!auth) return null;
        return auth.currentUser;
    }

    /**
     * Send email verification to current user
     */
    async function sendEmailVerification(): Promise<void> {
        if (!auth?.currentUser) throw new Error('No user signed in');
        try {
            await firebaseSendEmailVerification(auth.currentUser);
        } catch (error: unknown) {
            throw normalizeError(error);
        }
    }

    /**
     * Reload current user data
     */
    async function reloadUser(): Promise<void> {
        if (!auth?.currentUser) throw new Error('No user signed in');
        try {
            await auth.currentUser.reload();
        } catch (error: unknown) {
            throw normalizeError(error);
        }
    }

    /**
     * Generate TOTP secret for authenticator app setup
     */
    async function generateTotpSecret(): Promise<TotpSecret> {
        if (!auth?.currentUser) throw new Error('No user signed in');
        try {
            const mfaUser = multiFactor(auth.currentUser);
            const secret = await TotpMultiFactorGenerator.generateSecret(mfaUser);
            return {
                secretCode: secret.secretKey,
                qrCodeUrl: secret.generateQrCodeUrl(
                    auth.currentUser.email || 'user',
                    options.config.projectId || 'Rockstone Auth'
                ),
                accountName: auth.currentUser.email || 'user',
                issuer: options.config.projectId || 'Rockstone Auth',
                _rawSecret: secret
            };
        } catch (error: unknown) {
            throw normalizeError(error);
        }
    }

    /**
     * Finalize TOTP enrollment
     */
    async function enrollTotp(secret: TotpSecret, code: string, displayName?: string): Promise<void> {
        if (!auth?.currentUser) throw new Error('No user signed in');
        try {
            const mfaUser = multiFactor(auth.currentUser);
            const assertion = TotpMultiFactorGenerator.assertionForEnrollment(
                secret._rawSecret,
                code
            );
            await mfaUser.enroll(assertion, displayName);
        } catch (error: unknown) {
            throw normalizeError(error);
        }
    }

    /**
     * Unenroll an MFA factor
     */
    async function unenrollMfa(mfaEnrollmentId: string): Promise<void> {
        if (!auth?.currentUser) throw new Error('No user signed in');
        try {
            const mfaUser = multiFactor(auth.currentUser);
            await mfaUser.unenroll(mfaEnrollmentId);
        } catch (error: unknown) {
            throw normalizeError(error);
        }
    }

    return {
        app: firebaseApp,
        auth,
        signIn,
        register,
        signOut,
        sendPasswordReset,
        confirmPasswordReset,
        getCurrentUser,
        sendEmailVerification,
        reloadUser,
        generateTotpSecret,
        enrollTotp,
        unenrollMfa
    };
}

/**
 * Normalize Firebase errors to a consistent format
 */
function normalizeError(error: unknown): AuthError {
    if (typeof error === 'object' && error !== null && 'code' in error && 'message' in error) {
        const firebaseError = error as { code: string; message: string };
        return {
            code: firebaseError.code,
            message: getUserFriendlyMessage(firebaseError.code, firebaseError.message),
            originalError: error
        };
    }

    return {
        code: 'unknown',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
        originalError: error
    };
}

/**
 * Convert Firebase error codes to user-friendly messages
 */
function getUserFriendlyMessage(code: string, defaultMessage: string): string {
    const messages: Record<string, string> = {
        'auth/email-already-in-use': 'This email is already registered',
        'auth/invalid-email': 'Please enter a valid email address',
        'auth/operation-not-allowed': 'This operation is not allowed',
        'auth/weak-password': 'Password should be at least 6 characters',
        'auth/user-disabled': 'This account has been disabled',
        'auth/user-not-found': 'No account found with this email',
        'auth/wrong-password': 'Incorrect email or password',
        'auth/invalid-credential': 'Invalid email or password',
        'auth/too-many-requests': 'Too many attempts. Please try again later',
        'auth/network-request-failed': 'Network error. Please check your connection',
        'auth/popup-closed-by-user': 'Sign-in cancelled',
        'auth/expired-action-code': 'This link has expired',
        'auth/invalid-action-code': 'Invalid or expired link',
        'auth/requires-recent-login': 'Please sign in again to continue',
        'auth/multi-factor-auth-required': 'Please verify your identity with a second factor',
        'auth/invalid-verification-code': 'Invalid verification code. Please try again',
        'auth/unverified-email': 'Please verify your email address first'
    };

    return messages[code] || defaultMessage;
}

/**
 * Get auth service (must be initialized first)
 */
export function getAuthService(): AuthService {
    if (!firebaseApp || !auth) {
        throw new Error('Firebase Auth not initialized. Call initFirebaseAuth() first.');
    }

    const service = initFirebaseAuth({
        config: (firebaseApp as any).options,
        persistence: 'local' // default
    });

    return service;
}

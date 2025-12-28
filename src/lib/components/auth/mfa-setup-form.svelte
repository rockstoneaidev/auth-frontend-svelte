<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";
    import {
        getAuth,
        PhoneAuthProvider,
        PhoneMultiFactorGenerator,
        multiFactor,
        RecaptchaVerifier,
    } from "firebase/auth";
    import Button from "$lib/components/ui/button.svelte";
    import Input from "$lib/components/ui/input.svelte";
    import Label from "$lib/components/ui/label.svelte";
    import Card from "$lib/components/ui/card.svelte";
    import { Shield, Smartphone } from "lucide-svelte";
    import type { AuthError } from "$lib/types";

    let {
        showBackButton = true,
    }: {
        showBackButton?: boolean;
    } = $props();

    const dispatch = createEventDispatcher<{
        success: void;
        error: { error: AuthError };
        back: void;
    }>();

    let phoneNumber = $state("");
    let verificationCode = $state("");
    let loading = $state(false);
    let codeSent = $state(false);
    let error = $state<string | null>(null);
    let verificationId = $state<string>("");
    let recaptchaVerifier: RecaptchaVerifier | null = null;
    let recaptchaWidgetId: number | null = null;

    onMount(() => {
        // Initialize reCAPTCHA
        try {
            const auth = getAuth();
            recaptchaVerifier = new RecaptchaVerifier(
                auth,
                "recaptcha-container",
                {
                    size: "normal",
                    callback: () => {
                        // reCAPTCHA solved
                    },
                    "expired-callback": () => {
                        error = "reCAPTCHA expired. Please try again.";
                    },
                },
            );
        } catch (err) {
            console.error("Failed to initialize reCAPTCHA:", err);
            error =
                "Failed to initialize verification. Please refresh the page.";
        }

        return () => {
            if (recaptchaVerifier) {
                recaptchaVerifier.clear();
            }
        };
    });

    async function handleSendCode(e: SubmitEvent) {
        e.preventDefault();
        loading = true;
        error = null;

        try {
            const auth = getAuth();
            const user = auth.currentUser;

            if (!user) {
                throw new Error("No user signed in");
            }

            if (!recaptchaVerifier) {
                throw new Error("reCAPTCHA not initialized");
            }

            const session = await multiFactor(user).getSession();
            const phoneInfoOptions = {
                phoneNumber,
                session,
            };

            const phoneAuthProvider = new PhoneAuthProvider(auth);
            verificationId = await phoneAuthProvider.verifyPhoneNumber(
                phoneInfoOptions,
                recaptchaVerifier,
            );

            codeSent = true;
        } catch (err: unknown) {
            const authError = err as AuthError;
            error = authError.message || "Failed to send verification code";
            dispatch("error", { error: authError });
        } finally {
            loading = false;
        }
    }

    async function handleVerifyCode(e: SubmitEvent) {
        e.preventDefault();
        loading = true;
        error = null;

        try {
            const auth = getAuth();
            const user = auth.currentUser;

            if (!user) {
                throw new Error("No user signed in");
            }

            const cred = PhoneAuthProvider.credential(
                verificationId,
                verificationCode,
            );
            const multiFactorAssertion =
                PhoneMultiFactorGenerator.assertion(cred);

            await multiFactor(user).enroll(
                multiFactorAssertion,
                "Phone Number",
            );

            dispatch("success");
        } catch (err: unknown) {
            const authError = err as AuthError;
            error = authError.message || "Failed to verify code";
            dispatch("error", { error: authError });
        } finally {
            loading = false;
        }
    }
</script>

<Card class="w-full max-w-md p-6">
    <div class="flex flex-col gap-6">
        <div class="flex flex-col items-center gap-2 text-center">
            <div
                class="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary"
            >
                <Shield class="size-6" />
            </div>
            <h1 class="text-2xl font-bold">Set up two-factor authentication</h1>
            <p class="text-balance text-sm text-muted-foreground">
                Add an extra layer of security to your account
            </p>
        </div>

        {#if !codeSent}
            <form onsubmit={handleSendCode} class="grid gap-4">
                <div class="rounded-lg border bg-muted/50 p-4">
                    <div class="flex gap-3">
                        <Smartphone
                            class="size-5 text-muted-foreground mt-0.5"
                        />
                        <div class="flex-1">
                            <p class="text-sm font-medium">
                                Phone verification
                            </p>
                            <p class="text-xs text-muted-foreground mt-1">
                                We'll send a verification code to your phone
                                number
                            </p>
                        </div>
                    </div>
                </div>

                <div class="grid gap-2">
                    <Label for="phone">Phone Number</Label>
                    <Input
                        id="phone"
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        bind:value={phoneNumber}
                        required
                        disabled={loading}
                    />
                    <p class="text-xs text-muted-foreground">
                        Include country code (e.g., +1 for US)
                    </p>
                </div>

                <div id="recaptcha-container"></div>

                {#if error}
                    <div
                        class="rounded-md bg-destructive/15 p-3 text-sm text-destructive"
                    >
                        {error}
                    </div>
                {/if}

                <Button type="submit" class="w-full" disabled={loading}>
                    {loading ? "Sending code..." : "Send verification code"}
                </Button>
            </form>
        {:else}
            <form onsubmit={handleVerifyCode} class="grid gap-4">
                <div
                    class="rounded-md bg-blue-50 dark:bg-blue-950 p-4 text-sm text-blue-800 dark:text-blue-200"
                >
                    <p class="font-medium">Code sent!</p>
                    <p class="mt-1">
                        Enter the verification code sent to {phoneNumber}
                    </p>
                </div>

                <div class="grid gap-2">
                    <Label for="code">Verification Code</Label>
                    <Input
                        id="code"
                        type="text"
                        placeholder="000000"
                        bind:value={verificationCode}
                        required
                        disabled={loading}
                        maxlength="6"
                    />
                </div>

                {#if error}
                    <div
                        class="rounded-md bg-destructive/15 p-3 text-sm text-destructive"
                    >
                        {error}
                    </div>
                {/if}

                <div class="flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        class="flex-1"
                        onclick={() => {
                            codeSent = false;
                            verificationCode = "";
                            error = null;
                        }}
                    >
                        Change number
                    </Button>
                    <Button type="submit" class="flex-1" disabled={loading}>
                        {loading ? "Verifying..." : "Verify & enable"}
                    </Button>
                </div>
            </form>
        {/if}

        {#if showBackButton}
            <div class="text-center text-sm">
                <button
                    type="button"
                    class="underline underline-offset-4 hover:text-primary"
                    onclick={() => dispatch("back")}
                >
                    Skip for now
                </button>
            </div>
        {/if}
    </div>
</Card>

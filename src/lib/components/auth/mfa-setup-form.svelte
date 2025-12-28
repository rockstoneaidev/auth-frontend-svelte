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
    import {
        Shield,
        Smartphone,
        Key,
        ArrowRight,
        ArrowLeft,
    } from "lucide-svelte";
    import type { AuthError } from "$lib/types";
    import MfaTotpSetupForm from "./mfa-totp-setup-form.svelte";
    import { cn } from "$lib/utils";

    let {
        showBackButton = true,
        className = "",
    }: {
        showBackButton?: boolean;
        className?: string;
    } = $props();

    const dispatch = createEventDispatcher<{
        success: void;
        error: { error: AuthError };
        back: void;
    }>();

    type SetupMode = "selection" | "phone" | "totp" | "success";
    let setupMode = $state<SetupMode>("selection");

    // Phone Setup State
    let phoneNumber = $state("");
    let verificationCode = $state("");
    let loading = $state(false);
    let codeSent = $state(false);
    let error = $state<string | null>(null);
    let verificationId = $state<string>("");
    let recaptchaVerifier: RecaptchaVerifier | null = null;

    function initRecaptcha() {
        if (recaptchaVerifier) return;
        try {
            const auth = getAuth();
            recaptchaVerifier = new RecaptchaVerifier(
                auth,
                "recaptcha-container",
                {
                    size: "normal",
                    callback: () => {},
                    "expired-callback": () => {
                        error = "reCAPTCHA expired. Please try again.";
                    },
                },
            );
        } catch (err) {
            console.error("Failed to initialize reCAPTCHA:", err);
            error = "Failed to initialize verification. Please try again.";
        }
    }

    $effect(() => {
        if (setupMode === "phone" && !codeSent) {
            // Need to wait for DOM to update so recaptcha-container exists
            setTimeout(initRecaptcha, 0);
        }
        return () => {
            if (recaptchaVerifier) {
                recaptchaVerifier.clear();
                recaptchaVerifier = null;
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
            if (!user) throw new Error("No user signed in");
            if (!recaptchaVerifier)
                throw new Error("reCAPTCHA not initialized");

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
        } catch (err: any) {
            error = err.message || "Failed to send verification code";
            dispatch("error", { error: err });
        } finally {
            loading = false;
        }
    }

    async function handleVerifyPhoneCode(e: SubmitEvent) {
        e.preventDefault();
        loading = true;
        error = null;

        try {
            const auth = getAuth();
            const user = auth.currentUser;
            if (!user) throw new Error("No user signed in");

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
            setupMode = "success";
        } catch (err: any) {
            error = err.message || "Failed to verify code";
            dispatch("error", { error: err });
        } finally {
            loading = false;
        }
    }

    function handleSuccess() {
        dispatch("success");
    }
</script>

{#if setupMode === "selection"}
    <Card class={cn("w-full max-w-md p-6 overflow-hidden", className)}>
        <div class="flex flex-col gap-6">
            <div class="flex flex-col items-center gap-2 text-center">
                <div
                    class="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary"
                >
                    <Shield class="size-6" />
                </div>
                <h1 class="text-2xl font-bold tracking-tight">
                    Two-factor authentication
                </h1>
                <p class="text-sm text-balance text-muted-foreground">
                    Choose how you want to receive your security codes
                </p>
            </div>

            <div class="grid gap-3">
                <button
                    class="group flex items-center justify-between rounded-xl border p-4 text-left transition-all hover:bg-accent hover:border-primary/50"
                    onclick={() => (setupMode = "totp")}
                >
                    <div class="flex items-center gap-4">
                        <div
                            class="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                        >
                            <Key class="size-5" />
                        </div>
                        <div>
                            <p class="font-semibold">Authenticator App</p>
                            <p class="text-xs text-muted-foreground">
                                Use Google Authenticator, Authy, etc.
                            </p>
                        </div>
                    </div>
                    <ArrowRight
                        class="size-4 text-muted-foreground group-hover:text-primary transition-colors"
                    />
                </button>

                <button
                    class="group flex items-center justify-between rounded-xl border p-4 text-left transition-all hover:bg-accent hover:border-primary/50"
                    onclick={() => (setupMode = "phone")}
                >
                    <div class="flex items-center gap-4">
                        <div
                            class="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                        >
                            <Smartphone class="size-5" />
                        </div>
                        <div>
                            <p class="font-semibold">Text Message (SMS)</p>
                            <p class="text-xs text-muted-foreground">
                                Receive codes via SMS on your phone
                            </p>
                        </div>
                    </div>
                    <ArrowRight
                        class="size-4 text-muted-foreground group-hover:text-primary transition-colors"
                    />
                </button>
            </div>

            {#if showBackButton}
                <div class="text-center">
                    <Button
                        variant="ghost"
                        class="text-sm text-muted-foreground"
                        onclick={() => dispatch("back")}
                    >
                        Skip for now
                    </Button>
                </div>
            {/if}
        </div>
    </Card>
{:else if setupMode === "totp"}
    <MfaTotpSetupForm
        {className}
        on:success={() => (setupMode = "success")}
        on:back={() => (setupMode = "selection")}
        on:error={(e) => dispatch("error", e)}
    />
{:else if setupMode === "phone"}
    <Card class={cn("w-full max-w-md p-6", className)}>
        <div class="flex flex-col gap-6">
            <div class="flex flex-col items-center gap-2 text-center">
                <div
                    class="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary"
                >
                    <Smartphone class="size-6" />
                </div>
                <h1 class="text-2xl font-bold tracking-tight">
                    Phone verification
                </h1>
                <p class="text-sm text-balance text-muted-foreground">
                    We'll send a code to your mobile phone
                </p>
            </div>

            {#if !codeSent}
                <form onsubmit={handleSendCode} class="grid gap-4">
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

                    <div
                        id="recaptcha-container"
                        class="flex justify-center"
                    ></div>

                    {#if error}
                        <div
                            class="rounded-md bg-destructive/15 p-3 text-sm text-destructive"
                        >
                            {error}
                        </div>
                    {/if}

                    <div class="flex flex-col gap-2">
                        <Button type="submit" class="w-full" disabled={loading}>
                            {loading
                                ? "Sending code..."
                                : "Send Verification Code"}
                        </Button>
                        <Button
                            variant="ghost"
                            type="button"
                            class="w-full text-muted-foreground"
                            onclick={() => (setupMode = "selection")}
                            disabled={loading}
                        >
                            <ArrowLeft class="mr-2 h-4 w-4" />
                            Back
                        </Button>
                    </div>
                </form>
            {:else}
                <form onsubmit={handleVerifyPhoneCode} class="grid gap-4">
                    <div
                        class="rounded-lg bg-primary/10 p-4 text-sm text-primary"
                    >
                        <p class="font-medium">Code sent!</p>
                        <p class="mt-1 opacity-90">
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
                            class="text-center text-xl font-bold tracking-[0.5em]"
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
                            {loading ? "Verifying..." : "Enable"}
                        </Button>
                    </div>
                </form>
            {/if}
        </div>
    </Card>
{:else if setupMode === "success"}
    <Card class={cn("w-full max-w-md p-6 text-center", className)}>
        <div class="flex flex-col items-center gap-4 py-4">
            <div
                class="flex size-16 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
            >
                <Shield class="size-8" />
            </div>
            <div class="space-y-2">
                <h1 class="text-2xl font-bold">MFA Enabled</h1>
                <p class="text-muted-foreground">
                    Your account is now more secure with two-factor
                    authentication.
                </p>
            </div>
            <Button class="mt-4 w-full" onclick={handleSuccess}>
                Continue to Account
            </Button>
        </div>
    </Card>
{/if}

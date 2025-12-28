<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";
    import {
        getAuth,
        PhoneAuthProvider,
        PhoneMultiFactorGenerator,
        TotpMultiFactorGenerator,
        RecaptchaVerifier,
        type MultiFactorResolver,
    } from "firebase/auth";
    import Button from "$lib/components/ui/button.svelte";
    import Input from "$lib/components/ui/input.svelte";
    import Label from "$lib/components/ui/label.svelte";
    import Card from "$lib/components/ui/card.svelte";
    import { Shield, Smartphone, Key } from "lucide-svelte";
    import type { AuthError } from "$lib/types";
    import { cn } from "$lib/utils";

    let {
        resolver,
        selectedIndex = 0,
        className = "",
    }: {
        resolver: MultiFactorResolver;
        selectedIndex?: number;
        className?: string;
    } = $props();

    const dispatch = createEventDispatcher<{
        success: void;
        error: { error: AuthError };
        cancel: void;
    }>();

    let localSelectedIndex = $state(selectedIndex);
    let verificationCode = $state("");
    let loading = $state(false);
    let sendingCode = $state(false);
    let error = $state<string | null>(null);
    let verificationId = $state<string | null>(null);
    let recaptchaVerifier: RecaptchaVerifier | null = null;

    const selectedHint = $derived(resolver.hints[localSelectedIndex]);
    const factorId = $derived(selectedHint.factorId);
    const isPhone = $derived(factorId === "phone");
    const isTotp = $derived(factorId === "totp");

    onMount(() => {
        if (isPhone) {
            try {
                const auth = getAuth();
                recaptchaVerifier = new RecaptchaVerifier(
                    auth,
                    "recaptcha-container",
                    {
                        size: "invisible",
                        callback: () => {
                            // reCAPTCHA solved
                        },
                    },
                );
            } catch (err) {
                console.error("Failed to initialize reCAPTCHA:", err);
            }
        }
    });

    async function handleSendPhoneCode() {
        if (!isPhone || !recaptchaVerifier) return;

        sendingCode = true;
        error = null;

        try {
            const auth = getAuth();
            const phoneAuthProvider = new PhoneAuthProvider(auth);
            const phoneInfoOptions = {
                multiFactorHint: selectedHint,
                session: resolver.session,
            };

            verificationId = await phoneAuthProvider.verifyPhoneNumber(
                phoneInfoOptions,
                recaptchaVerifier,
            );
        } catch (err: any) {
            error = err.message || "Failed to send verification code";
            dispatch("error", { error: err });
        } finally {
            sendingCode = false;
        }
    }

    async function handleVerify(e: SubmitEvent) {
        e.preventDefault();
        loading = true;
        error = null;

        try {
            let multiFactorAssertion;

            if (isPhone) {
                if (!verificationId)
                    throw new Error("Please send verification code first");
                const cred = PhoneAuthProvider.credential(
                    verificationId,
                    verificationCode,
                );
                multiFactorAssertion =
                    PhoneMultiFactorGenerator.assertion(cred);
            } else if (isTotp) {
                multiFactorAssertion =
                    TotpMultiFactorGenerator.assertionForSignIn(
                        selectedHint.uid,
                        verificationCode,
                    );
            } else {
                throw new Error("Unsupported authentication factor");
            }

            await resolver.resolveSignIn(multiFactorAssertion);
            dispatch("success");
        } catch (err: any) {
            error = err.message || "Invalid verification code";
            dispatch("error", { error: err });
        } finally {
            loading = false;
        }
    }
</script>

<Card class={cn("w-full max-w-sm p-6 space-y-6", className)}>
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
            {#if isPhone}
                Verify your identity via SMS
            {:else if isTotp}
                Enter the code from your authenticator app
            {:else}
                Choose a verification method
            {/if}
        </p>
    </div>

    <form onsubmit={handleVerify} class="grid gap-4">
        {#if resolver.hints.length > 1}
            <div class="grid gap-2">
                <Label>Verification Method</Label>
                <div class="flex flex-col gap-2">
                    {#each resolver.hints as hint, index}
                        <button
                            type="button"
                            class={cn(
                                "flex items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors hover:bg-accent",
                                index === localSelectedIndex &&
                                    "bg-accent border-primary/50",
                            )}
                            onclick={() => {
                                localSelectedIndex = index;
                                verificationId = null;
                                verificationCode = "";
                                error = null;
                            }}
                        >
                            <div
                                class="flex size-8 items-center justify-center rounded-full bg-muted"
                            >
                                {#if hint.factorId === "phone"}
                                    <Smartphone class="size-4" />
                                {:else}
                                    <Key class="size-4" />
                                {/if}
                            </div>
                            <div class="flex-1">
                                <p class="font-medium">
                                    {hint.factorId === "phone"
                                        ? "Text Message"
                                        : "Authenticator App"}
                                </p>
                                <p class="text-[12px] text-muted-foreground">
                                    {hint.factorId === "phone"
                                        ? hint.phoneNumber
                                        : "Authenticator App"}
                                </p>
                            </div>
                        </button>
                    {/each}
                </div>
            </div>
        {/if}

        {#if isPhone && !verificationId}
            <div class="space-y-4 pt-2">
                <p class="text-sm text-balance text-muted-foreground">
                    We'll send a 6-digit verification code to <strong
                        >{selectedHint.phoneNumber}</strong
                    >
                </p>
                <div id="recaptcha-container"></div>
                <Button
                    type="button"
                    class="w-full"
                    onclick={handleSendPhoneCode}
                    disabled={sendingCode}
                >
                    {sendingCode ? "Sending..." : "Send SMS Code"}
                </Button>
            </div>
        {:else}
            <div class="grid gap-2 pt-2">
                <div class="flex items-center justify-between">
                    <Label for="code">Verification Code</Label>
                    {#if isPhone}
                        <button
                            type="button"
                            class="text-xs text-primary hover:underline"
                            onclick={() => {
                                verificationId = null;
                                verificationCode = "";
                            }}
                        >
                            Resend code
                        </button>
                    {/if}
                </div>
                <Input
                    id="code"
                    type="text"
                    placeholder="000000"
                    bind:value={verificationCode}
                    required
                    disabled={loading}
                    maxlength="6"
                    class="text-center text-xl font-bold tracking-[0.5em]"
                    autocomplete="one-time-code"
                />
            </div>
        {/if}

        {#if error}
            <div
                class="rounded-md bg-destructive/15 p-3 text-sm text-destructive"
            >
                {error}
            </div>
        {/if}

        {#if !isPhone || verificationId}
            <Button
                type="submit"
                class="w-full"
                disabled={loading || verificationCode.length !== 6}
            >
                {loading ? "Verifying..." : "Verify & Sign In"}
            </Button>
        {/if}

        <Button
            type="button"
            variant="ghost"
            class="w-full text-muted-foreground"
            onclick={() => dispatch("cancel")}
            disabled={loading || sendingCode}
        >
            Cancel
        </Button>
    </form>
</Card>

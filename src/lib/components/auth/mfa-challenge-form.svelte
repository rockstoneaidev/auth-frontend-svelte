<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import {
        getAuth,
        PhoneAuthProvider,
        PhoneMultiFactorGenerator,
        type MultiFactorError,
        type MultiFactorResolver,
    } from "firebase/auth";
    import Button from "$lib/components/ui/button.svelte";
    import Input from "$lib/components/ui/input.svelte";
    import Label from "$lib/components/ui/label.svelte";
    import Card from "$lib/components/ui/card.svelte";
    import { Shield } from "lucide-svelte";
    import type { AuthError } from "$lib/types";

    let {
        resolver,
        selectedIndex = 0,
    }: {
        resolver: MultiFactorResolver;
        selectedIndex?: number;
    } = $props();

    const dispatch = createEventDispatcher<{
        success: void;
        error: { error: AuthError };
        cancel: void;
    }>();

    let verificationCode = $state("");
    let loading = $state(false);
    let error = $state<string | null>(null);

    const selectedHint = $derived(resolver.hints[selectedIndex]);
    const phoneNumber = $derived(selectedHint.phoneNumber || "your phone");

    async function handleVerifyCode(e: SubmitEvent) {
        e.preventDefault();
        loading = true;
        error = null;

        try {
            const auth = getAuth();
            const phoneAuthProvider = new PhoneAuthProvider(auth);

            // This should be called after the user receives the SMS code
            // In practice, you'd need to trigger sending the SMS first
            const cred = PhoneAuthProvider.credential(
                resolver.session as unknown as string,
                verificationCode,
            );
            const multiFactorAssertion =
                PhoneMultiFactorGenerator.assertion(cred);

            await resolver.resolveSignIn(multiFactorAssertion);

            dispatch("success");
        } catch (err: unknown) {
            const authError = err as AuthError;
            error = authError.message || "Invalid verification code";
            dispatch("error", { error: authError });
        } finally {
            loading = false;
        }
    }
</script>

<Card class="w-full max-w-sm p-6">
    <div class="flex flex-col gap-6">
        <div class="flex flex-col items-center gap-2 text-center">
            <div
                class="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary"
            >
                <Shield class="size-6" />
            </div>
            <h1 class="text-2xl font-bold">Two-factor authentication</h1>
            <p class="text-balance text-sm text-muted-foreground">
                Enter the verification code sent to {phoneNumber}
            </p>
        </div>

        <form onsubmit={handleVerifyCode} class="grid gap-4">
            {#if resolver.hints.length > 1}
                <div class="grid gap-2">
                    <Label>Choose a verification method</Label>
                    {#each resolver.hints as hint, index}
                        <button
                            type="button"
                            class="rounded-lg border p-3 text-left text-sm hover:bg-accent"
                            class:bg-accent={index === selectedIndex}
                            onclick={() => (selectedIndex = index)}
                        >
                            {hint.phoneNumber || "Phone verification"}
                        </button>
                    {/each}
                </div>
            {/if}

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
                    autocomplete="one-time-code"
                />
            </div>

            {#if error}
                <div
                    class="rounded-md bg-destructive/15 p-3 text-sm text-destructive"
                >
                    {error}
                </div>
            {/if}

            <Button
                type="submit"
                class="w-full"
                disabled={loading || verificationCode.length !== 6}
            >
                {loading ? "Verifying..." : "Verify code"}
            </Button>

            <Button
                type="button"
                variant="outline"
                class="w-full"
                onclick={() => dispatch("cancel")}
            >
                Cancel
            </Button>
        </form>
    </div>
</Card>

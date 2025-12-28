<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { getAuthService } from "$lib/firebase";
    import Button from "$lib/components/ui/button.svelte";
    import Input from "$lib/components/ui/input.svelte";
    import Label from "$lib/components/ui/label.svelte";
    import Card from "$lib/components/ui/card.svelte";
    import type { AuthError } from "$lib/types";

    let {
        showLoginLink = true,
    }: {
        showLoginLink?: boolean;
    } = $props();

    const dispatch = createEventDispatcher<{
        success: { email: string };
        error: { error: AuthError };
        login: void;
    }>();

    let email = $state("");
    let loading = $state(false);
    let success = $state(false);
    let error = $state<string | null>(null);

    async function handleSubmit(e: SubmitEvent) {
        e.preventDefault();
        loading = true;
        error = null;

        try {
            const authService = getAuthService();
            await authService.sendPasswordReset(email);

            success = true;
            dispatch("success", { email });
        } catch (err) {
            const authError = err as AuthError;
            error = authError.message;
            dispatch("error", { error: authError });
        } finally {
            loading = false;
        }
    }
</script>

<Card class="w-full max-w-sm p-6">
    <div class="flex flex-col gap-6">
        <div class="flex flex-col items-center gap-2 text-center">
            <h1 class="text-2xl font-bold">Forgot your password?</h1>
            <p class="text-balance text-sm text-muted-foreground">
                Enter your email address and we'll send you a link to reset your
                password
            </p>
        </div>

        {#if success}
            <div
                class="rounded-md bg-green-50 dark:bg-green-950 p-4 text-sm text-green-800 dark:text-green-200"
            >
                <p class="font-medium">Check your email</p>
                <p class="mt-1">We've sent a password reset link to {email}</p>
            </div>
        {:else}
            <form onsubmit={handleSubmit} class="grid gap-4">
                <div class="grid gap-2">
                    <Label for="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        bind:value={email}
                        required
                        disabled={loading}
                    />
                </div>

                {#if error}
                    <div
                        class="rounded-md bg-destructive/15 p-3 text-sm text-destructive"
                    >
                        {error}
                    </div>
                {/if}

                <Button type="submit" class="w-full" disabled={loading}>
                    {loading ? "Sending..." : "Send reset link"}
                </Button>
            </form>
        {/if}

        {#if showLoginLink}
            <div class="text-center text-sm">
                Remember your password?{" "}
                <button
                    type="button"
                    class="underline underline-offset-4 hover:text-primary"
                    onclick={() => dispatch("login")}
                >
                    Back to login
                </button>
            </div>
        {/if}
    </div>
</Card>

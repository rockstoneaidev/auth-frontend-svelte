<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { getAuthService } from "$lib/firebase";
    import Button from "$lib/components/ui/button.svelte";
    import Input from "$lib/components/ui/input.svelte";
    import Label from "$lib/components/ui/label.svelte";
    import Card from "$lib/components/ui/card.svelte";
    import type { AuthError } from "$lib/types";

    let {
        oobCode,
        redirectOnSuccess = true,
        redirectUrl = "/login",
    }: {
        oobCode: string;
        redirectOnSuccess?: boolean;
        redirectUrl?: string;
    } = $props();

    const dispatch = createEventDispatcher<{
        success: void;
        error: { error: AuthError };
    }>();

    let newPassword = $state("");
    let confirmPassword = $state("");
    let loading = $state(false);
    let success = $state(false);
    let error = $state<string | null>(null);

    async function handleSubmit(e: SubmitEvent) {
        e.preventDefault();
        loading = true;
        error = null;

        // Validation
        if (newPassword !== confirmPassword) {
            error = "Passwords do not match";
            loading = false;
            return;
        }

        if (newPassword.length < 6) {
            error = "Password must be at least 6 characters";
            loading = false;
            return;
        }

        try {
            const authService = getAuthService();
            await authService.confirmPasswordReset(oobCode, newPassword);

            success = true;
            dispatch("success");

            // Redirect after a short delay
            if (redirectOnSuccess && typeof window !== "undefined") {
                setTimeout(() => {
                    window.location.href = redirectUrl;
                }, 2000);
            }
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
            <h1 class="text-2xl font-bold">Reset your password</h1>
            <p class="text-balance text-sm text-muted-foreground">
                Enter your new password below
            </p>
        </div>

        {#if success}
            <div
                class="rounded-md bg-green-50 dark:bg-green-950 p-4 text-sm text-green-800 dark:text-green-200"
            >
                <p class="font-medium">Password reset successful!</p>
                <p class="mt-1">Redirecting to login...</p>
            </div>
        {:else}
            <form onsubmit={handleSubmit} class="grid gap-4">
                <div class="grid gap-2">
                    <Label for="new-password">New Password</Label>
                    <Input
                        id="new-password"
                        type="password"
                        placeholder="••••••••"
                        bind:value={newPassword}
                        required
                        disabled={loading}
                    />
                    <p class="text-xs text-muted-foreground">
                        Must be at least 6 characters
                    </p>
                </div>

                <div class="grid gap-2">
                    <Label for="confirm-password">Confirm Password</Label>
                    <Input
                        id="confirm-password"
                        type="password"
                        placeholder="••••••••"
                        bind:value={confirmPassword}
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
                    {loading ? "Resetting..." : "Reset password"}
                </Button>
            </form>
        {/if}
    </div>
</Card>

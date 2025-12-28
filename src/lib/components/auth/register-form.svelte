<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { getAuthService } from "$lib/firebase";
    import Button from "$lib/components/ui/button.svelte";
    import Input from "$lib/components/ui/input.svelte";
    import Label from "$lib/components/ui/label.svelte";
    import Card from "$lib/components/ui/card.svelte";
    import type { AuthError } from "$lib/types";

    let {
        redirectOnSuccess = true,
        redirectUrl = "/dashboard",
        showLoginLink = true,
        requireDisplayName = true,
    }: {
        redirectOnSuccess?: boolean;
        redirectUrl?: string;
        showLoginLink?: boolean;
        requireDisplayName?: boolean;
    } = $props();

    const dispatch = createEventDispatcher<{
        success: { email: string };
        error: { error: AuthError };
        login: void;
    }>();

    let email = $state("");
    let password = $state("");
    let confirmPassword = $state("");
    let displayName = $state("");
    let loading = $state(false);
    let error = $state<string | null>(null);

    async function handleSubmit(e: SubmitEvent) {
        e.preventDefault();
        loading = true;
        error = null;

        // Validation
        if (password !== confirmPassword) {
            error = "Passwords do not match";
            loading = false;
            return;
        }

        if (password.length < 6) {
            error = "Password must be at least 6 characters";
            loading = false;
            return;
        }

        try {
            const authService = getAuthService();
            await authService.register({
                email,
                password,
                displayName: requireDisplayName ? displayName : undefined,
            });

            // Send email verification
            await authService.sendEmailVerification();

            dispatch("success", { email });

            if (redirectOnSuccess && typeof window !== "undefined") {
                window.location.href = redirectUrl;
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
            <h1 class="text-2xl font-bold">Create an account</h1>
            <p class="text-balance text-sm text-muted-foreground">
                Enter your information to get started
            </p>
        </div>

        <form onsubmit={handleSubmit} class="grid gap-4">
            {#if requireDisplayName}
                <div class="grid gap-2">
                    <Label for="name">Name</Label>
                    <Input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        bind:value={displayName}
                        required
                        disabled={loading}
                    />
                </div>
            {/if}

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

            <div class="grid gap-2">
                <Label for="password">Password</Label>
                <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    bind:value={password}
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
                {loading ? "Creating account..." : "Create account"}
            </Button>
        </form>

        {#if showLoginLink}
            <div class="text-center text-sm">
                Already have an account?{" "}
                <button
                    type="button"
                    class="underline underline-offset-4 hover:text-primary"
                    onclick={() => dispatch("login")}
                >
                    Login
                </button>
            </div>
        {/if}
    </div>
</Card>

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
        showRegisterLink = true,
        showForgotPasswordLink = true,
    }: {
        redirectOnSuccess?: boolean;
        redirectUrl?: string;
        showRegisterLink?: boolean;
        showForgotPasswordLink?: boolean;
    } = $props();

    const dispatch = createEventDispatcher<{
        success: { email: string };
        error: { error: AuthError };
        register: void;
        forgotPassword: void;
    }>();

    let email = $state("");
    let password = $state("");
    let loading = $state(false);
    let error = $state<string | null>(null);

    async function handleSubmit(e: SubmitEvent) {
        e.preventDefault();
        loading = true;
        error = null;

        try {
            const authService = getAuthService();
            await authService.signIn({ email, password });

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
            <h1 class="text-2xl font-bold">Welcome back</h1>
            <p class="text-balance text-sm text-muted-foreground">
                Enter your email below to login to your account
            </p>
        </div>

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

            <div class="grid gap-2">
                <div class="flex items-center justify-between">
                    <Label for="password">Password</Label>
                    {#if showForgotPasswordLink}
                        <button
                            type="button"
                            class="text-sm underline-offset-4 hover:underline text-muted-foreground"
                            onclick={() => dispatch("forgotPassword")}
                        >
                            Forgot password?
                        </button>
                    {/if}
                </div>
                <Input
                    id="password"
                    type="password"
                    bind:value={password}
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
                {loading ? "Signing in..." : "Login"}
            </Button>
        </form>

        {#if showRegisterLink}
            <div class="text-center text-sm">
                Don't have an account?{" "}
                <button
                    type="button"
                    class="underline underline-offset-4 hover:text-primary"
                    onclick={() => dispatch("register")}
                >
                    Sign up
                </button>
            </div>
        {/if}
    </div>
</Card>

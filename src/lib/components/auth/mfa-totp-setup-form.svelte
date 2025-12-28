<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";
    import { Shield, Copy, Check, Smartphone, ArrowLeft } from "lucide-svelte";
    import QRCode from "qrcode";
    import { getAuthService } from "$lib/firebase";
    import Button from "$lib/components/ui/button.svelte";
    import Input from "$lib/components/ui/input.svelte";
    import Label from "$lib/components/ui/label.svelte";
    import Card from "$lib/components/ui/card.svelte";
    import type { TotpSecret, AuthError } from "$lib/types";
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

    const authService = getAuthService();

    let loading = $state(true);
    let finalizing = $state(false);
    let error = $state<string | null>(null);
    let totpSecret = $state<TotpSecret | null>(null);
    let qrCodeDataUrl = $state<string | null>(null);
    let verificationCode = $state("");
    let copied = $state(false);

    onMount(async () => {
        try {
            loading = true;
            error = null;
            const secret = await authService.generateTotpSecret();
            totpSecret = secret;
            // Generate QR code
            qrCodeDataUrl = await QRCode.toDataURL(secret.qrCodeUrl);
        } catch (err: any) {
            error = err.message;
            dispatch("error", { error: err });
        } finally {
            loading = false;
        }
    });

    async function handleVerify(e: SubmitEvent) {
        e.preventDefault();
        if (!totpSecret || verificationCode.length < 6) return;

        finalizing = true;
        error = null;

        try {
            await authService.enrollTotp(totpSecret, verificationCode);
            dispatch("success");
        } catch (err: any) {
            error = err.message;
            dispatch("error", { error: err });
        } finally {
            finalizing = false;
        }
    }

    function copyToClipboard() {
        if (!totpSecret) return;
        navigator.clipboard.writeText(totpSecret.secretCode);
        copied = true;
        setTimeout(() => (copied = false), 2000);
    }
</script>

<Card class={cn("w-full max-w-lg overflow-hidden", className)}>
    <div class="p-6">
        <div class="mb-6 flex flex-col items-center text-center">
            <div
                class="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"
            >
                <Shield class="h-6 w-6" />
            </div>
            <h2 class="text-2xl font-bold tracking-tight">Authenticator App</h2>
            <p class="text-muted-foreground">
                Add an extra layer of security using an authenticator app
            </p>
        </div>

        {#if loading}
            <div
                class="flex flex-col items-center justify-center space-y-4 py-8"
            >
                <div class="h-32 w-32 animate-pulse rounded-lg bg-muted"></div>
                <div class="h-4 w-48 animate-pulse rounded bg-muted"></div>
            </div>
        {:else if error && !totpSecret}
            <div
                class="rounded-lg bg-destructive/10 p-4 text-center text-sm text-destructive"
            >
                {error}
                <Button
                    variant="outline"
                    class="mt-4 w-full"
                    onclick={() => window.location.reload()}
                >
                    Try Again
                </Button>
            </div>
        {:else if totpSecret}
            <div class="space-y-6">
                <!-- Step 1: Scan QR Code -->
                <div class="space-y-4">
                    <div class="flex items-center space-x-2">
                        <div
                            class="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[12px] font-bold text-primary-foreground"
                        >
                            1
                        </div>
                        <h3 class="font-semibold">Scan QR Code</h3>
                    </div>
                    <p class="text-sm text-muted-foreground text-left">
                        Open your authenticator app (like Google Authenticator,
                        Authy, or Microsoft Authenticator) and scan this QR
                        code.
                    </p>
                    <div
                        class="flex justify-center rounded-xl bg-white p-4 shadow-sm border"
                    >
                        {#if qrCodeDataUrl}
                            <img
                                src={qrCodeDataUrl}
                                alt="QR Code"
                                class="h-48 w-48"
                            />
                        {/if}
                    </div>
                </div>

                <!-- Step 2: Manual Entry (Optional) -->
                <div class="space-y-4">
                    <div class="flex items-center space-x-2">
                        <div
                            class="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[12px] font-bold text-primary-foreground"
                        >
                            2
                        </div>
                        <h3 class="font-semibold">Or enter code manually</h3>
                    </div>
                    <div class="flex space-x-2">
                        <div
                            class="flex-1 rounded-md border bg-muted/50 p-2 font-mono text-sm"
                        >
                            {totpSecret.secretCode}
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            onclick={copyToClipboard}
                            title="Copy to clipboard"
                        >
                            {#if copied}
                                <Check class="h-4 w-4 text-green-500" />
                            {:else}
                                <Copy class="h-4 w-4" />
                            {/if}
                        </Button>
                    </div>
                </div>

                <!-- Step 3: Verify -->
                <div class="space-y-4">
                    <div class="flex items-center space-x-2">
                        <div
                            class="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[12px] font-bold text-primary-foreground"
                        >
                            3
                        </div>
                        <h3 class="font-semibold">Verify Code</h3>
                    </div>
                    <p class="text-sm text-muted-foreground text-left">
                        Enter the 6-digit code from your authenticator app to
                        complete setup.
                    </p>
                    <form onsubmit={handleVerify} class="space-y-4">
                        <div class="space-y-2">
                            <Label for="verificationCode"
                                >Verification Code</Label
                            >
                            <Input
                                id="verificationCode"
                                type="text"
                                placeholder="000000"
                                maxlength="6"
                                class="text-center text-2xl font-bold tracking-[0.5em]"
                                bind:value={verificationCode}
                                required
                                disabled={finalizing}
                            />
                        </div>

                        {#if error}
                            <p class="text-sm font-medium text-destructive">
                                {error}
                            </p>
                        {/if}

                        <Button
                            type="submit"
                            class="w-full"
                            disabled={finalizing || verificationCode.length < 6}
                        >
                            {finalizing ? "Verifying..." : "Complete Setup"}
                        </Button>
                    </form>
                </div>
            </div>
        {/if}

        {#if showBackButton}
            <div class="mt-6 border-t pt-6 text-center">
                <Button
                    variant="ghost"
                    class="text-muted-foreground"
                    onclick={() => dispatch("back")}
                    disabled={finalizing}
                >
                    <ArrowLeft class="mr-2 h-4 w-4" />
                    Back to options
                </Button>
            </div>
        {/if}
    </div>
</Card>

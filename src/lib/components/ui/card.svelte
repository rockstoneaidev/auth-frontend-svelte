<script lang="ts">
    import { cn } from "$lib/utils";
    import type { HTMLAttributes } from "svelte/elements";
    import type { Snippet } from "svelte";

    let {
        ref = $bindable(null),
        class: className,
        children,
        ...restProps
    }: HTMLAttributes<HTMLDivElement> & {
        ref?: HTMLDivElement | null;
        children?: Snippet;
    } = $props();
</script>

<div
    bind:this={ref}
    class={cn(
        "rounded-xl border bg-card text-card-foreground shadow",
        className,
    )}
    {...restProps}
>
    {#if children}
        {@render children()}
    {/if}
</div>

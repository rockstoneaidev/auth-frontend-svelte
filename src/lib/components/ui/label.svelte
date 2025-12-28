<script lang="ts">
    import { cn } from "$lib/utils";
    import type { HTMLLabelAttributes } from "svelte/elements";
    import type { Snippet } from "svelte";

    let {
        ref = $bindable(null),
        class: className,
        children,
        ...restProps
    }: HTMLLabelAttributes & {
        ref?: HTMLLabelElement | null;
        children?: Snippet;
    } = $props();
</script>

<label
    bind:this={ref}
    class={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className,
    )}
    {...restProps}
>
    {#if children}
        {@render children()}
    {/if}
</label>

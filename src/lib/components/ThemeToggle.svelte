<script>
    import { theme } from '$lib/stores/theme';
    import { Sun, Moon } from 'lucide-svelte';
</script>

<button class="theme-toggle" on:click={theme.toggle} aria-label="Toggle theme">
    {#if $theme === 'light'}
        <Moon size={20} />
    {:else}
        <Sun size={20} />
    {/if}
</button>

<style>
    .theme-toggle {
        background: none;
        border: 1px solid var(--border-color);
        border-radius: 6px;
        padding: 0.5rem;
        cursor: pointer;
        color: var(--text-primary);
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .theme-toggle:hover {
        background-color: var(--bg-secondary);
        border-color: var(--accent-color);
    }
</style>

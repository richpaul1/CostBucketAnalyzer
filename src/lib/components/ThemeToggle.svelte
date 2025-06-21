<script>
    import { theme } from '$lib/stores/theme';
    import { Sun, Moon } from 'lucide-svelte';
    
    function handleToggle() {
        theme.toggle();
    }
</script>

<button 
    class="theme-toggle" 
    on:click={handleToggle} 
    aria-label="Toggle between light and dark theme"
    title={$theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
>
    {#if $theme === 'light'}
        <Moon size={20} />
        <span class="toggle-text">Dark</span>
    {:else}
        <Sun size={20} />
        <span class="toggle-text">Light</span>
    {/if}
</button>

<style>
    .theme-toggle {
        background: none;
        border: 1px solid var(--border-color);
        border-radius: 6px;
        padding: 0.5rem 0.75rem;
        cursor: pointer;
        color: var(--text-primary);
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        font-weight: 500;
    }
    
    .theme-toggle:hover {
        background-color: var(--bg-secondary);
        border-color: var(--accent-color);
        transform: translateY(-1px);
    }
    
    .theme-toggle:active {
        transform: translateY(0);
    }
    
    .toggle-text {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.025em;
    }
    
    @media (max-width: 768px) {
        .toggle-text {
            display: none;
        }
        
        .theme-toggle {
            padding: 0.5rem;
        }
    }
</style>

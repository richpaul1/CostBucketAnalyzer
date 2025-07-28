<!-- +layout.svelte -->
<script>
    import '../app.css';
    import { onMount } from 'svelte';
    import { theme } from '$lib/stores/theme';
    import Header from '$lib/components/Header.svelte';
    import Sidebar from '$lib/components/Sidebar.svelte';
    import { Menu } from 'lucide-svelte';

    let sidebarOpen = false;

    onMount(() => {
        theme.init();
    });
</script>

<a href="#main-content" class="skip-link">Skip to content</a>
<div class="app">
    <Header>
        <button
            class="mobile-toggle"
            on:click={() => sidebarOpen = !sidebarOpen}
            aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={sidebarOpen}
        >
            <Menu size={24} />
        </button>
    </Header>
    <Sidebar bind:isOpen={sidebarOpen} on:close={() => sidebarOpen = false} />
    <div class="app-body">
        <main class="main-content" id="main-content">
            <slot />
        </main>
    </div>
</div>

<style>
    .app {
        min-height: 100vh;
        background-color: var(--bg-primary);
        display: flex;
        flex-direction: column;
    }
    .app-body {
        min-height: calc(100vh - var(--header-height, 80px));
    }
    .main-content {
        margin-left: 250px;
        flex: 1;
        padding: 2rem;
        max-width: 1200px;
        margin-left: 250px auto;
    }
    .mobile-toggle {
        display: none;
        background: none;
        border: none;
        cursor: pointer;
        padding: 0.5rem;
    }
    .skip-link {
        position: absolute;
        top: -40px;
        left: 0;
        padding: 0.5rem;
        background: var(--bg-primary);
        color: var(--text-secondary);
    }
    .skip-link:focus {
        top: 0;
    }
    @media (max-width: 768px) {
        .mobile-toggle {
            display: block;
        }
        .main-content {
            margin-left: 0;
            padding: 1rem;
        }
    }
</style>
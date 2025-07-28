<!-- Sidebar.svelte -->
<script>
    import { page } from '$app/stores';
    import { Home, Atom, Download, Settings } from 'lucide-svelte';
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();
    export let isOpen = false;

    const navItems = [
        { path: '/', label: 'Home', icon: Home },
        { path: '/upload', label: 'Analyze CCs', icon: Atom },
        { path: '/fetch', label: 'Download CCs', icon: Download },
        { path: '/settings', label: 'Settings', icon: Settings }
    ];

    function closeSidebar() {
        isOpen = false;
        dispatch('close');
    }
</script>

<aside class="sidebar" class:open={isOpen}>
    <nav class="nav">
        {#each navItems as item}
            <a
                href={item.path}
                class="nav-item"
                class:active={$page.url.pathname === item.path}
                on:click={closeSidebar}
                aria-current={$page.url.pathname === item.path ? 'page' : undefined}
            >
                <svelte:component this={item.icon} size={20} />
                <span>{item.label}</span>
            </a>
        {/each}
    </nav>
</aside>

<style>
    .sidebar {
        background-color: var(--bg-secondary);
        border-right: 1px solid var(--border-color);
        width: 250px;
        height: 100vh;
        position: fixed;
        left: 0;
        top: 0;
        padding: 1rem 0;
        overflow-y: auto;
        transition: transform 0.3s ease-in-out;
    }
    .nav {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: 0 1rem;
        margin-top: var(--header-height, 80px);
    }
    .nav-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        border-radius: 6px;
        text-decoration: none;
        color: var(--text-secondary);
        transition: all 0.2s ease;
    }
    .nav-item:hover,
    .nav-item.active {
        background-color: var(--accent-color);
        color: white;
    }
    @media (max-width: 768px) {
        .sidebar {
            transform: translateX(-100%);
        }
        .sidebar.open {
            transform: translateX(0);
        }
    }
</style>
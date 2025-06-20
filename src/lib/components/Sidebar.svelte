<script>
    import { page } from '$app/stores';
    import { Home, Upload, BarChart3, Receipt, Target } from 'lucide-svelte';
    
    const navItems = [
        { path: '/', label: 'Dashboard', icon: Home },
        { path: '/upload', label: 'Upload Data', icon: Upload },
        { path: '/analytics', label: 'Analytics', icon: BarChart3 },
        { path: '/expenses', label: 'Expenses', icon: Receipt },
        { path: '/budget', label: 'Budget Planning', icon: Target }
    ];
</script>

<aside class="sidebar">
    <nav class="nav">
        {#each navItems as item}
            <a 
                href={item.path} 
                class="nav-item"
                class:active={$page.url.pathname === item.path}
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
    }
    
    .nav {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: 0 1rem;
        margin-top: 80px; /* Account for header height */
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
            transition: transform 0.3s ease;
        }
    }
</style>

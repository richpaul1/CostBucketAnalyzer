<script>
    import ThemeToggle from './ThemeToggle.svelte';
    import { Calculator } from 'lucide-svelte';
</script>

<header class="header">
    <div class="container">
        <div class="header-content">
            <div class="brand">
                <Calculator size={24} />
                <h1>Cost Category Analyzer</h1>
            </div>
            <ThemeToggle />
        </div>
    </div>
</header>

<style>
    .header {
        background-color: var(--bg-primary);
        border-bottom: 1px solid var(--border-color);
        position: sticky;
        top: 0;
        z-index: 100;
    }
    
    .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 0;
    }
    
    .brand {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        color: var(--text-primary);
    }
    
    .brand h1 {
        font-size: 1.5rem;
        font-weight: 700;
        margin: 0;
    }
</style>

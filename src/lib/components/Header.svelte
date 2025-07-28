<script>
    import ThemeToggle from "./ThemeToggle.svelte";
    import { Calculator } from "lucide-svelte";
</script>

<header class="header">
    <div class="header-content">
        <ThemeToggle />
        <div class="brand">
            <Calculator size={24} />
            <h2>Cost Category Analyzer</h2>
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
        justify-content: flex-start; /* Shift content to the left */
        align-items: center;
        padding: 1rem 0;
        gap: 1.5rem; /* Add space between brand and ThemeToggle */
    }

    .brand {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    
</style>

<script>
    import '../app.css';
    import { onMount } from 'svelte';
    import { theme } from '$lib/stores/theme';
    import Header from '$lib/components/Header.svelte';
    
    onMount(() => {
        theme.init();
    });
</script>

<div class="app">
    <Header />
    <div class="app-body">
        <main class="main-content">
            <slot />
        </main>
    </div>
</div>

<style>
    .app {
        min-height: 100vh;
        background-color: var(--bg-primary);
    }
    
    .app-body {
        display: flex;
    }
    
    .main-content {
        flex: 1;
        margin-left: 10px;
        padding: 2rem;
        min-height: calc(100vh - 80px);
    }
    
    @media (max-width: 768px) {
        .main-content {
            margin-left: 10px;
            padding: 2rem;
        }
    }
</style>

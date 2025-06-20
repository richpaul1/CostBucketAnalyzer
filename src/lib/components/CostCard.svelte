<script>
    export let title = '';
    export let value = '';
    export let change = '';
    export let changeType = 'neutral'; // 'positive', 'negative', 'neutral'
    export let icon = null;
    export let loading = false;
    export let error = null;
</script>

<div class="cost-card card">
    {#if error}
        <div class="error-state">
            <p>Error loading {title.toLowerCase()}</p>
            <small>{error}</small>
        </div>
    {:else if loading}
        <div class="loading-state">
            <div class="loading-spinner"></div>
            <p>Loading {title.toLowerCase()}...</p>
        </div>
    {:else}
        <div class="card-header">
            {#if icon}
                <div class="card-icon">
                    <svelte:component this={icon} size={24} />
                </div>
            {/if}
            <h3 class="card-title">{title}</h3>
        </div>
        
        <div class="card-content">
            <div class="card-value">{value || 'No data available'}</div>
            {#if change && value}
                <div class="card-change" class:positive={changeType === 'positive'} class:negative={changeType === 'negative'}>
                    {change}
                </div>
            {/if}
        </div>
    {/if}
</div>

<style>
    .cost-card {
        min-height: 120px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }
    
    .card-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1rem;
    }
    
    .card-icon {
        color: var(--accent-color);
    }
    
    .card-title {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.025em;
        margin: 0;
    }
    
    .card-content {
        flex: 1;
    }
    
    .card-value {
        font-size: 2rem;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: 0.5rem;
    }
    
    .card-change {
        font-size: 0.875rem;
        font-weight: 500;
    }
    
    .card-change.positive {
        color: var(--cost-income);
    }
    
    .card-change.negative {
        color: var(--cost-expense);
    }
    
    .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        min-height: 120px;
        color: var(--text-secondary);
    }
    
    .loading-spinner {
        width: 24px;
        height: 24px;
        border: 2px solid var(--border-color);
        border-top: 2px solid var(--accent-color);
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
</style>

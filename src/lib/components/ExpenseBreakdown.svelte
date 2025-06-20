<script>
    import { Receipt } from 'lucide-svelte';
    
    export let categories = [];
    export let loading = false;
    export let error = null;
    
    // Calculate total for percentage calculations
    $: total = categories.reduce((sum, cat) => sum + (cat.amount || 0), 0);
</script>

<div class="expense-breakdown card">
    <div class="breakdown-header">
        <Receipt size={24} />
        <h3>Expense Breakdown</h3>
    </div>
    
    {#if error}
        <div class="error-state">
            <p>Unable to load expense breakdown</p>
            <small>{error}</small>
        </div>
    {:else if loading}
        <div class="loading-state">
            <div class="loading-spinner"></div>
            <p>Loading expense data...</p>
        </div>
    {:else if categories.length === 0}
        <div class="empty-state">
            <h4>No expense data available</h4>
            <p>Upload your cost data to see expense breakdowns</p>
        </div>
    {:else}
        <div class="categories-list">
            {#each categories as category}
                <div class="category-item">
                    <div class="category-info">
                        <div class="category-name">{category.name}</div>
                        <div class="category-amount">${category.amount?.toLocaleString() || '0'}</div>
                    </div>
                    <div class="category-bar">
                        <div 
                            class="category-fill" 
                            style="width: {total > 0 ? (category.amount / total) * 100 : 0}%"
                        ></div>
                    </div>
                    <div class="category-percentage">
                        {total > 0 ? ((category.amount / total) * 100).toFixed(1) : '0'}%
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .breakdown-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1.5rem;
        color: var(--accent-color);
    }
    
    .breakdown-header h3 {
        margin: 0;
        font-size: 1.25rem;
        color: var(--text-primary);
    }
    
    .categories-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    
    .category-item {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 1rem;
        align-items: center;
    }
    
    .category-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
    }
    
    .category-name {
        font-weight: 500;
        color: var(--text-primary);
    }
    
    .category-amount {
        font-weight: 600;
        color: var(--cost-expense);
    }
    
    .category-bar {
        height: 8px;
        background-color: var(--border-color);
        border-radius: 4px;
        overflow: hidden;
        min-width: 100px;
    }
    
    .category-fill {
        height: 100%;
        background-color: var(--cost-expense);
        transition: width 0.3s ease;
    }
    
    .category-percentage {
        font-size: 0.875rem;
        color: var(--text-secondary);
        text-align: right;
        min-width: 40px;
    }
    
    .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        padding: 2rem;
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

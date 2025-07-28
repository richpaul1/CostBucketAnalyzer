<!-- src/routes/fetch/+page.svelte -->
<script>
    import { onMount } from 'svelte';

    let costCategories = [];
    let error = '';
    let loading = false;

    let query = {
        searchKey: '',
        sortType: 'NAME',
        sortOrder: 'ASCENDING',
        limit: 50,
        offset: 0
    };

    async function fetchCostCategories() {
        try {
            loading = true;
            error = '';
            const url = new URL('/api/cost-categories', window.location.origin);
            Object.entries(query).forEach(([key, value]) => url.searchParams.set(key, value));
            const response = await fetch(url);
            if (!response.ok) {
                const { error: serverError } = await response.json();
                throw new Error(serverError || 'Failed to fetch cost categories');
            }
            costCategories = (await response.json()).resource?.businessMappings || [];
        } catch (err) {
            error = 'Failed to load cost categories: ' + err.message;
            costCategories = [];
        } finally {
            loading = false;
        }
    }

    onMount(fetchCostCategories);
</script>

<div class="fetch-container">
    <h1>Download Cost Categories</h1>
    {#if loading}
        <p>Loading...</p>
    {:else if error}
        <p class="error">{error}</p>
    {:else if costCategories.length === 0}
        <p>No cost categories found.</p>
    {:else}
        <table class="category-table">
            <thead>
                <tr>
                    <th>Cost Category</th>
                    <th>Cost Target</th>
                    <th>Rules</th>
                </tr>
            </thead>
            <tbody>
                {#each costCategories as category}
                    {#each category.costTargets as target, targetIndex}
                        {#each target.rules as rule, ruleIndex}
                            <tr>
                                {#if targetIndex === 0 && ruleIndex === 0}
                                    <td rowspan={category.costTargets.reduce((sum, t) => sum + t.rules.length, 0)}>
                                        {category.name}
                                    </td>
                                {/if}
                                {#if ruleIndex === 0}
                                    <td rowspan={target.rules.length}>
                                        {target.name}
                                    </td>
                                {/if}
                                <td>
                                    {#each rule.viewConditions as condition}
                                        <div>
                                            {condition.viewField.fieldName}: {condition.viewOperator} 
                                            [{condition.values.join(', ')}]
                                        </div>
                                    {/each}
                                </td>
                            </tr>
                        {/each}
                    {/each}
                {/each}
            </tbody>
        </table>
    {/if}
    <button on:click={fetchCostCategories} class="refresh-btn">Refresh</button>
</div>

<style>
    .fetch-container {
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem;
    }
    h1 {
        font-size: 1.5rem;
        color: var(--text-secondary);
        margin-bottom: 1.5rem;
    }
    .error {
        color: #ef4444;
        font-size: 0.875rem;
        margin-bottom: 1rem;
    }
    .category-table {
        width: 100%;
        border-collapse: collapse;
        background: var(--bg-secondary);
        color: var(--text-secondary);
        margin-bottom: 1rem;
    }
    th, td {
        padding: 0.75rem;
        border: 1px solid var(--border-color);
        text-align: left;
    }
    th {
        background: var(--accent-color);
        color: white;
    }
    td div {
        margin-bottom: 0.25rem;
    }
    .refresh-btn {
        background-color: var(--accent-color);
        color: white;
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 1rem;
        transition: background-color 0.2s ease;
    }
    .refresh-btn:hover {
        background-color: color-mix(in srgb, var(--accent-color) 80%, black);
    }
</style>
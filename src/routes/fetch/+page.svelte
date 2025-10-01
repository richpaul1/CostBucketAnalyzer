<!-- src/routes/fetch/+page.svelte -->
<script>
    import { onMount } from 'svelte';

    let costCategories = [];
    let error = '';
    let loading = false;
    let selectedCategories = new Set();
    let fullJsonData = null;

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
            const responseData = await response.json();
            fullJsonData = responseData;
            costCategories = responseData.resource?.businessMappings || [];
        } catch (err) {
            error = 'Failed to load cost categories: ' + err.message;
            costCategories = [];
            fullJsonData = null;
        } finally {
            loading = false;
        }
    }

    onMount(fetchCostCategories);

    function toggleCategorySelection(categoryName) {
        if (selectedCategories.has(categoryName)) {
            selectedCategories.delete(categoryName);
        } else {
            selectedCategories.add(categoryName);
        }
        selectedCategories = selectedCategories; // Trigger reactivity
    }

    function selectAllCategories() {
        selectedCategories = new Set(costCategories.map(cat => cat.name));
    }

    function deselectAllCategories() {
        selectedCategories = new Set();
    }

    function downloadFullJson() {
        if (!fullJsonData) {
            error = 'No data available to download';
            return;
        }

        const blob = new Blob([JSON.stringify(fullJsonData, null, 2)], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'cost-categories-full.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    function downloadSelectedCategories() {
        if (selectedCategories.size === 0) {
            error = 'Please select at least one cost category to download';
            return;
        }

        if (!fullJsonData) {
            error = 'No data available to download';
            return;
        }

        // Filter the data to include only selected categories
        const filteredData = {
            ...fullJsonData,
            resource: {
                ...fullJsonData.resource,
                businessMappings: fullJsonData.resource.businessMappings.filter(
                    category => selectedCategories.has(category.name)
                )
            }
        };

        const blob = new Blob([JSON.stringify(filteredData, null, 2)], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `cost-categories-selected-${selectedCategories.size}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
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
        <!-- Download Controls -->
        <div class="download-controls">
            <div class="download-section">
                <h3>📥 Download Options</h3>
                <div class="download-buttons">
                    <button on:click={downloadFullJson} class="download-btn full">
                        📄 Download Full JSON ({costCategories.length} categories)
                    </button>
                    <button
                        on:click={downloadSelectedCategories}
                        class="download-btn selected"
                        disabled={selectedCategories.size === 0}
                    >
                        📦 Download Selected ({selectedCategories.size} categories)
                    </button>
                </div>
            </div>

            <div class="selection-controls">
                <h3>✅ Category Selection</h3>
                <div class="selection-buttons">
                    <button on:click={selectAllCategories} class="select-btn">Select All</button>
                    <button on:click={deselectAllCategories} class="select-btn">Deselect All</button>
                </div>
            </div>
        </div>

        <!-- Category Selection Table -->
        <div class="category-selection">
            <h3>📋 Cost Categories ({costCategories.length} total)</h3>
            <div class="category-grid">
                {#each costCategories as category}
                    <label class="category-checkbox">
                        <input
                            type="checkbox"
                            checked={selectedCategories.has(category.name)}
                            on:change={() => toggleCategorySelection(category.name)}
                        />
                        <span class="category-info">
                            <strong>{category.name}</strong>
                            <small>{category.costTargets?.length || 0} targets</small>
                        </span>
                    </label>
                {/each}
            </div>
        </div>

        <!-- Detailed View Table -->
        <div class="detailed-view">
            <h3>🔍 Detailed Rules View</h3>
            <table class="category-table">
                <thead>
                    <tr>
                        <th>Selected</th>
                        <th>Cost Category</th>
                        <th>Cost Target</th>
                        <th>Rules</th>
                    </tr>
                </thead>
                <tbody>
                    {#each costCategories as category}
                        {#each category.costTargets as target, targetIndex}
                            {#each target.rules as rule, ruleIndex}
                                <tr class:selected={selectedCategories.has(category.name)}>
                                    {#if targetIndex === 0 && ruleIndex === 0}
                                        <td rowspan={category.costTargets.reduce((sum, t) => sum + t.rules.length, 0)}>
                                            <input
                                                type="checkbox"
                                                checked={selectedCategories.has(category.name)}
                                                on:change={() => toggleCategorySelection(category.name)}
                                            />
                                        </td>
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
        </div>
    {/if}

    <div class="action-buttons">
        <button on:click={fetchCostCategories} class="refresh-btn">🔄 Refresh Data</button>
    </div>
</div>

<style>
    .fetch-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
    }

    h1 {
        font-size: 1.5rem;
        color: var(--text-secondary);
        margin-bottom: 1.5rem;
    }

    h3 {
        font-size: 1.1rem;
        color: var(--text-secondary);
        margin-bottom: 1rem;
    }

    .error {
        color: #ef4444;
        font-size: 0.875rem;
        margin-bottom: 1rem;
        padding: 0.75rem;
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 6px;
    }

    /* Download Controls */
    .download-controls {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
        margin-bottom: 2rem;
        padding: 1.5rem;
        background: var(--bg-secondary);
        border-radius: 8px;
        border: 1px solid var(--border-color);
    }

    .download-buttons {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .download-btn {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 1rem;
        font-weight: 500;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .download-btn.full {
        background: var(--accent-color);
        color: white;
    }

    .download-btn.full:hover {
        background: var(--accent-hover);
        transform: translateY(-1px);
    }

    .download-btn.selected {
        background: #10b981;
        color: white;
    }

    .download-btn.selected:hover:not(:disabled) {
        background: #059669;
        transform: translateY(-1px);
    }

    .download-btn:disabled {
        background: #9ca3af;
        cursor: not-allowed;
        transform: none;
    }

    .selection-buttons {
        display: flex;
        gap: 0.5rem;
    }

    .select-btn {
        padding: 0.5rem 1rem;
        background: var(--bg-primary);
        color: var(--text-secondary);
        border: 1px solid var(--border-color);
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.875rem;
        transition: all 0.2s ease;
    }

    .select-btn:hover {
        background: var(--accent-color);
        color: white;
        border-color: var(--accent-color);
    }

    /* Category Selection Grid */
    .category-selection {
        margin-bottom: 2rem;
    }

    .category-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 0.75rem;
        margin-bottom: 1rem;
    }

    .category-checkbox {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem;
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .category-checkbox:hover {
        border-color: var(--accent-color);
        background: var(--bg-hover);
    }

    .category-checkbox input[type="checkbox"] {
        width: 16px;
        height: 16px;
        accent-color: var(--accent-color);
    }

    .category-info {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .category-info strong {
        color: var(--text-primary);
        font-size: 0.9rem;
    }

    .category-info small {
        color: var(--text-secondary);
        font-size: 0.75rem;
    }

    /* Detailed View */
    .detailed-view {
        margin-bottom: 2rem;
    }

    .category-table {
        width: 100%;
        border-collapse: collapse;
        background: var(--bg-secondary);
        color: var(--text-secondary);
        margin-bottom: 1rem;
        border-radius: 8px;
        overflow: hidden;
    }

    th, td {
        padding: 0.75rem;
        border: 1px solid var(--border-color);
        text-align: left;
    }

    th {
        background: var(--accent-color);
        color: white;
        font-weight: 600;
    }

    td div {
        margin-bottom: 0.25rem;
    }

    tr.selected {
        background: rgba(59, 130, 246, 0.1);
        border-left: 3px solid var(--accent-color);
    }

    tr.selected td {
        border-left-color: var(--accent-color);
    }

    /* Action Buttons */
    .action-buttons {
        display: flex;
        justify-content: center;
        gap: 1rem;
        margin-top: 2rem;
    }

    .refresh-btn {
        background-color: var(--accent-color);
        color: white;
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 1rem;
        font-weight: 500;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .refresh-btn:hover {
        background-color: var(--accent-hover);
        transform: translateY(-1px);
    }

    /* Responsive Design */
    @media (max-width: 768px) {
        .download-controls {
            grid-template-columns: 1fr;
            gap: 1rem;
        }

        .category-grid {
            grid-template-columns: 1fr;
        }

        .selection-buttons {
            flex-direction: column;
        }
    }
</style>
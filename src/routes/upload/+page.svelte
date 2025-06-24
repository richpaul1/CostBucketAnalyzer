<script>
    import { Upload, Download } from 'lucide-svelte';
    import { RotateCcw } from 'lucide-svelte';
    import FileUpload from '$lib/components/FileUpload.svelte';
    import TidyTree from '$lib/components/TidyTree.svelte';
    import Anvte from '$lib/components/Anvte.svelte';
    import { getCostCategoriesAsJSON, getConflicts } from '$lib/utilsv2.js';

    let uploadStatus = null;
    let uploadError = null;
    let overlapResults = [];
    let graphData = { nodes: [], links: [] };
    let caseSensitive = false;
    let activeTab = 0;
    let overlapMode = 'all';
    let jsonData = null;

    function handleOverlapModeChange(event) {
        console.log('Selected overlapMode:', event.target.value);
        if (jsonData) {
            const { conflicts, graph } = getConflicts(jsonData, overlapMode);
            overlapResults = conflicts;
            graphData = graph;
            console.log(JSON.stringify(graphData, null, 2));
            console.log('Overlap Results:', overlapResults.length);
        }
    }

    async function handleUpload(files) {
        uploadStatus = 'processing';
        uploadError = null;
        overlapResults = [];
        graphData = { nodes: [], links: [] };

        try {
            jsonData = await getCostCategoriesAsJSON(files[0]);
            const { conflicts, graph } = getConflicts(jsonData, overlapMode);
            overlapResults = conflicts;
            graphData = graph;
            console.log('Overlap Results:', overlapResults.length);
            uploadStatus = 'success';
            activeTab = 1;
        } catch (error) {
            activeTab = 0;
            uploadError = error.message || 'Upload failed. Please try again.';
            uploadStatus = 'error';
        }
    }

    function exportToCSV() {
        if (!overlapResults.length) return;

        const headers = ['Row #', 'Source: Cost Cat', 'Source: Bucket', 'Conflict: Cost Cat', 'Conflict: Bucket', 'Rule Condition', 'Type'];
        const rows = overlapResults.map(result => [
            result.row,
            `"${result.src_cat.replace(/"/g, '""')}"`,
            `"${result.src_bucket.replace(/"/g, '""')}"`,
            `"${result.dest_cat.replace(/"/g, '""')}"`,
            `"${result.dest_bucket.replace(/"/g, '""')}"`,
            `"${result.condition.replace(/"/g, '""')}"`,
            result.type
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'overlapping_rules.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    function resetUpload() {
        console.log('Resetting upload state');
        uploadStatus = null;
        uploadError = null;
        overlapResults = [];
        graphData = { nodes: [], links: [] };
        jsonData = null;
        activeTab = 0;
    }
</script>

<svelte:head>
    <title>Upload Data - CostAnalyzer</title>
</svelte:head>

<div class="upload-page">
    <!-- Horizontal Tabs -->
    <div class="tabs-horizontal">
        <button class:active={activeTab === 0} on:click={() => activeTab = 0}><Upload size={16} /> Upload</button>
        <button class:active={activeTab === 1} on:click={() => activeTab = 1}>Overlapping Rules</button>
        <button class:active={activeTab === 2} on:click={() => activeTab = 2}>Visualization</button>
        <a href="#" class="icon-btn-reset" on:click|preventDefault={resetUpload} aria-label="Reset Upload" title="Reset Upload">
            <RotateCcw size={16} /> Reset
        </a>
    </div>

    <!-- Tab Panels -->
    <div class="tab-panels">
        {#if activeTab === 0}
            <!-- Upload Tab Content -->
            <div class="upload-section">
                <div class="upload-component">
                    <FileUpload
                        multiple={true}
                        acceptedTypes=".json"
                        maxSize={100 * 1024 * 1024}
                        onUpload={handleUpload}
                    />
                </div>
            </div>

            {#if uploadStatus === 'processing'}
                <div class="status-message processing">
                    <div class="loading-spinner"></div>
                    <p>Processing your files... This may take a few moments.</p>
                </div>
            {/if}

            {#if uploadError}
                <div class="status-message error">
                    <h3>Upload Failed</h3>
                    <p>{uploadError}</p>
                    <p>Please check your file format and try again. If the problem persists, contact support.</p>
                    <button class="btn" on:click={() => { uploadStatus = null; uploadError = null; overlapResults = []; graphData = { nodes: [], links: [] }; }}>
                        Try Again
                    </button>
                </div>
            {/if}
        {/if}

        {#if activeTab === 1}
            <!-- Overlapping Rules Tab Content -->
            <div class="tab-content">
                <div class="table-header">
                    <span>Overlapping Rules</span>
                    <div class="table-controls">
                        <button class="btn-export" on:click={exportToCSV} disabled={!overlapResults.length} title="Export to CSV">
                            <Download size={16} /> Export CSV
                        </button>
                        <div class="filter-options">
                            <label style="margin-right: 1rem;">
                                <input
                                    type="radio"
                                    name="overlapMode"
                                    value="all"
                                    bind:group={overlapMode}
                                    on:change={handleOverlapModeChange}
                                />
                                Across All Cost Categories
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="overlapMode"
                                    value="per-category"
                                    bind:group={overlapMode}
                                    on:change={handleOverlapModeChange}
                                />
                                Only Cost Buckets of Each Cost Category
                            </label>
                        </div>
                    </div>
                </div>
                {#if overlapResults.length > 0}
                    <table class="overlap-table">
                        <thead>
                            <tr>
                                <th>Row #</th>
                                <th>Source: Cost Cat</th>
                                <th>Source: Bucket</th>
                                <th>Conflict: Cost Cat</th>
                                <th>Conflict: Bucket</th>
                                <th>Rule Condition</th>
                                <th>Type</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each overlapResults as result}
                                <tr>
                                    <td>{result.row}</td>
                                    <td>{result.src_cat}</td>
                                    <td>{result.src_bucket}</td>
                                    <td>{result.dest_cat}</td>
                                    <td>{result.dest_bucket}</td>
                                    <td>{result.condition}</td>
                                    <td>{result.type}</td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                {:else}
                    <p>No overlapping rules found. Please upload a file first.</p>
                {/if}
            </div>
        {/if}

        {#if activeTab === 2}
            <!-- Visualization Tab Content -->
            <div class="tab-content">
                <h2>Visualization</h2>
                {#if graphData.nodes.length}
                    <p>Visualizing {graphData.nodes.length} nodes and {graphData.links.length} links.</p>
                    <TidyTree {graphData} />
                   
                {:else}
                    <p>No data to visualize. Please upload a file first or use sample data.</p>
                    <!-- Optional: Button to load sample data -->
                    <button class="btn" on:click={() => {
                        graphData = {
                            nodes: [
                                { id: 'root', name: 'Dataset', parent: null },
                                { id: 'cat_Infra', name: 'Infra', parent: 'root' },
                                { id: 'cat_DevOps', name: 'DevOps', parent: 'root' },
                                { id: 'bucket_Infra_EC2', name: 'EC2', parent: 'cat_Infra' },
                                { id: 'bucket_Infra_S3', name: 'S3', parent: 'cat_Infra' },
                                { id: 'bucket_DevOps_Pipeline', name: 'Pipeline', parent: 'cat_DevOps' },
                                { id: 'bucket_DevOps_Monitoring', name: 'Monitoring', parent: 'cat_DevOps' }
                            ],
                            links: [
                                {
                                    source: 'bucket_Infra_EC2',
                                    target: 'bucket_DevOps_Pipeline',
                                    condition: 'Project IN cedlclin-dn-prd-ddev-1366',
                                    type: 'overlap'
                                },
                                {
                                    source: 'bucket_Infra_S3',
                                    target: 'bucket_DevOps_Monitoring',
                                    condition: 'Env IN dev AND Region IN us-east-1',
                                    type: 'overlap'
                                },
                                {
                                    source: 'bucket_Infra_EC2',
                                    target: 'bucket_Infra_EC2',
                                    condition: 'Tag:env=prod',
                                    type: 'duplicate'
                                }
                            ]
                        };
                        activeTab = 2;
                    }}>
                        Load Sample Data
                    </button>
                {/if}
            </div>
        {/if}
    </div>
</div>

<style>
    .upload-page {
        max-width: 95%;
        margin: 0 auto;
        padding: 1rem;
    }
    
    .tabs-horizontal {
        display: flex;
        gap: 1rem;
        margin-bottom: 2rem;
        border-bottom: 2px solid var(--border-color, #e5e7eb);
        align-items: center;
    }
    .tabs-horizontal button {
        padding: 0.75rem 2rem;
        border: none;
        background: var(--bg-secondary, #f3f4f6);
        color: var(--text-primary, #222);
        border-radius: 8px 8px 0 0;
        cursor: pointer;
        font-size: 1rem;
        font-weight: 500;
        transition: background 0.2s, color 0.2s;
        outline: none;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        border-bottom: 2px solid transparent;
        height: 2.5rem;
    }
    .tabs-horizontal button.active {
        background: var(--accent-color, #2563eb);
        color: #fff;
        border-bottom: 2px solid var(--accent-color, #2563eb);
    }
    .icon-btn-reset {
        padding: 0.75rem 2rem;
        background: var(--bg-secondary, #f3f4f6);
        border: none;
        cursor: pointer;
        transition: background 0.2s;
        border-radius: 8px 8px 0 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: var(--text-primary, #222);
        font-size: 1rem;
        font-weight: 500;
        height: 2.5rem;
        text-decoration: none;
    }
    .icon-btn-reset:hover {
        background: var(--bg-hover, #e5e7eb);
    }
    .icon-btn-reset:focus {
        outline: 2px solid var(--accent-color, #2563eb);
        outline-offset: 2px;
        background: var(--bg-secondary, #f3f4f6);
        color: var(--text-primary, #222);
    }
    .tab-panels {
        width: 100%;
    }
    .upload-section {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
        margin-bottom: 2rem;
    }
    .status-message {
        padding: 1.5rem;
        border-radius: 8px;
        margin: 2rem 0;
        text-align: left;
    }
    .status-message.processing {
        background-color: var(--bg-secondary);
        border: 1px solid var(--border-color);
        color: var(--text-secondary);
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    .status-message.error {
        background-color: #fef2f2;
        border: 1px solid #fecaca;
        color: #dc2626;
    }
    [data-theme='dark'] .status-message.error {
        background-color: #450a0a;
        border-color: #7f1d1d;
        color: #f87171;
    }
    .overlap-table {
        width: 100%;
        border-collapse: collapse;
        margin: 1rem 0;
    }
    .overlap-table th,
    .overlap-table td {
        border: 1px solid var(--border-color);
        padding: 0.75rem;
        text-align: left;
        vertical-align: top;
    }
    .overlap-table th {
        background-color: var(--bg-secondary);
        color: var(--text-primary);
        font-weight: bold;
    }
    .table-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }
    .table-controls {
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    .filter-options {
        display: flex;
        gap: 1rem;
    }
    .btn-export, .btn {
        padding: 0.5rem 1rem;
        background: var(--accent-color, #2563eb);
        color: #fff;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
        transition: background 0.2s;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    .btn-export:hover, .btn:hover {
        background: var(--accent-hover, #1e40af);
    }
    .btn-export:disabled {
        background: var(--bg-secondary, #f3f4f6);
        color: var(--text-secondary, #6b7280);
        cursor: not-allowed;
    }
    .loading-spinner {
        width: 24px;
        height: 24px;
        border: 2px solid var(--border-color);
        border-top: 2px solid var(--accent-color);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
    }
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    @media (max-width: 900px) {
        .tabs-horizontal {
            flex-direction: column;
            gap: 0.5rem;
        }
        .tabs-horizontal button {
            border-radius: 8px;
            width: 100%;
            justify-content: flex-start;
        }
        .icon-btn-reset {
            width: 100%;
            justify-content: flex-start;
        }
        .table-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
        }
        .table-controls {
            flex-direction: column;
            align-items: flex-start;
        }
    }
    @media (max-width: 768px) {
        .upload-section {
            grid-template-columns: 1fr;
        }
        .overlap-table {
            font-size: 0.9rem;
        }
        .overlap-table th,
        .overlap-table td {
            padding: 0.5rem;
        }
        .filter-options {
            flex-direction: column;
            gap: 0.5rem;
        }
    }
</style>
<script>
    import { Upload } from 'lucide-svelte';
    import FileUpload from '$lib/components/FileUpload.svelte';
    import { processMappingFiles, findOverlappingRules } from '$lib/utils.js';

    let uploadStatus = null;
    let uploadError = null;
    let overlapResults = [];
    let caseSensitive = false; // Toggle for case-sensitive comparison

    async function handleUpload(files) {
        uploadStatus = 'processing';
        uploadError = null;
        overlapResults = [];

        try {
            // Process the uploaded files to extract mappings
            const mappings = await processMappingFiles(files);
            
            // Find overlapping rules
            overlapResults = findOverlappingRules(mappings, caseSensitive);

            uploadStatus = 'success';
        } catch (error) {
            uploadError = error.message || 'Upload failed. Please try again.';
            uploadStatus = 'error';
        }
    }
</script>

<svelte:head>
    <title>Upload Data - CostAnalyzer</title>
</svelte:head>

<div class="upload-page">
    <div class="page-header">
        <Upload size={32} />
        <div>
            <h1>Upload Cost Data</h1>
            <p>Upload your JSON files to analyze cost category rules for overlaps</p>
        </div>
    </div>

    <div class="upload-section">
        <div class="upload-component">
            <label>
                <input type="checkbox" bind:checked={caseSensitive} />
                Case-sensitive comparison
            </label>
            <FileUpload
                multiple={true}
                acceptedTypes=".json"
                maxSize={10 * 1024 * 1024}
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

    {#if uploadStatus === 'success'}
        <div class="status-message success">
            <h3>Upload Successful!</h3>
            {#if overlapResults.length > 0}
                <p>Found {overlapResults.length} overlapping rule(s):</p>
                <table class="overlap-table">
                    <thead>
                        <tr>
                            <th>Mapping A (Rule)</th>
                            <th>Mapping B (Rule)</th>
                            <th>Overlapping Conditions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each overlapResults as result}
                            <tr>
                                <td>{result.mappingNameA} ({result.ruleIndexA})</td>
                                <td>{result.mappingNameB} ({result.ruleIndexB})</td>
                                <td>
                                    <ul>
                                        {#each result.conditions as condition}
                                            <li>
                                                <strong>Field:</strong> <code>{condition.fieldId}</code><br />
                                                <strong>Operator:</strong> <code>{condition.viewOperator}</code><br />
                                                <strong>Values:</strong> {condition.values.join(', ')}<br />
                                                <strong>Reason:</strong> {condition.reason}
                                            </li>
                                        {/each}
                                    </ul>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            {:else}
                <p>No overlapping rules found.</p>
            {/if}
            <div class="action-buttons">
                <a href="/" class="btn">View Dashboard</a>
                <a href="/analytics" class="btn btn-secondary">Go to Analytics</a>
                <button class="btn" on:click={() => { uploadStatus = null; uploadError = null; overlapResults = []; }}>
                    Upload Another File
                </button>
            </div>
        </div>
    {/if}

    {#if uploadError}
        <div class="status-message error">
            <h3>Upload Failed</h3>
            <p>{uploadError}</p>
            <p>Please check your file format and try again. If the problem persists, contact support.</p>
            <button class="btn" on:click={() => { uploadStatus = null; uploadError = null; overlapResults = []; }}>
                Try Again
            </button>
        </div>
    {/if}
</div>

<style>
    .upload-page {
        max-width: 1000px;
        margin: 0 auto;
        padding: 1rem;
    }
    .page-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 2rem;
        color: var(--accent-color);
    }
    .page-header h1 {
        margin: 0;
        font-size: 2rem;
        color: var(--text-primary);
    }
    .page-header p {
        margin: 0;
        color: var(--text-secondary);
    }
    .upload-section {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
        margin-bottom: 2rem;
    }
    .upload-info ul {
        margin: 1rem 0;
        padding-left: 1.5rem;
    }
    .upload-info li {
        margin-bottom: 0.5rem;
        color: var(--text-secondary);
    }
    .upload-info h3,
    .upload-info h4 {
        color: var(--text-primary);
        margin-bottom: 0.5rem;
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
    .status-message.success {
        background-color: #f0fdf4;
        border: 1px solid #bbf7d0;
        color: #166534;
    }
    [data-theme='dark'] .status-message.success {
        background-color: #064e3b;
        border-color: #065f46;
        color: #34d399;
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
    .overlap-table ul {
        margin: 0;
        padding-left: 1.5rem;
    }
    .overlap-table li {
        margin-bottom: 0.5rem;
    }
    .action-buttons {
        display: flex;
        gap: 1rem;
        justify-content: center;
        margin-top: 1rem;
    }
    .help-section {
        margin-top: 2rem;
    }
    .help-card ul {
        margin: 1rem 0;
        padding-left: 1.5rem;
    }
    .help-card li {
        margin-bottom: 0.5rem;
        color: var(--text-secondary);
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
    @media (max-width: 768px) {
        .upload-section {
            grid-template-columns: 1fr;
        }
        .action-buttons {
            flex-direction: column;
        }
        .overlap-table {
            font-size: 0.9rem;
        }
        .overlap-table th,
        .overlap-table td {
            padding: 0.5rem;
        }
    }
</style>
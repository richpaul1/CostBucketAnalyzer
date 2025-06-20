<script>
    import { Upload } from 'lucide-svelte';
    import FileUpload from '$lib/components/FileUpload.svelte';
    
    let uploadStatus = null;
    let uploadError = null;
    
    async function handleUpload(files) {
        uploadStatus = 'processing';
        uploadError = null;
        
        try {
            // In a real application, this would upload to your backend
            // For now, we'll simulate the process
            console.log('Files to upload:', files);
            
            // Simulate processing time
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Since we don't have a real backend, we'll show a success message
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
            <p>Upload your financial data files to start analyzing your costs</p>
        </div>
    </div>
    
    <div class="upload-section">
        <div class="upload-info card">
            <h3>Supported File Formats</h3>
            <ul>
                <li><strong>CSV Files:</strong> Comma-separated values with cost data</li>
                <li><strong>Excel Files:</strong> .xlsx format with expense sheets</li>
                <li><strong>JSON Files:</strong> Structured cost data in JSON format</li>
            </ul>
            
            <h4>Required Data Fields</h4>
            <p>Your files should include the following columns for best results:</p>
            <ul>
                <li>Date/Period</li>
                <li>Amount/Cost</li>
                <li>Category/Type</li>
                <li>Description (optional)</li>
                <li>Department/Project (optional)</li>
            </ul>
        </div>
        
        <div class="upload-component">
            <FileUpload 
                multiple={true}
                acceptedTypes=".csv,.xlsx,.json"
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
            <p>Your cost data has been processed and is ready for analysis.</p>
            <div class="action-buttons">
                <a href="/" class="btn">View Dashboard</a>
                <a href="/analytics" class="btn btn-secondary">Go to Analytics</a>
            </div>
        </div>
    {/if}
    
    {#if uploadError}
        <div class="status-message error">
            <h3>Upload Failed</h3>
            <p>{uploadError}</p>
            <p>Please check your file format and try again. If the problem persists, contact support.</p>
        </div>
    {/if}
    
    <div class="help-section">
        <div class="help-card card">
            <h3>Need Help?</h3>
            <p>If you're having trouble uploading your data or need help formatting your files:</p>
            <ul>
                <li>Ensure your files are not corrupted or password-protected</li>
                <li>Check that dates are in a standard format (YYYY-MM-DD)</li>
                <li>Verify that numerical values don't contain special characters</li>
                <li>Make sure file sizes are under 10MB</li>
            </ul>
        </div>
    </div>
</div>

<style>
    .upload-page {
        max-width: 800px;
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
        text-align: center;
    }
    
    .status-message.processing {
        background-color: var(--bg-secondary);
        border: 1px solid var(--border-color);
        color: var(--text-secondary);
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
    }
</style>

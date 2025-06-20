<script>
    import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-svelte';
    
    export let multiple = false;
    export let acceptedTypes = '.csv,.xlsx,.json';
    export let maxSize = 10 * 1024 * 1024; // 10MB
    export let onUpload = null;
    
    let files = [];
    let dragOver = false;
    let uploading = false;
    let uploadError = null;
    
    function handleDragOver(event) {
        event.preventDefault();
        dragOver = true;
    }
    
    function handleDragLeave(event) {
        event.preventDefault();
        dragOver = false;
    }
    
    function handleDrop(event) {
        event.preventDefault();
        dragOver = false;
        
        const droppedFiles = Array.from(event.dataTransfer.files);
        handleFiles(droppedFiles);
    }
    
    function handleFileInput(event) {
        const selectedFiles = Array.from(event.target.files);
        handleFiles(selectedFiles);
    }
    
    function handleFiles(newFiles) {
        uploadError = null;
        
        // Validate files
        const validFiles = [];
        const errors = [];
        
        for (const file of newFiles) {
            // Check file size
            if (file.size > maxSize) {
                errors.push(`${file.name}: File too large (max ${maxSize / 1024 / 1024}MB)`);
                continue;
            }
            
            // Check file type
            const extension = '.' + file.name.split('.').pop().toLowerCase();
            if (acceptedTypes && !acceptedTypes.split(',').some(type => type.trim() === extension)) {
                errors.push(`${file.name}: Unsupported file type`);
                continue;
            }
            
            validFiles.push({
                file,
                name: file.name,
                size: file.size,
                status: 'ready'
            });
        }
        
        if (errors.length > 0) {
            uploadError = errors.join('; ');
        }
        
        if (multiple) {
            files = [...files, ...validFiles];
        } else {
            files = validFiles.slice(0, 1);
        }
    }
    
    function removeFile(index) {
        files = files.filter((_, i) => i !== index);
    }
    
    async function uploadFiles() {
        if (files.length === 0 || !onUpload) return;
        
        uploading = true;
        uploadError = null;
        
        try {
            // Update file statuses to uploading
            files = files.map(f => ({ ...f, status: 'uploading' }));
            
            // Call the upload handler
            await onUpload(files.map(f => f.file));
            
            // Update file statuses to complete
            files = files.map(f => ({ ...f, status: 'complete' }));
            
            // Clear files after successful upload
            setTimeout(() => {
                files = [];
            }, 2000);
            
        } catch (error) {
            uploadError = error.message || 'Upload failed';
            files = files.map(f => ({ ...f, status: 'error' }));
        } finally {
            uploading = false;
        }
    }
    
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
</script>

<div class="file-upload">
    <div 
        class="upload-area"
        class:drag-over={dragOver}
        on:dragover={handleDragOver}
        on:dragleave={handleDragLeave}
        on:drop={handleDrop}
        role="button"
        tabindex="0"
    >
        <div class="upload-content">
            <Upload size={48} />
            <h3>Upload Cost Data Files</h3>
            <p>Drag and drop files here, or click to select</p>
            <p class="upload-hint">
                Supported formats: {acceptedTypes}
                • Max size: {maxSize / 1024 / 1024}MB
            </p>
            
            <input 
                type="file" 
                {multiple}
                accept={acceptedTypes}
                on:change={handleFileInput}
                class="file-input"
                disabled={uploading}
            />
            
            <button class="btn" disabled={uploading}>
                Choose Files
            </button>
        </div>
    </div>
    
    {#if uploadError}
        <div class="error-state">
            <AlertCircle size={16} />
            <span>{uploadError}</span>
        </div>
    {/if}
    
    {#if files.length > 0}
        <div class="file-list">
            <h4>Selected Files</h4>
            
            {#each files as fileItem, index}
                <div class="file-item">
                    <div class="file-info">
                        <File size={16} />
                        <div class="file-details">
                            <div class="file-name">{fileItem.name}</div>
                            <div class="file-size">{formatFileSize(fileItem.size)}</div>
                        </div>
                    </div>
                    
                    <div class="file-status">
                        {#if fileItem.status === 'ready'}
                            <button 
                                class="remove-btn" 
                                on:click={() => removeFile(index)}
                                disabled={uploading}
                            >
                                <X size={16} />
                            </button>
                        {:else if fileItem.status === 'uploading'}
                            <div class="loading-spinner"></div>
                        {:else if fileItem.status === 'complete'}
                            <CheckCircle size={16} class="success-icon" />
                        {:else if fileItem.status === 'error'}
                            <AlertCircle size={16} class="error-icon" />
                        {/if}
                    </div>
                </div>
            {/each}
            
            {#if files.some(f => f.status === 'ready')}
                <button 
                    class="btn btn-success upload-btn" 
                    on:click={uploadFiles}
                    disabled={uploading || files.length === 0}
                >
                    {uploading ? 'Uploading...' : 'Upload Files'}
                </button>
            {/if}
        </div>
    {/if}
</div>

<style>
    .file-upload {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    
    .upload-area {
        border: 2px dashed var(--border-color);
        border-radius: 8px;
        padding: 2rem;
        text-align: center;
        transition: all 0.2s ease;
        cursor: pointer;
        position: relative;
    }
    
    .upload-area:hover,
    .upload-area.drag-over {
        border-color: var(--accent-color);
        background-color: var(--bg-secondary);
    }
    
    .upload-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        color: var(--text-secondary);
    }
    
    .upload-content h3 {
        margin: 0;
        color: var(--text-primary);
    }
    
    .upload-hint {
        font-size: 0.875rem;
        color: var(--text-secondary);
    }
    
    .file-input {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        cursor: pointer;
    }
    
    .file-list {
        background-color: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 1rem;
    }
    
    .file-list h4 {
        margin: 0 0 1rem 0;
        color: var(--text-primary);
    }
    
    .file-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem;
        border: 1px solid var(--border-color);
        border-radius: 6px;
        margin-bottom: 0.5rem;
        background-color: var(--bg-primary);
    }
    
    .file-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex: 1;
    }
    
    .file-details {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }
    
    .file-name {
        font-weight: 500;
        color: var(--text-primary);
    }
    
    .file-size {
        font-size: 0.875rem;
        color: var(--text-secondary);
    }
    
    .file-status {
        display: flex;
        align-items: center;
    }
    
    .remove-btn {
        background: none;
        border: none;
        cursor: pointer;
        color: var(--text-secondary);
        padding: 0.25rem;
        border-radius: 4px;
        transition: all 0.2s ease;
    }
    
    .remove-btn:hover {
        background-color: var(--error-color);
        color: white;
    }
    
    .upload-btn {
        margin-top: 1rem;
        width: 100%;
    }
    
    .loading-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid var(--border-color);
        border-top: 2px solid var(--accent-color);
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    :global(.success-icon) {
        color: var(--success-color);
    }
    
    :global(.error-icon) {
        color: var(--error-color);
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
</style>

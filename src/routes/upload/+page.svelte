<script>
    import { Upload, Download } from 'lucide-svelte';
    import { RotateCcw } from 'lucide-svelte';
    import FileUpload from '$lib/components/FileUpload.svelte';
    import TidyTree from '$lib/components/TidyTree.svelte';
    import Anvte from '$lib/components/Anvte.svelte';
    import { getCostCategoriesAsJSON, getConflicts } from '$lib/utilsv2.js';
    import { onMount } from 'svelte';

    let uploadStatus = null;
    let uploadError = null;
    let overlapResults = [];
    let graphData = { nodes: [], links: [] };
    let caseSensitive = false;
    let activeTab = 0;
    let overlapMode = 'all';
    let jsonData = null;
    let settingsAccountId = '';
    let uploadToHarnessStatus = null;
    let modifiedJsonData = null;
    let uploadResults = null;
    let costCategoriesToUpload = [];
    let selectedCategories = new Set();
    let existingCategories = new Map();
    let checkingExistence = false;
    let editableJsonData = null;
    let isJsonValid = true;
    let jsonValidationError = null;

    // Load settings accountId on mount
    onMount(async () => {
        try {
            const response = await fetch('/api/session');
            if (response.ok) {
                const credentials = await response.json();
                settingsAccountId = credentials.accountId || '';
            }
        } catch (err) {
            console.error('Failed to load settings:', err);
        }
    });

    // JSON editing functions
    function validateJsonOnInput() {
        try {
            if (editableJsonData) {
                JSON.parse(editableJsonData);
                isJsonValid = true;
                jsonValidationError = null;
            }
        } catch (error) {
            isJsonValid = false;
            jsonValidationError = error.message;
        }
    }

    function validateAndFormatJson() {
        try {
            if (editableJsonData) {
                const parsed = JSON.parse(editableJsonData);
                editableJsonData = JSON.stringify(parsed, null, 2);
                isJsonValid = true;
                jsonValidationError = null;
            }
        } catch (error) {
            isJsonValid = false;
            jsonValidationError = error.message;
        }
    }

    function resetJsonToOriginal() {
        editableJsonData = JSON.stringify(modifiedJsonData, null, 2);
        isJsonValid = true;
        jsonValidationError = null;
    }

    async function uploadEditedJson() {
        if (!isJsonValid || !editableJsonData) {
            uploadError = 'Please fix JSON validation errors before uploading';
            return;
        }

        try {
            uploadToHarnessStatus = 'uploading';
            uploadError = null;

            const parsedData = JSON.parse(editableJsonData);

            // Update modifiedJsonData with the edited version
            modifiedJsonData = parsedData;

            // Proceed with normal upload process
            await uploadToHarness();

        } catch (error) {
            uploadToHarnessStatus = 'error';
            uploadError = 'Failed to upload edited JSON: ' + error.message;
            console.error('Upload edited JSON error:', error);
        }
    }

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
        uploadToHarnessStatus = null;
        modifiedJsonData = null;
        uploadResults = null;
        costCategoriesToUpload = [];
        selectedCategories = new Set();
        existingCategories = new Map();
        checkingExistence = false;
        activeTab = 0;
    }

    // Function to swap accountId fields in the JSON data
    function swapAccountIds(data, newAccountId) {
        if (!data || !newAccountId) return data;

        // Deep clone the data to avoid modifying the original
        const clonedData = JSON.parse(JSON.stringify(data));

        // Recursively find and replace all accountId fields
        function replaceAccountIds(obj) {
            if (typeof obj !== 'object' || obj === null) return;

            for (const key in obj) {
                if (key === 'accountId' && typeof obj[key] === 'string') {
                    obj[key] = newAccountId;
                } else if (typeof obj[key] === 'object') {
                    replaceAccountIds(obj[key]);
                }
            }
        }

        replaceAccountIds(clonedData);
        return clonedData;
    }

    // Function to count accountId occurrences in the original data
    function countAccountIds(data) {
        if (!data) return 0;

        let count = 0;
        function countInObject(obj) {
            if (typeof obj !== 'object' || obj === null) return;

            for (const key in obj) {
                if (key === 'accountId' && typeof obj[key] === 'string') {
                    count++;
                } else if (typeof obj[key] === 'object') {
                    countInObject(obj[key]);
                }
            }
        }

        countInObject(data);
        return count;
    }

    // Function to prepare cost categories for selection
    function prepareCostCategories() {
        console.log('📋 Preparing cost categories...');

        if (!jsonData || !jsonData.resource || !jsonData.resource.businessMappings) {
            console.log('❌ No valid JSON data found');
            costCategoriesToUpload = [];
            return;
        }

        // Analyze dependencies first
        const dependencyAnalysis = analyzeDependencies(jsonData.resource.businessMappings);

        costCategoriesToUpload = jsonData.resource.businessMappings.map(mapping => {
            const uploadOrder = dependencyAnalysis?.uploadOrder.indexOf(mapping.name) + 1 || 0;
            const dependencies = dependencyAnalysis?.dependencies[mapping.name] || [];

            return {
                name: mapping.name,
                costTargets: mapping.costTargets?.length || 0,
                accountId: mapping.accountId,
                selected: true, // Default to selected
                exists: false,
                action: 'create', // Will be updated after existence check
                uploadOrder: uploadOrder,
                dependencies: dependencies
            };
        });

        // Select all by default
        selectedCategories = new Set(costCategoriesToUpload.map(cat => cat.name));

        console.log('✅ Categories prepared with dependencies:', {
            totalCategories: costCategoriesToUpload.length,
            selectedCategories: Array.from(selectedCategories),
            selectedCount: selectedCategories.size,
            uploadOrder: dependencyAnalysis?.uploadOrder,
            dependencies: dependencyAnalysis?.dependencies
        });

        // Check existence in Harness
        checkCategoryExistence();
    }

    // Function to check if categories already exist in Harness
    async function checkCategoryExistence() {
        if (!costCategoriesToUpload.length) return;

        checkingExistence = true;
        existingCategories.clear();

        try {
            // Fetch existing categories from Harness
            const response = await fetch('/api/cost-categories?limit=100');
            if (!response.ok) {
                throw new Error('Failed to fetch existing categories');
            }

            const result = await response.json();
            const existing = result.resource?.businessMappings || [];

            // Create a map of existing category names
            const existingNames = new Set(existing.map(cat => cat.name));

            // Update our categories with existence info
            costCategoriesToUpload = costCategoriesToUpload.map(cat => ({
                ...cat,
                exists: existingNames.has(cat.name),
                action: existingNames.has(cat.name) ? 'update' : 'create'
            }));

            // Store existing categories for reference
            existing.forEach(cat => {
                existingCategories.set(cat.name, cat);
            });

        } catch (error) {
            console.error('Error checking category existence:', error);
        } finally {
            checkingExistence = false;
        }
    }

    // Function to toggle category selection
    function toggleCategorySelection(categoryName) {
        if (selectedCategories.has(categoryName)) {
            selectedCategories.delete(categoryName);
        } else {
            selectedCategories.add(categoryName);
        }
        selectedCategories = selectedCategories; // Trigger reactivity
    }

    // Function to select/deselect all categories
    function toggleAllCategories(selectAll) {
        if (selectAll) {
            selectedCategories = new Set(costCategoriesToUpload.map(cat => cat.name));
        } else {
            selectedCategories.clear();
        }
        selectedCategories = selectedCategories; // Trigger reactivity
    }

    // Function to analyze dependencies and determine upload order
    function analyzeDependencies(businessMappings) {
        // Create a mapping of UUID to Category Name
        const uuidToCategoryName = {};
        const categoryToUuid = {};

        businessMappings.forEach(mapping => {
            uuidToCategoryName[mapping.uuid] = mapping.name;
            categoryToUuid[mapping.name] = mapping.uuid;
        });

        // Analyze dependencies
        const dependencies = {};

        businessMappings.forEach(mapping => {
            const categoryName = mapping.name;
            dependencies[categoryName] = new Set();

            // Look for references to other cost categories
            if (mapping.costTargets) {
                mapping.costTargets.forEach(target => {
                    if (target.rules) {
                        target.rules.forEach(rule => {
                            if (rule.viewConditions) {
                                rule.viewConditions.forEach(condition => {
                                    if (condition.viewField &&
                                        condition.viewField.identifier === 'BUSINESS_MAPPING' &&
                                        condition.viewField.fieldId) {

                                        const referencedUuid = condition.viewField.fieldId;
                                        const referencedCategory = uuidToCategoryName[referencedUuid];

                                        if (referencedCategory && referencedCategory !== categoryName) {
                                            dependencies[categoryName].add(referencedCategory);
                                        }
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });

        // Topological sort to determine upload order
        const visited = new Set();
        const visiting = new Set();
        const result = [];

        function visit(node) {
            if (visiting.has(node)) {
                return false; // Circular dependency
            }

            if (visited.has(node)) {
                return true;
            }

            visiting.add(node);

            // Visit all dependencies first
            const deps = dependencies[node] || new Set();
            for (const dep of deps) {
                if (!visit(dep)) {
                    return false;
                }
            }

            visiting.delete(node);
            visited.add(node);
            result.push(node);

            return true;
        }

        // Visit all nodes
        for (const node of Object.keys(dependencies)) {
            if (!visit(node)) {
                return null; // Circular dependency
            }
        }

        return {
            uploadOrder: result,
            dependencies: Object.fromEntries(
                Object.entries(dependencies).map(([key, value]) => [key, Array.from(value)])
            )
        };
    }

    // Function to prepare data for Harness upload
    function prepareForHarnessUpload() {
        if (!jsonData || !settingsAccountId) {
            uploadToHarnessStatus = 'error';
            return;
        }

        if (selectedCategories.size === 0) {
            uploadToHarnessStatus = 'error';
            uploadError = 'Please select at least one cost category to upload';
            return;
        }

        uploadToHarnessStatus = 'processing';

        try {
            console.log('🔍 Preparing upload with:', {
                totalCategories: jsonData.resource.businessMappings.length,
                selectedCategories: Array.from(selectedCategories),
                selectedCount: selectedCategories.size
            });

            // Analyze dependencies and determine upload order
            const dependencyAnalysis = analyzeDependencies(jsonData.resource.businessMappings);

            if (!dependencyAnalysis) {
                uploadToHarnessStatus = 'error';
                uploadError = 'Circular dependency detected in cost categories. Cannot determine upload order.';
                return;
            }

            console.log('🔗 Dependency analysis:', dependencyAnalysis);

            // Filter to only selected categories
            let filteredMappings = jsonData.resource.businessMappings.filter(mapping =>
                selectedCategories.has(mapping.name)
            );

            // Order the filtered mappings based on dependencies
            const selectedCategoryNames = filteredMappings.map(m => m.name);
            const orderedCategoryNames = dependencyAnalysis.uploadOrder.filter(name =>
                selectedCategoryNames.includes(name)
            );

            // Reorder the mappings according to dependency order
            const orderedMappings = orderedCategoryNames.map(name =>
                filteredMappings.find(mapping => mapping.name === name)
            );

            console.log('📋 Upload order applied:', {
                originalOrder: filteredMappings.map(m => m.name),
                dependencyOrder: orderedCategoryNames,
                dependencies: dependencyAnalysis.dependencies
            });

            const filteredData = {
                ...jsonData,
                resource: {
                    ...jsonData.resource,
                    businessMappings: orderedMappings
                }
            };

            modifiedJsonData = swapAccountIds(filteredData, settingsAccountId);
            uploadToHarnessStatus = 'ready';
        } catch (error) {
            console.error('Error preparing data for upload:', error);
            uploadToHarnessStatus = 'error';
        }
    }

    // Function to retry upload after errors
    function retryUpload() {
        console.log('🔄 Retrying upload...');
        uploadError = null;
        uploadToHarness();
    }

    // Function to actually upload to Harness
    async function uploadToHarness() {
        if (!modifiedJsonData) return;

        uploadToHarnessStatus = 'uploading';

        try {
            console.log('🚀 Starting upload with data:', {
                selectedCategories: Array.from(selectedCategories),
                dataStructure: modifiedJsonData.resource ? 'has resource' : 'no resource',
                businessMappingsCount: modifiedJsonData.resource?.businessMappings?.length || 0,
                businessMappingNames: modifiedJsonData.resource?.businessMappings?.map(bm => bm.name) || [],
                payloadStructure: {
                    hasBusinessMappings: !!modifiedJsonData.resource?.businessMappings,
                    businessMappingsLength: modifiedJsonData.resource?.businessMappings?.length,
                    businessMappingsType: Array.isArray(modifiedJsonData.resource?.businessMappings) ? 'array' : typeof modifiedJsonData.resource?.businessMappings
                }
            });

            // Upload to Harness using the API
            const response = await fetch('/api/cost-categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'upload',
                    businessMappingData: modifiedJsonData.resource
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to upload to Harness');
            }

            const result = await response.json();
            console.log('Upload result:', result);

            if (result.success) {
                uploadToHarnessStatus = 'success';
                // Store the upload results for display
                uploadResults = result;
            } else {
                uploadToHarnessStatus = 'error';
                uploadError = `Upload completed with errors: ${result.failed}/${result.totalProcessed} failed`;
                // Store detailed error information for display
                uploadResults = result;
            }
        } catch (error) {
            console.error('Error uploading to Harness:', error);
            uploadToHarnessStatus = 'error';
            uploadError = error.message;
        }
    }

    // Reactive statement to prepare cost categories when JSON data changes
    $: if (jsonData) {
        console.log('🔄 Reactive: JSON data changed, preparing categories...');
        prepareCostCategories();
    }
</script>

<svelte:head>
    <title>Upload Data - CostAnalyzer</title>
</svelte:head>

<div class="upload-page" data-theme="dark">
    <!-- Horizontal Tabs -->
    <div class="tabs-horizontal">
        <button class:active={activeTab === 0} on:click={() => activeTab = 0}><Upload size={16} /> Analyze</button>
        <button class:active={activeTab === 1} on:click={() => activeTab = 1}>Overlapping Rules</button>
        <button class:active={activeTab === 2} on:click={() => activeTab = 2}>Upload To Harness</button>
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
                            <label>
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
            <!-- Upload To Harness Tab Content -->
            <div class="tab-content">
                <h2>Upload To Harness</h2>

                {#if !jsonData}
                    <div class="status-message info">
                        <p>📁 Please upload and analyze a JSON file first to enable Harness upload.</p>
                    </div>
                {:else if !settingsAccountId}
                    <div class="status-message warning">
                        <p>⚠️ No Account ID configured. Please set your Account ID in <a href="/settings">Settings</a> first.</p>
                    </div>
                {:else}
                    <div class="harness-upload-section">
                        <!-- Cost Categories Selection Table -->
                        <div class="categories-selection">
                            <h3>📋 Select Cost Categories to Upload</h3>

                            {#if checkingExistence}
                                <div class="status-message processing">
                                    <div class="loading-spinner"></div>
                                    <p>Checking existing categories in Harness...</p>
                                </div>
                            {:else if costCategoriesToUpload.length > 0}
                                <div class="categories-table-container">
                                    <div class="table-controls">
                                        <button class="btn btn-sm" on:click={() => toggleAllCategories(true)}>
                                            Select All
                                        </button>
                                        <button class="btn btn-sm" on:click={() => toggleAllCategories(false)}>
                                            Deselect All
                                        </button>
                                        <span class="selection-count">
                                            {selectedCategories.size} of {costCategoriesToUpload.length} selected
                                        </span>
                                    </div>

                                    <table class="categories-table">
                                        <thead>
                                            <tr>
                                                <th>Select</th>
                                                <th>Upload Order</th>
                                                <th>Category Name</th>
                                                <th>Cost Targets</th>
                                                <th>Dependencies</th>
                                                <th>Status</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {#each costCategoriesToUpload as category}
                                                <tr class:selected={selectedCategories.has(category.name)}>
                                                    <td>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedCategories.has(category.name)}
                                                            on:change={() => toggleCategorySelection(category.name)}
                                                        />
                                                    </td>
                                                    <td class="upload-order">
                                                        {#if selectedCategories.has(category.name) && category.uploadOrder}
                                                            <span class="order-badge">{category.uploadOrder}</span>
                                                        {:else}
                                                            <span class="order-badge disabled">-</span>
                                                        {/if}
                                                    </td>
                                                    <td class="category-name">
                                                        <strong>{category.name}</strong>
                                                    </td>
                                                    <td class="cost-targets-count">
                                                        {category.costTargets}
                                                    </td>
                                                    <td class="dependencies">
                                                        {#if category.dependencies && category.dependencies.length > 0}
                                                            <span class="dependency-list">{category.dependencies.join(', ')}</span>
                                                        {:else}
                                                            <span class="no-dependencies">None</span>
                                                        {/if}
                                                    </td>
                                                    <td class="status-cell">
                                                        {#if category.exists}
                                                            <span class="status-badge exists">Exists</span>
                                                        {:else}
                                                            <span class="status-badge new">New</span>
                                                        {/if}
                                                    </td>
                                                    <td class="action-cell">
                                                        {#if category.exists}
                                                            <span class="action-badge update">Update</span>
                                                        {:else}
                                                            <span class="action-badge create">Create</span>
                                                        {/if}
                                                    </td>
                                                </tr>
                                            {/each}
                                        </tbody>
                                    </table>
                                </div>
                            {/if}
                        </div>

                        <div class="account-id-info">
                            <h3>🔄 Account ID Replacement</h3>
                            <p>The system will automatically replace all <code>accountId</code> fields in your CBP1 data with your configured Account ID:</p>

                            <div class="account-id-preview">
                                <div class="account-id-row">
                                    <span class="label">Current Account ID in data:</span>
                                    <code class="old-account-id">"nMAehCfqRM-9VjvRcSkmVw"</code>
                                </div>
                                <div class="account-id-arrow">↓</div>
                                <div class="account-id-row">
                                    <span class="label">Will be replaced with:</span>
                                    <code class="new-account-id">"{settingsAccountId}"</code>
                                </div>
                            </div>

                            <div class="replacement-stats">
                                <p>📊 <strong>{countAccountIds(jsonData)}</strong> accountId fields will be updated</p>
                                <p>📤 <strong>{selectedCategories.size}</strong> categories selected for upload</p>
                            </div>
                        </div>

                        <div class="upload-actions">
                            {#if uploadToHarnessStatus === 'processing'}
                                <div class="status-message processing">
                                    <div class="loading-spinner"></div>
                                    <p>Preparing data for upload...</p>
                                </div>
                            {:else if uploadToHarnessStatus === 'ready'}
                                <div class="status-message success">
                                    <p>✅ Data prepared successfully! Ready to upload to Harness.</p>
                                </div>
                                <button class="btn btn-success" on:click={uploadToHarness}>
                                    Upload To Harness
                                </button>
                            {:else if uploadToHarnessStatus === 'uploading'}
                                <div class="status-message processing">
                                    <div class="loading-spinner"></div>
                                    <p>Uploading to Harness...</p>
                                </div>
                            {:else if uploadToHarnessStatus === 'success'}
                                <div class="status-message success">
                                    <p>🎉 Successfully uploaded to Harness!</p>
                                    {#if uploadResults}
                                        <div class="upload-summary">
                                            <p><strong>Upload Summary:</strong></p>
                                            <ul>
                                                <li>✅ Successful: {uploadResults.successful}</li>
                                                <li>❌ Failed: {uploadResults.failed}</li>
                                                <li>📊 Total Processed: {uploadResults.totalProcessed}</li>
                                            </ul>
                                            {#if uploadResults.errors && uploadResults.errors.length > 0}
                                                <details>
                                                    <summary>View Errors ({uploadResults.errors.length})</summary>
                                                    <ul class="error-list">
                                                        {#each uploadResults.errors as error}
                                                            <li>{error.name}: {error.error}</li>
                                                        {/each}
                                                    </ul>
                                                </details>
                                            {/if}
                                        </div>
                                    {/if}
                                </div>
                            {:else if uploadToHarnessStatus === 'error'}
                                <div class="status-message error">
                                    <p>❌ {uploadError || 'Error preparing data for upload. Please try again.'}</p>

                                    {#if uploadResults && uploadResults.errors && uploadResults.errors.length > 0}
                                        <div class="error-details">
                                            <h4>Error Details:</h4>
                                            <div class="error-list">
                                                {#each uploadResults.errors as error}
                                                    <div class="error-item">
                                                        <div class="error-header">
                                                            <strong>{error.name}</strong>
                                                            <span class="error-action">({error.action})</span>
                                                        </div>
                                                        <div class="error-message">{error.error}</div>
                                                    </div>
                                                {/each}
                                            </div>
                                        </div>
                                    {/if}

                                    <div class="error-actions">
                                        <button class="btn btn-secondary" on:click={retryUpload}>
                                            🔄 Retry Upload
                                        </button>
                                        <button class="btn btn-outline" on:click={() => uploadToHarnessStatus = 'ready'}>
                                            ← Back to Prepare
                                        </button>
                                    </div>
                                </div>
                            {:else}
                                <button
                                    class="btn btn-primary"
                                    on:click={prepareForHarnessUpload}
                                    disabled={selectedCategories.size === 0}
                                >
                                    Prepare {selectedCategories.size} Categories for Upload
                                </button>
                                {#if selectedCategories.size === 0}
                                    <p class="help-text">Please select at least one cost category to upload.</p>
                                {/if}
                            {/if}
                        </div>

                        {#if modifiedJsonData}
                            <div class="preview-section">
                                <h3>📋 Preview & Edit Modified Data</h3>
                                <div class="json-editor-container">
                                    <div class="editor-controls">
                                        <button
                                            class="btn btn-outline btn-sm"
                                            on:click={() => editableJsonData = JSON.stringify(modifiedJsonData, null, 2)}
                                        >
                                            📝 Edit JSON
                                        </button>
                                        <button
                                            class="btn btn-outline btn-sm"
                                            on:click={validateAndFormatJson}
                                        >
                                            ✅ Validate & Format
                                        </button>
                                        <button
                                            class="btn btn-outline btn-sm"
                                            on:click={resetJsonToOriginal}
                                        >
                                            🔄 Reset to Original
                                        </button>
                                        <button
                                            class="btn btn-primary btn-sm"
                                            on:click={uploadEditedJson}
                                            disabled={!isJsonValid || uploadToHarnessStatus === 'uploading'}
                                        >
                                            🚀 Upload Edited JSON
                                        </button>
                                    </div>

                                    {#if editableJsonData !== null}
                                        <div class="json-editor">
                                            <textarea
                                                bind:value={editableJsonData}
                                                class="json-textarea"
                                                class:error={!isJsonValid}
                                                placeholder="Edit your JSON data here..."
                                                on:input={validateJsonOnInput}
                                            ></textarea>
                                            {#if jsonValidationError}
                                                <div class="validation-error">
                                                    ❌ JSON Error: {jsonValidationError}
                                                </div>
                                            {/if}
                                            {#if isJsonValid && editableJsonData}
                                                <div class="validation-success">
                                                    ✅ JSON is valid ({JSON.parse(editableJsonData).resource?.businessMappings?.length || 0} categories)
                                                </div>
                                            {/if}
                                        </div>
                                    {:else}
                                        <div class="json-preview-readonly">
                                            <h4>📄 Read-Only Preview</h4>
                                            <pre class="json-preview">{JSON.stringify(modifiedJsonData, null, 2)}</pre>
                                        </div>
                                    {/if}
                                </div>
                            </div>
                        {/if}
                    </div>
                {/if}
            </div>
        {/if}
    </div>
</div>

<style>
    /* CSS Custom Properties for Light Theme (default) */
    .upload-page {
        --bg-primary: #ffffff;
        --bg-secondary: #f8f9fa;
        --bg-hover: #e5e7eb;
        --text-primary: #111827;
        --text-secondary: #6b7280;
        --border-color: #e5e7eb;
        --accent-color: #2563eb;
        --accent-hover: #1e40af;
    }

    /* CSS Custom Properties for Dark Theme */
    .upload-page[data-theme='dark'] {
        --bg-primary: #111827;
        --bg-secondary: #1f2937;
        --bg-hover: #374151;
        --text-primary: #f9fafb;
        --text-secondary: #9ca3af;
        --border-color: #4a5568;
        --accent-color: #3b82f6;
        --accent-hover: #2563eb;
    }

    .upload-page {
        max-width: 95%;
        margin: 0 auto;
        padding: 1rem;
        background-color: var(--bg-primary);
        color: var(--text-primary);
        min-height: 100vh;
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

    .error-details {
        margin: 1rem 0;
        padding: 1rem;
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        width: 100%;
    }

    [data-theme='dark'] .error-details {
        background: #1f2937;
        border-color: #374151;
    }

    .error-details h4 {
        margin: 0 0 0.75rem 0;
        font-size: 0.9rem;
        font-weight: 600;
        color: #374151;
    }

    [data-theme='dark'] .error-details h4 {
        color: #d1d5db;
    }

    .error-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .error-item {
        padding: 0.75rem;
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 4px;
        border-left: 4px solid #dc2626;
    }

    [data-theme='dark'] .error-item {
        background: #111827;
        border-color: #374151;
        border-left-color: #ef4444;
    }

    .error-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.25rem;
    }

    .error-header strong {
        color: #111827;
        font-weight: 600;
    }

    [data-theme='dark'] .error-header strong {
        color: #f9fafb;
    }

    .error-action {
        font-size: 0.8rem;
        color: #6b7280;
        font-style: italic;
    }

    [data-theme='dark'] .error-action {
        color: #9ca3af;
    }

    .error-message {
        font-size: 0.85rem;
        color: #dc2626;
        line-height: 1.4;
    }

    [data-theme='dark'] .error-message {
        color: #f87171;
    }

    .error-actions {
        margin-top: 1rem;
        display: flex;
        gap: 0.75rem;
        justify-content: center;
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

    .table-header span {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--text-primary);
    }
    .table-controls {
        display: flex;
        align-items: center;
        gap: 1rem;
        background: var(--bg-secondary);
        padding: 0.75rem;
        border-radius: 6px;
        border: 1px solid var(--border-color);
    }
    .filter-options {
        display: flex;
        gap: 1rem;
    }

    .filter-options label {
        color: var(--text-primary);
        font-weight: 500;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .filter-options input[type="radio"] {
        margin-right: 0.25rem;
        accent-color: var(--accent-color);
    }

    .filter-options label:hover {
        color: var(--accent-color);
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

    /* Upload To Harness Styles */
    .harness-upload-section {
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }

    /* Categories Selection Styles */
    .categories-selection {
        background: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        padding: 1.5rem;
    }

    [data-theme='dark'] .categories-selection {
        background: #2d3748;
        border-color: #4a5568;
    }

    .categories-selection h3 {
        margin: 0 0 1rem 0;
        color: #374151;
    }

    [data-theme='dark'] .categories-selection h3 {
        color: #e5e7eb;
    }

    .categories-table-container {
        margin-top: 1rem;
    }

    .table-controls {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
        padding: 0.75rem;
        background: #ffffff;
        border: 1px solid #dee2e6;
        border-radius: 6px;
    }

    [data-theme='dark'] .table-controls {
        background: #1a202c;
        border-color: #4a5568;
    }

    .table-controls .btn {
        padding: 0.375rem 0.75rem;
        font-size: 0.875rem;
    }

    .selection-count {
        margin-left: auto;
        font-weight: 500;
        color: #6c757d;
    }

    [data-theme='dark'] .selection-count {
        color: #9ca3af;
    }

    .categories-table {
        width: 100%;
        border-collapse: collapse;
        background: #ffffff;
        border: 1px solid #dee2e6;
        border-radius: 6px;
        overflow: hidden;
    }

    [data-theme='dark'] .categories-table {
        background: #1a202c;
        border-color: #4a5568;
    }

    .categories-table th,
    .categories-table td {
        padding: 0.75rem;
        text-align: left;
        border-bottom: 1px solid #dee2e6;
    }

    [data-theme='dark'] .categories-table th,
    [data-theme='dark'] .categories-table td {
        border-bottom-color: #4a5568;
    }

    .categories-table th {
        background: #f8f9fa;
        font-weight: 600;
        color: #495057;
        border-bottom: 2px solid #dee2e6;
    }

    [data-theme='dark'] .categories-table th {
        background: #2d3748;
        color: #e2e8f0;
        border-bottom-color: #4a5568;
    }

    .categories-table tbody tr:hover {
        background: #f8f9fa;
    }

    [data-theme='dark'] .categories-table tbody tr:hover {
        background: #2d3748;
    }

    .categories-table tbody tr.selected {
        background: #e7f3ff;
    }

    [data-theme='dark'] .categories-table tbody tr.selected {
        background: #2a4365;
    }

    .categories-table tbody tr.selected:hover {
        background: #d1ecf1;
    }

    [data-theme='dark'] .categories-table tbody tr.selected:hover {
        background: #3182ce;
    }

    .category-name {
        font-weight: 500;
    }

    .cost-targets-count {
        text-align: center;
        font-weight: 500;
    }

    .status-cell,
    .action-cell {
        text-align: center;
    }

    .status-badge,
    .action-badge {
        display: inline-block;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
    }

    .status-badge.exists {
        background: #fff3cd;
        color: #856404;
        border: 1px solid #ffeaa7;
    }

    .status-badge.new {
        background: #d1ecf1;
        color: #0c5460;
        border: 1px solid #bee5eb;
    }

    .action-badge.update {
        background: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
    }

    .action-badge.create {
        background: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
    }

    /* Dark mode badge styles */
    [data-theme='dark'] .status-badge.exists {
        background: #744210;
        color: #fbbf24;
        border-color: #92400e;
    }

    [data-theme='dark'] .status-badge.new {
        background: #164e63;
        color: #67e8f9;
        border-color: #0891b2;
    }

    [data-theme='dark'] .action-badge.update {
        background: #7f1d1d;
        color: #fca5a5;
        border-color: #991b1b;
    }

    [data-theme='dark'] .action-badge.create {
        background: #14532d;
        color: #86efac;
        border-color: #166534;
    }

    .upload-order {
        text-align: center;
    }

    .order-badge {
        display: inline-block;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: bold;
        background-color: var(--accent-color);
        color: white;
        min-width: 20px;
        text-align: center;
    }

    .order-badge.disabled {
        background-color: var(--border-color);
        color: var(--text-secondary);
    }

    .dependencies {
        font-size: 0.875rem;
    }

    .dependency-list {
        color: var(--warning-color);
        font-weight: 500;
    }

    .no-dependencies {
        color: var(--text-secondary);
        font-style: italic;
    }

    .help-text {
        margin-top: 0.5rem;
        font-size: 0.875rem;
        color: #6c757d;
        font-style: italic;
    }

    [data-theme='dark'] .help-text {
        color: #9ca3af;
    }

    .btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .account-id-info {
        background-color: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 1.5rem;
    }

    .account-id-info h3 {
        margin: 0 0 1rem 0;
        color: var(--text-primary);
    }

    .account-id-preview {
        background-color: var(--bg-primary);
        border: 1px solid var(--border-color);
        border-radius: 6px;
        padding: 1rem;
        margin: 1rem 0;
        text-align: center;
    }

    .account-id-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 0.5rem 0;
    }

    .account-id-row .label {
        font-weight: 500;
        color: var(--text-secondary);
    }

    .old-account-id {
        background-color: #fff3cd;
        color: #856404;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-family: monospace;
    }

    .new-account-id {
        background-color: #d4edda;
        color: #155724;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-family: monospace;
    }

    [data-theme='dark'] .old-account-id {
        background-color: #664d03;
        color: #ffecb5;
    }

    [data-theme='dark'] .new-account-id {
        background-color: #0f5132;
        color: #b6f7c1;
    }

    .account-id-arrow {
        font-size: 1.5rem;
        color: var(--accent-color);
        margin: 0.5rem 0;
    }

    .replacement-stats {
        margin-top: 1rem;
        padding: 0.75rem;
        background-color: var(--bg-primary);
        border-radius: 4px;
        border-left: 4px solid var(--accent-color);
    }

    .upload-actions {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        align-items: center;
    }

    .preview-section {
        background-color: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 1.5rem;
    }

    .preview-section h3 {
        margin: 0 0 1rem 0;
        color: var(--text-primary);
    }

    .json-preview {
        background-color: var(--bg-primary);
        border: 1px solid var(--border-color);
        border-radius: 4px;
        padding: 1rem;
        font-family: monospace;
        font-size: 0.875rem;
        overflow-x: auto;
        max-height: 300px;
        overflow-y: auto;
        color: var(--text-primary);
    }

    /* JSON Editor Styles */
    .json-editor-container {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .editor-controls {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
        align-items: center;
        padding: 1rem;
        background: var(--bg-primary);
        border-radius: 6px;
        border: 1px solid var(--border-color);
    }

    .btn-sm {
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
    }

    .json-editor {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .json-textarea {
        width: 100%;
        min-height: 400px;
        max-height: 600px;
        padding: 1rem;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 0.875rem;
        line-height: 1.4;
        background: var(--bg-primary);
        color: var(--text-primary);
        border: 2px solid var(--border-color);
        border-radius: 6px;
        resize: vertical;
        transition: border-color 0.2s ease;
    }

    .json-textarea:focus {
        outline: none;
        border-color: var(--accent-color);
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .json-textarea.error {
        border-color: #ef4444;
        background: #fef2f2;
    }

    .validation-error {
        padding: 0.75rem;
        background: #fef2f2;
        color: #dc2626;
        border: 1px solid #fecaca;
        border-radius: 4px;
        font-size: 0.875rem;
        font-family: monospace;
    }

    .validation-success {
        padding: 0.75rem;
        background: #f0fdf4;
        color: #16a34a;
        border: 1px solid #bbf7d0;
        border-radius: 4px;
        font-size: 0.875rem;
    }

    .json-preview-readonly {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .json-preview-readonly h4 {
        margin: 0;
        color: var(--text-secondary);
        font-size: 1rem;
    }

    .status-message.info {
        background-color: #cce7ff;
        border: 1px solid #99d3ff;
        color: #0066cc;
    }

    .status-message.warning {
        background-color: #fff3cd;
        border: 1px solid #ffeaa7;
        color: #856404;
    }

    [data-theme='dark'] .status-message.info {
        background-color: #1a365d;
        border-color: #2c5282;
        color: #90cdf4;
    }

    [data-theme='dark'] .status-message.warning {
        background-color: #744210;
        border-color: #975a16;
        color: #f6e05e;
    }

    .btn-primary {
        background-color: var(--accent-color);
        color: white;
    }

    .btn-primary:hover {
        background-color: var(--accent-hover);
    }

    .btn-success {
        background-color: #28a745;
        color: white;
    }

    .btn-success:hover {
        background-color: #218838;
    }

    .upload-summary {
        margin-top: 1rem;
        padding: 1rem;
        background-color: var(--bg-primary);
        border: 1px solid var(--border-color);
        border-radius: 6px;
    }

    .upload-summary ul {
        margin: 0.5rem 0;
        padding-left: 1.5rem;
    }

    .upload-summary li {
        margin: 0.25rem 0;
    }

    .error-list {
        background-color: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 4px;
        padding: 0.5rem;
        margin-top: 0.5rem;
        max-height: 200px;
        overflow-y: auto;
    }

    .error-list li {
        font-family: monospace;
        font-size: 0.875rem;
        color: var(--text-secondary);
    }
</style>
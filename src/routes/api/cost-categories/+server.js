// src/routes/api/cost-categories/+server.js
import { json } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
/*************  ✨ Windsurf Command 🌟  *************/
export async function GET({ url, locals }) {
    try {
        // Get credentials from session
        const { accountId, apiKey } = locals.session.credentials || {};
        if (!accountId || !apiKey) {
            return json({ error: 'Credentials not set. Please configure in Settings.' }, { status: 401 });
        }

        // Get query parameters from the request URL
        const searchKey = url.searchParams.get('searchKey') || '';
        const sortType = url.searchParams.get('sortType') || 'NAME';
        const sortOrder = url.searchParams.get('sortOrder') || 'ASCENDING';
        const limit = parseInt(url.searchParams.get('limit') || '0', 10);
        const offset = parseInt(url.searchParams.get('offset') || '0', 10);

        // Build the Harness CCM API URL
        const apiUrl = new URL('https://app.harness.io/ccm/api/business-mapping');
        apiUrl.searchParams.set('accountIdentifier', accountId);
        if (searchKey) apiUrl.searchParams.set('searchKey', searchKey);
        apiUrl.searchParams.set('sortType', sortType);
        apiUrl.searchParams.set('sortOrder', sortOrder);
        apiUrl.searchParams.set('limit', limit.toString());
        apiUrl.searchParams.set('offset', offset.toString());

        // Make the API call
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'x-api-key': apiKey
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            return json({ error: errorData.message || 'Failed to fetch cost categories' }, { status: response.status });
        }

        const data = await response.json();
        console.log('Cost categories fetched:', JSON.stringify(data, null, 2)); // Debug log
        return json(data);
    } catch (error) {
        console.error('Error fetching cost categories:', error);
        return json({ error: 'Internal server error: ' + error.message }, { status: 500 });
    }
}



// Helper function to validate and fix business mapping data
function validateAndFixBusinessMapping(businessMappingData) {
    const fixedData = JSON.parse(JSON.stringify(businessMappingData)); // Deep clone
    let issuesFixed = [];

    // 1. Ensure main business mapping has uuid (generate if missing)
    if (!fixedData.uuid) {
        fixedData.uuid = crypto.randomUUID();
        issuesFixed.push(`Generated missing main UUID: ${fixedData.uuid}`);
    }

    // 2. Ensure unallocatedCost field exists
    if (!fixedData.unallocatedCost) {
        fixedData.unallocatedCost = {
            strategy: "DISPLAY_NAME",
            label: "Unallocated"
        };
        issuesFixed.push('Added missing unallocatedCost field');
    }

    // 3. Fix cost targets
    if (fixedData.costTargets && Array.isArray(fixedData.costTargets)) {
        fixedData.costTargets.forEach((target, index) => {
            // Generate UUID if missing or empty
            if (!target.uuid || target.uuid === "") {
                target.uuid = crypto.randomUUID();
                issuesFixed.push(`Generated missing UUID for cost target "${target.name}": ${target.uuid}`);
            }

            // Ensure rules exist
            if (!target.rules) {
                target.rules = [];
                issuesFixed.push(`Added missing rules array for cost target "${target.name}"`);
            }

            // Fix rules if they exist
            if (target.rules && Array.isArray(target.rules)) {
                target.rules.forEach((rule, ruleIndex) => {
                    // Generate rule UUID if missing
                    if (!rule.uuid) {
                        rule.uuid = crypto.randomUUID();
                        issuesFixed.push(`Generated missing UUID for rule ${ruleIndex + 1} in "${target.name}": ${rule.uuid}`);
                    }

                    // Ensure viewConditions exist
                    if (!rule.viewConditions) {
                        rule.viewConditions = [];
                        issuesFixed.push(`Added missing viewConditions for rule in "${target.name}"`);
                    }

                    // Fix viewConditions
                    if (rule.viewConditions && Array.isArray(rule.viewConditions)) {
                        rule.viewConditions.forEach((condition, conditionIndex) => {
                            // Generate condition UUID if missing
                            if (!condition.uuid) {
                                condition.uuid = crypto.randomUUID();
                                issuesFixed.push(`Generated missing UUID for condition ${conditionIndex + 1} in "${target.name}": ${condition.uuid}`);
                            }
                        });
                    }
                });
            }
        });
    }

    return { fixedData, issuesFixed };
}

// Helper function to create a single business mapping
async function createBusinessMapping(accountId, apiKey, businessMappingData) {
    try {
        // Validate and fix the business mapping data
        const { fixedData, issuesFixed } = validateAndFixBusinessMapping(businessMappingData);

        if (issuesFixed.length > 0) {
            console.log('🔧 Fixed business mapping issues:', issuesFixed);
        }

        // Build the Harness CCM API URL for creating business mapping
        const apiUrl = new URL('https://app.harness.io/ccm/api/business-mapping');
        apiUrl.searchParams.set('accountIdentifier', accountId);

        console.log('Creating business mapping (validated and fixed):', JSON.stringify(fixedData, null, 2));

        // Make the API call to create business mapping
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(fixedData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Create business mapping error:', errorData);

            // Enhance error message with fix information
            let enhancedError = errorData.message || 'Failed to create business mapping';
            if (issuesFixed.length > 0) {
                enhancedError += `\n\nNote: The following issues were automatically fixed:\n${issuesFixed.map(fix => `• ${fix}`).join('\n')}`;
            }

            return json({
                error: enhancedError,
                details: errorData,
                fixesApplied: issuesFixed
            }, { status: response.status });
        }

        const data = await response.json();
        console.log('Business mapping created successfully:', JSON.stringify(data, null, 2));

        // Include fix information in success response
        const successResponse = {
            ...data,
            fixesApplied: issuesFixed.length > 0 ? issuesFixed : undefined
        };

        return json(successResponse);
    } catch (error) {
        console.error('Error creating business mapping:', error);
        return json({ error: 'Internal server error: ' + error.message }, { status: 500 });
    }
}

// Helper function to update a single business mapping
async function updateBusinessMapping(accountId, apiKey, businessMappingData) {
    try {
        // Validate and fix the business mapping data
        const { fixedData, issuesFixed } = validateAndFixBusinessMapping(businessMappingData);

        if (issuesFixed.length > 0) {
            console.log('🔧 Fixed business mapping issues for update:', issuesFixed);
        }

        // Build the Harness CCM API URL for updating business mapping
        const apiUrl = new URL('https://app.harness.io/ccm/api/business-mapping');
        apiUrl.searchParams.set('accountIdentifier', accountId);

        console.log('Updating business mapping (validated and fixed):', JSON.stringify(fixedData, null, 2));

        // Make the API call to update business mapping
        const response = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(fixedData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Update business mapping error:', errorData);
            return json({
                error: errorData.message || 'Failed to update business mapping',
                details: errorData
            }, { status: response.status });
        }

        const data = await response.json();
        console.log('Business mapping updated successfully:', JSON.stringify(data, null, 2));
        return json(data);
    } catch (error) {
        console.error('Error updating business mapping:', error);
        return json({ error: 'Internal server error: ' + error.message }, { status: 500 });
    }
}

// Helper function to enhance error messages by resolving UUIDs to Cost Category names
function enhanceErrorMessageWithCategoryNames(errorMessage, businessMappingsData) {
    if (!errorMessage || !businessMappingsData || !businessMappingsData.businessMappings) {
        return errorMessage;
    }

    // Create a mapping of UUID to Category Name
    const uuidToCategoryName = {};
    businessMappingsData.businessMappings.forEach(mapping => {
        if (mapping.uuid && mapping.name) {
            uuidToCategoryName[mapping.uuid] = mapping.name;
        }
    });

    // Enhanced error message
    let enhancedMessage = errorMessage;

    // Look for UUID patterns in the error message and replace them with names
    Object.entries(uuidToCategoryName).forEach(([uuid, categoryName]) => {
        // Replace UUID with "UUID (CategoryName)" format
        const uuidRegex = new RegExp(uuid, 'g');
        enhancedMessage = enhancedMessage.replace(uuidRegex, `${uuid} (${categoryName})`);
    });

    // Also look for common error patterns and enhance them
    // Pattern: "No Cost Category exists with ID 'UUID'"
    const costCategoryPattern = /No Cost Category exists with ID '([^']+)'/g;
    enhancedMessage = enhancedMessage.replace(costCategoryPattern, (match, uuid) => {
        const categoryName = uuidToCategoryName[uuid];
        if (categoryName) {
            return `No Cost Category exists with ID '${uuid}' (${categoryName})`;
        }
        return match;
    });

    return enhancedMessage;
}

// Helper function to upload multiple business mappings (batch operation)
async function uploadBusinessMappings(accountId, apiKey, businessMappingsData) {
    try {
        const results = [];
        const errors = [];

        console.log('📦 Upload data received:', {
            hasBusinessMappings: !!businessMappingsData.businessMappings,
            businessMappingsCount: businessMappingsData.businessMappings?.length || 0,
            businessMappingsType: typeof businessMappingsData.businessMappings,
            dataKeys: Object.keys(businessMappingsData || {}),
            firstLevelKeys: businessMappingsData ? Object.keys(businessMappingsData) : [],
            sampleData: JSON.stringify(businessMappingsData, null, 2).substring(0, 500)
        });

        // Process each business mapping
        for (const businessMapping of businessMappingsData.businessMappings || []) {
            try {
                // Check if business mapping already exists by name
                const existingMapping = await checkBusinessMappingExists(accountId, apiKey, businessMapping.name);

                let result;
                if (existingMapping) {
                    // Update existing mapping
                    businessMapping.uuid = existingMapping.uuid; // Ensure we have the UUID for update
                    result = await updateBusinessMapping(accountId, apiKey, businessMapping);
                } else {
                    // Create new mapping
                    result = await createBusinessMapping(accountId, apiKey, businessMapping);
                }

                if (result.status === 200 || result.status === 201) {
                    results.push({
                        name: businessMapping.name,
                        action: existingMapping ? 'updated' : 'created',
                        success: true,
                        data: await result.json()
                    });
                } else {
                    const errorData = await result.json();
                    console.error(`${existingMapping ? 'Update' : 'Create'} business mapping error:`, errorData);

                    // Extract detailed error message from Harness API response
                    let errorMessage = 'Unknown error';
                    if (errorData.message) {
                        errorMessage = errorData.message;
                    } else if (errorData.responseMessages && errorData.responseMessages.length > 0) {
                        errorMessage = errorData.responseMessages[0].message;
                    } else if (errorData.error) {
                        errorMessage = errorData.error;
                    }

                    // Enhance error message by resolving UUIDs to Cost Category names
                    errorMessage = enhanceErrorMessageWithCategoryNames(errorMessage, businessMappingsData);

                    errors.push({
                        name: businessMapping.name,
                        action: existingMapping ? 'update' : 'create',
                        success: false,
                        error: errorMessage,
                        details: errorData // Store full error details for debugging
                    });
                }
            } catch (error) {
                errors.push({
                    name: businessMapping.name || 'Unknown',
                    action: 'process',
                    success: false,
                    error: error.message
                });
            }
        }

        console.log('📊 Upload completed:', {
            totalProcessed: results.length + errors.length,
            successful: results.length,
            failed: errors.length,
            resultsCount: results.length,
            errorsCount: errors.length
        });

        return json({
            success: errors.length === 0,
            totalProcessed: results.length + errors.length,
            successful: results.length,
            failed: errors.length,
            results,
            errors
        });
    } catch (error) {
        console.error('Error uploading business mappings:', error);
        return json({ error: 'Internal server error: ' + error.message }, { status: 500 });
    }
}

// Helper function to check if a business mapping exists
async function checkBusinessMappingExists(accountId, apiKey, mappingName) {
    try {
        const apiUrl = new URL('https://app.harness.io/ccm/api/business-mapping');
        apiUrl.searchParams.set('accountIdentifier', accountId);
        apiUrl.searchParams.set('searchKey', mappingName);
        apiUrl.searchParams.set('limit', '1');

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'x-api-key': apiKey
            }
        });

        if (response.ok) {
            const data = await response.json();
            const mappings = data.resource?.businessMappings || [];
            return mappings.find(mapping => mapping.name === mappingName);
        }
        return null;
    } catch (error) {
        console.error('Error checking business mapping existence:', error);
        return null;
    }
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
    try {
        // Get the request body first
        const body = await request.json();
        const { action, businessMappingData } = body;

        // Handle debug action without authentication
        if (action === 'debug') {
            console.log('🐛 DEBUG: Received data structure:', {
                hasBusinessMappingData: !!businessMappingData,
                businessMappingDataType: typeof businessMappingData,
                businessMappingDataKeys: businessMappingData ? Object.keys(businessMappingData) : [],
                hasBusinessMappings: !!businessMappingData?.businessMappings,
                businessMappingsCount: businessMappingData?.businessMappings?.length || 0,
                businessMappingsType: typeof businessMappingData?.businessMappings,
                sampleData: JSON.stringify(businessMappingData, null, 2).substring(0, 500)
            });
            return json({
                success: true,
                debug: true,
                received: {
                    hasBusinessMappings: !!businessMappingData?.businessMappings,
                    businessMappingsCount: businessMappingData?.businessMappings?.length || 0,
                    dataStructure: businessMappingData ? Object.keys(businessMappingData) : []
                }
            });
        }

        // Get credentials from session for other actions
        const { accountId, apiKey } = locals.session.credentials || {};
        if (!accountId || !apiKey) {
            return json({ error: 'Credentials not set. Please configure in Settings.' }, { status: 401 });
        }

        // Handle different POST actions
        if (action === 'create') {
            // Create a single business mapping
            return await createBusinessMapping(accountId, apiKey, businessMappingData);
        } else if (action === 'upload') {
            // Upload multiple business mappings (batch operation)
            return await uploadBusinessMappings(accountId, apiKey, businessMappingData);
        } else {
            // Default behavior - search/filter cost categories
            const { searchKey, sortType, sortOrder, limit, offset } = body;

            // Build the Harness CCM API URL
            const apiUrl = new URL('https://app.harness.io/ccm/api/business-mapping');
            apiUrl.searchParams.set('accountIdentifier', accountId);
            if (searchKey) apiUrl.searchParams.set('searchKey', searchKey);
            apiUrl.searchParams.set('sortType', sortType || 'NAME');
            apiUrl.searchParams.set('sortOrder', sortOrder || 'ASCENDING');
            apiUrl.searchParams.set('limit', (limit || 0).toString());
            apiUrl.searchParams.set('offset', (offset || 0).toString());

            // Make the API call
            const response = await fetch(apiUrl, {
                method: 'GET', // Use GET for search/filter operations
                headers: {
                    'x-api-key': apiKey
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                return json({ error: errorData.message || 'Failed to fetch cost categories' }, { status: response.status });
            }

            const data = await response.json();
            console.log('Cost categories fetched:', JSON.stringify(data, null, 2));
            return json(data);
        }
    } catch (error) {
        console.error('Error in POST cost categories:', error);
        return json({ error: 'Internal server error: ' + error.message }, { status: 500 });
    }
}

/** @type {import('./$types').RequestHandler} */
export async function PUT({ request, locals }) {
    try {
        // Get credentials from session
        const { accountId, apiKey } = locals.session.credentials || {};
        if (!accountId || !apiKey) {
            return json({ error: 'Credentials not set. Please configure in Settings.' }, { status: 401 });
        }

        // Get the request body
        const businessMappingData = await request.json();

        // Update the business mapping
        return await updateBusinessMapping(accountId, apiKey, businessMappingData);
    } catch (error) {
        console.error('Error in PUT cost categories:', error);
        return json({ error: 'Internal server error: ' + error.message }, { status: 500 });
    }
}

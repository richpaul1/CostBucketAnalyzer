#!/usr/bin/env node

// Simple test to debug the upload issue
import fs from 'fs';

async function testUploadSimple() {
    try {
        console.log('🧪 Testing upload with simple data...');
        
        // Load actual CBP1 data to test
        const cbp1Data = JSON.parse(fs.readFileSync('costcat/cbp1-cleaned.json', 'utf8'));

        // First, let's see what category names actually exist
        const actualCategoryNames = cbp1Data.resource.businessMappings.map(bm => bm.name);
        console.log('📋 Actual category names in data:', actualCategoryNames);

        // Simulate what the UI does - filter selected categories (using actual names)
        const selectedCategories = new Set(actualCategoryNames); // Select all available
        const filteredBusinessMappings = cbp1Data.resource.businessMappings.filter(
            mapping => selectedCategories.has(mapping.name)
        );

        console.log('🔍 Filtered data:', {
            originalCount: cbp1Data.resource.businessMappings.length,
            filteredCount: filteredBusinessMappings.length,
            selectedCategories: Array.from(selectedCategories),
            filteredNames: filteredBusinessMappings.map(m => m.name),
            shouldMatch: filteredBusinessMappings.length === cbp1Data.resource.businessMappings.length
        });

        // Create test payload that matches what the UI sends
        const testPayload = {
            action: 'debug',  // Use debug to see data structure
            businessMappingData: {
                businessMappings: filteredBusinessMappings
            }
        };

        console.log('📤 Test payload:', JSON.stringify(testPayload, null, 2));

        // Make the request to localhost (this will fail due to auth, but we can see the debug logs)
        try {
            const response = await fetch('http://localhost:5002/api/cost-categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(testPayload)
            });

            console.log('📡 Response status:', response.status);
            const result = await response.json();
            console.log('📋 Response:', result);
        } catch (fetchError) {
            console.log('⚠️ Fetch failed (expected):', fetchError.message);
        }

        console.log('\n✅ Test completed - check server logs for debug output');

    } catch (error) {
        console.error('💥 Test failed:', error.message);
    }
}

testUploadSimple();

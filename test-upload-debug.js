#!/usr/bin/env node

// Test script to debug the upload functionality
import fs from 'fs';

async function testUpload() {
    try {
        console.log('🧪 Testing upload functionality...');
        
        // Load test data
        const testData = JSON.parse(fs.readFileSync('costcat/cbp1-cleaned.json', 'utf8'));
        console.log('📁 Loaded test data:', {
            businessMappingsCount: testData.resource?.businessMappings?.length || 0,
            categories: testData.resource?.businessMappings?.map(bm => bm.name) || []
        });

        // Simulate the upload request
        const uploadData = {
            action: 'upload',
            businessMappingData: testData.resource
        };

        console.log('📤 Upload payload structure:', {
            action: uploadData.action,
            hasBusinessMappings: !!uploadData.businessMappingData?.businessMappings,
            businessMappingsCount: uploadData.businessMappingData?.businessMappings?.length || 0
        });

        // Make the request
        const response = await fetch('http://localhost:5002/api/cost-categories', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(uploadData)
        });

        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ Upload failed:', errorData);
            return;
        }

        const result = await response.json();
        console.log('✅ Upload result:', JSON.stringify(result, null, 2));

    } catch (error) {
        console.error('💥 Test failed:', error.message);
    }
}

testUpload();

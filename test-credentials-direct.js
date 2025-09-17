#!/usr/bin/env node

// Direct test of Harness API credentials
// This bypasses the local API and tests directly with Harness

import { TEST_CREDENTIALS } from './config/test-credentials.js';

async function testHarnessCredentials() {
    console.log('🔧 Testing Harness Credentials Directly');
    console.log('='.repeat(50));
    
    const { accountId, apiKey } = TEST_CREDENTIALS;
    
    console.log(`Account ID: ${accountId}`);
    console.log(`API Key: ${apiKey.substring(0, 20)}...`);
    console.log('');
    
    // Test 1: Basic API connectivity
    console.log('1️⃣ Testing basic API connectivity...');
    
    try {
        const apiUrl = new URL('https://app.harness.io/ccm/api/business-mapping');
        apiUrl.searchParams.set('accountIdentifier', accountId);
        apiUrl.searchParams.set('limit', '1');
        
        console.log(`API URL: ${apiUrl}`);
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`Response Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ API connectivity successful!');
            console.log(`Found ${data.resource?.businessMappings?.length || 0} business mappings`);
            
            if (data.resource?.businessMappings?.length > 0) {
                console.log('Sample categories:');
                data.resource.businessMappings.slice(0, 3).forEach((mapping, index) => {
                    console.log(`  ${index + 1}. ${mapping.name} (${mapping.costTargets?.length || 0} targets)`);
                });
            }
        } else {
            const errorData = await response.text();
            console.log('❌ API connectivity failed');
            console.log(`Error: ${errorData}`);
            
            // Try to parse as JSON for better error info
            try {
                const errorJson = JSON.parse(errorData);
                console.log('Error details:', JSON.stringify(errorJson, null, 2));
            } catch (e) {
                console.log('Raw error response:', errorData);
            }
        }
        
    } catch (error) {
        console.log('❌ Network error:', error.message);
    }
    
    console.log('');
    
    // Test 2: Test local API with session
    console.log('2️⃣ Testing local API with session...');
    
    try {
        // First, set up session
        const sessionResponse = await fetch('http://localhost:5002/api/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accountId, apiKey })
        });
        
        if (sessionResponse.ok) {
            console.log('✅ Session created successfully');
            
            // Now test the cost categories API
            const costCategoriesResponse = await fetch('http://localhost:5002/api/cost-categories?limit=1');
            
            console.log(`Local API Status: ${costCategoriesResponse.status} ${costCategoriesResponse.statusText}`);
            
            if (costCategoriesResponse.ok) {
                const data = await costCategoriesResponse.json();
                console.log('✅ Local API working!');
                console.log(`Found ${data.resource?.businessMappings?.length || 0} business mappings via local API`);
            } else {
                const errorData = await costCategoriesResponse.json();
                console.log('❌ Local API failed');
                console.log('Error:', errorData);
            }
        } else {
            const sessionError = await sessionResponse.json();
            console.log('❌ Session creation failed');
            console.log('Error:', sessionError);
        }
        
    } catch (error) {
        console.log('❌ Local API error:', error.message);
    }
    
    console.log('');
    console.log('🎯 Next Steps:');
    if (response && response.ok) {
        console.log('✅ Credentials are working! You can now run:');
        console.log('   npm run test:functional');
    } else {
        console.log('❌ Please check:');
        console.log('   1. Account ID is correct');
        console.log('   2. API Key is valid and not expired');
        console.log('   3. API Key has cost management permissions');
        console.log('   4. Network connectivity to Harness');
    }
}

testHarnessCredentials().catch(error => {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
});

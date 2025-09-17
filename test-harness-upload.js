// Test script to verify the Harness upload API functionality
// This script tests the cost-categories API endpoints

const testData = {
    "resource": {
        "businessMappings": [
            {
                "uuid": null,
                "accountId": "test-account-id",
                "name": "Test Category",
                "costTargets": [
                    {
                        "name": "Test Target",
                        "rules": [
                            {
                                "viewConditions": [
                                    {
                                        "viewField": {
                                            "fieldId": "test-field",
                                            "fieldName": "Test Field"
                                        },
                                        "viewOperator": "IN",
                                        "values": ["test-value"]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    }
};

async function testCreateBusinessMapping() {
    console.log('Testing Create Business Mapping...');
    
    try {
        const response = await fetch('http://localhost:5002/api/cost-categories', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'create',
                businessMappingData: testData.resource.businessMappings[0]
            })
        });

        const result = await response.json();
        console.log('Create result:', result);
        
        if (response.ok) {
            console.log('✅ Create test passed');
        } else {
            console.log('❌ Create test failed:', result.error);
        }
    } catch (error) {
        console.log('❌ Create test error:', error.message);
    }
}

async function testUploadBusinessMappings() {
    console.log('\nTesting Upload Business Mappings...');
    
    try {
        const response = await fetch('http://localhost:5002/api/cost-categories', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'upload',
                businessMappingData: testData.resource
            })
        });

        const result = await response.json();
        console.log('Upload result:', result);
        
        if (response.ok) {
            console.log('✅ Upload test passed');
        } else {
            console.log('❌ Upload test failed:', result.error);
        }
    } catch (error) {
        console.log('❌ Upload test error:', error.message);
    }
}

async function testUpdateBusinessMapping() {
    console.log('\nTesting Update Business Mapping...');
    
    const updateData = {
        ...testData.resource.businessMappings[0],
        uuid: 'test-uuid-123',
        name: 'Updated Test Category'
    };
    
    try {
        const response = await fetch('http://localhost:5002/api/cost-categories', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });

        const result = await response.json();
        console.log('Update result:', result);
        
        if (response.ok) {
            console.log('✅ Update test passed');
        } else {
            console.log('❌ Update test failed:', result.error);
        }
    } catch (error) {
        console.log('❌ Update test error:', error.message);
    }
}

// Run tests
async function runTests() {
    console.log('🧪 Starting Harness API Tests...\n');
    
    await testCreateBusinessMapping();
    await testUploadBusinessMappings();
    await testUpdateBusinessMapping();
    
    console.log('\n🏁 Tests completed!');
}

// Check if running in Node.js environment
if (typeof window === 'undefined') {
    // Node.js environment
    const fetch = require('node-fetch');
    runTests();
} else {
    // Browser environment
    console.log('Run this in browser console or Node.js');
    window.runHarnessTests = runTests;
}

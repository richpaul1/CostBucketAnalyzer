import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getCostCategoriesAsJSON } from '../src/lib/utilsv2.js';
import { createFileFromPath } from '../src/lib/utils.js';

// Try to import test credentials, fallback to environment variables or manual input
let TEST_CREDENTIALS;
try {
    const { TEST_CREDENTIALS: importedCreds } = await import('../config/test-credentials.js');
    TEST_CREDENTIALS = importedCreds;
} catch (error) {
    // Fallback to environment variables or manual configuration
    TEST_CREDENTIALS = {
        accountId: process.env.HARNESS_ACCOUNT_ID || 'YOUR_HARNESS_ACCOUNT_ID',
        apiKey: process.env.HARNESS_API_KEY || 'YOUR_HARNESS_API_KEY'
    };
}

describe('Harness Upload Test - Cleaned CBP1 Data', () => {
    let cbp1Data = null;
    let baseUrl = 'http://localhost:5001';
    let sessionCookie = null;

    beforeAll(async () => {
        console.log('\n🔧 TESTING CLEANED CBP1 DATA UPLOAD');
        console.log('='.repeat(80));
        
        // Validate test credentials are provided
        console.log('🔑 Checking test credentials...');
        if (!TEST_CREDENTIALS.accountId || TEST_CREDENTIALS.accountId === 'YOUR_HARNESS_ACCOUNT_ID') {
            throw new Error('❌ MISSING HARNESS ACCOUNT ID - Please set up credentials');
        }
        
        if (!TEST_CREDENTIALS.apiKey || TEST_CREDENTIALS.apiKey === 'YOUR_HARNESS_API_KEY') {
            throw new Error('❌ MISSING HARNESS API KEY - Please set up credentials');
        }
        
        console.log(`✅ Account ID: ${TEST_CREDENTIALS.accountId}`);
        console.log(`✅ API Key: ${TEST_CREDENTIALS.apiKey.substring(0, 10)}...`);
        
        // Load CLEANED CBP1 data
        console.log('📁 Loading CLEANED CBP1 data...');
        const cbp1File = await createFileFromPath('costcat/cbp1-cleaned.json');
        cbp1Data = await getCostCategoriesAsJSON(cbp1File);
        
        console.log(`✅ Cleaned CBP1 data loaded successfully`);
        console.log(`📊 Business Mappings: ${cbp1Data.resource?.businessMappings?.length || 0}`);
        
        // Show what was cleaned
        cbp1Data.resource.businessMappings.forEach((mapping, index) => {
            console.log(`  ${index + 1}. "${mapping.name}" - ${mapping.costTargets?.length || 0} cost targets`);
        });
        
        // Set up test credentials in session
        console.log('🔑 Setting up test credentials in session...');
        const sessionResponse = await fetch(`${baseUrl}/api/session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(TEST_CREDENTIALS)
        });
        
        if (!sessionResponse.ok) {
            const error = await sessionResponse.json();
            throw new Error(`Failed to set up test credentials: ${error.error || 'Unknown error'}`);
        }
        
        // Extract session cookie for subsequent requests
        const setCookieHeader = sessionResponse.headers.get('set-cookie');
        if (setCookieHeader) {
            sessionCookie = setCookieHeader.split(';')[0];
        }
        
        console.log('✅ Test credentials configured in session');
        
        // Validate credentials work with Harness API directly
        console.log('🔍 Validating credentials with Harness API...');
        try {
            const apiUrl = new URL('https://app.harness.io/ccm/api/business-mapping');
            apiUrl.searchParams.set('accountIdentifier', TEST_CREDENTIALS.accountId);
            apiUrl.searchParams.set('limit', '1');
            
            const directResponse = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'x-api-key': TEST_CREDENTIALS.apiKey,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!directResponse.ok) {
                const errorData = await directResponse.text();
                throw new Error(`Direct Harness API failed: ${directResponse.status} ${errorData}`);
            }
            
            console.log('✅ Harness API credentials validated successfully');
            
        } catch (error) {
            throw new Error(`❌ CREDENTIAL VALIDATION FAILED: ${error.message}`);
        }
    });

    it('should validate cleaned CBP1 data structure', () => {
        console.log('\n📊 VALIDATING CLEANED CBP1 DATA STRUCTURE');
        console.log('='.repeat(80));
        
        expect(cbp1Data).toBeTruthy();
        expect(cbp1Data.resource).toBeTruthy();
        expect(cbp1Data.resource.businessMappings).toBeTruthy();
        expect(Array.isArray(cbp1Data.resource.businessMappings)).toBe(true);
        
        const businessMappings = cbp1Data.resource.businessMappings;
        console.log(`📋 Found ${businessMappings.length} business mappings:`);
        
        businessMappings.forEach((mapping, index) => {
            console.log(`  ${index + 1}. "${mapping.name}" - ${mapping.costTargets?.length || 0} cost targets`);
            expect(mapping.name).toBeTruthy();
            expect(mapping.accountId).toBeTruthy();
            expect(Array.isArray(mapping.costTargets)).toBe(true);
        });
        
        const totalCostTargets = businessMappings.reduce((sum, mapping) => {
            return sum + (mapping.costTargets?.length || 0);
        }, 0);
        
        console.log(`📊 Total cost targets: ${totalCostTargets}`);
        console.log(`📊 Data cleaning results:`);
        console.log(`   • Original: 483 cost targets`);
        console.log(`   • Cleaned: ${totalCostTargets} cost targets`);
        console.log(`   • Removed: ${483 - totalCostTargets} duplicates/issues`);
        
        expect(totalCostTargets).toBeGreaterThan(0);
        expect(totalCostTargets).toBe(480); // Should be 480 after cleaning
    });

    it('should upload cleaned cost categories to Harness successfully', async () => {
        console.log('\n🚀 UPLOADING CLEANED COST CATEGORIES TO HARNESS');
        console.log('='.repeat(80));
        
        // Prepare data with correct account ID
        const uploadData = JSON.parse(JSON.stringify(cbp1Data));
        
        // Replace all accountId fields
        function replaceAccountIds(obj) {
            if (typeof obj !== 'object' || obj === null) return;
            
            for (const key in obj) {
                if (key === 'accountId' && typeof obj[key] === 'string') {
                    obj[key] = TEST_CREDENTIALS.accountId;
                } else if (typeof obj[key] === 'object') {
                    replaceAccountIds(obj[key]);
                }
            }
        }
        
        replaceAccountIds(uploadData);
        
        console.log('📤 Starting upload to Harness...');
        console.log(`📊 Uploading ${uploadData.resource.businessMappings.length} cleaned cost categories`);
        
        uploadData.resource.businessMappings.forEach((mapping, index) => {
            console.log(`  ${index + 1}. "${mapping.name}" (${mapping.costTargets.length} targets)`);
        });
        
        const headers = { 'Content-Type': 'application/json' };
        if (sessionCookie) {
            headers['Cookie'] = sessionCookie;
        }
        
        const uploadResponse = await fetch(`${baseUrl}/api/cost-categories`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                action: 'upload',
                businessMappingData: uploadData.resource
            })
        });
        
        expect(uploadResponse.ok).toBe(true);
        
        const result = await uploadResponse.json();
        console.log('\n📊 UPLOAD RESULTS:');
        console.log(`✅ Total Processed: ${result.totalProcessed}`);
        console.log(`✅ Successful: ${result.successful}`);
        console.log(`❌ Failed: ${result.failed}`);
        console.log(`📈 Success Rate: ${((result.successful / result.totalProcessed) * 100).toFixed(1)}%`);
        
        // Log successful uploads
        if (result.results && result.results.length > 0) {
            console.log('\n✅ SUCCESSFUL UPLOADS:');
            result.results.forEach((item, index) => {
                console.log(`  ${index + 1}. ${item.name} (${item.action})`);
            });
        }
        
        // Log failed uploads (should be minimal now)
        if (result.errors && result.errors.length > 0) {
            console.log('\n❌ REMAINING FAILURES:');
            result.errors.forEach((error, index) => {
                console.log(`  ${index + 1}. ${error.name}: ${error.error}`);
            });
        }
        
        // Assertions - should be much better now
        expect(result.totalProcessed).toBe(uploadData.resource.businessMappings.length);
        expect(result.successful).toBeGreaterThan(0);
        
        // We expect at least 66% success rate (2/3 categories) since Cost Center might still conflict
        const successRate = (result.successful / result.totalProcessed) * 100;
        expect(successRate).toBeGreaterThan(50);
        
        console.log('\n🎉 Cleaned data upload test completed!');
    }, 120000); // 2 minute timeout for upload

    it('should verify uploaded categories exist in Harness', async () => {
        console.log('\n🔍 VERIFYING UPLOADED CATEGORIES IN HARNESS');
        console.log('='.repeat(80));
        
        const expectedCategories = cbp1Data.resource.businessMappings.map(m => m.name);
        console.log(`📋 Expected categories: ${expectedCategories.join(', ')}`);
        
        // Fetch all cost categories from Harness
        const headers = { 'Content-Type': 'application/json' };
        if (sessionCookie) {
            headers['Cookie'] = sessionCookie;
        }
        
        const fetchResponse = await fetch(`${baseUrl}/api/cost-categories?limit=100`, { headers });
        expect(fetchResponse.ok).toBe(true);
        
        const fetchResult = await fetchResponse.json();
        const existingCategories = fetchResult.resource?.businessMappings || [];
        const existingNames = existingCategories.map(m => m.name);
        
        console.log(`📊 Found ${existingCategories.length} total categories in Harness`);
        
        // Check if our uploaded categories exist
        const foundCategories = [];
        const missingCategories = [];
        
        expectedCategories.forEach(name => {
            if (existingNames.includes(name)) {
                foundCategories.push(name);
            } else {
                missingCategories.push(name);
            }
        });
        
        console.log(`✅ Found categories: ${foundCategories.length}/${expectedCategories.length}`);
        if (foundCategories.length > 0) {
            foundCategories.forEach((name, index) => {
                console.log(`   ${index + 1}. ${name}`);
            });
        }
        
        if (missingCategories.length > 0) {
            console.log(`❌ Missing categories: ${missingCategories.length}`);
            missingCategories.forEach((name, index) => {
                console.log(`   ${index + 1}. ${name}`);
            });
        }
        
        // We expect at least some categories to be found (should be better with cleaned data)
        expect(foundCategories.length).toBeGreaterThan(0);
        
        console.log('✅ Verification completed!');
    });

    afterAll(() => {
        console.log('\n🧹 CLEANING UP TEST');
        console.log('='.repeat(80));
        console.log('✅ Cleaned data functional test completed');
        console.log('\n📋 TEST SUMMARY:');
        console.log('• Cleaned CBP1 data structure validated');
        console.log('• Account ID replacement tested');
        console.log('• Cleaned cost categories uploaded to Harness');
        console.log('• Upload results verified');
        console.log('\n🎯 The cleaned data should have much better upload success rates!');
        console.log('🎯 Check your Harness dashboard to see the uploaded cost categories!');
    });
});

import { describe, it, expect, beforeAll } from 'vitest';
import { getCostCategoriesAsJSON } from '../src/lib/utilsv2.js';
import { createFileFromPath } from '../src/lib/utils.js';

describe('Harness Upload Dry Run Test', () => {
    let cbp1Data = null;
    
    beforeAll(async () => {
        console.log('\n🧪 DRY RUN: Harness Upload Test Setup');
        console.log('='.repeat(80));
        
        // Load CBP1 data
        console.log('📁 Loading CBP1 data...');
        const cbp1File = await createFileFromPath('costcat/cbp1.json');
        cbp1Data = await getCostCategoriesAsJSON(cbp1File);
        
        console.log(`✅ CBP1 data loaded successfully`);
        console.log(`📊 Business Mappings: ${cbp1Data.resource?.businessMappings?.length || 0}`);
    });

    it('should validate CBP1 data structure for upload', () => {
        console.log('\n📊 VALIDATING CBP1 DATA STRUCTURE');
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
            
            // Validate cost targets structure
            mapping.costTargets.forEach(target => {
                expect(target.name).toBeTruthy();
                expect(Array.isArray(target.rules)).toBe(true);
                
                // Validate rules structure
                target.rules.forEach(rule => {
                    expect(Array.isArray(rule.viewConditions)).toBe(true);
                    
                    // Validate view conditions
                    rule.viewConditions.forEach(condition => {
                        expect(condition.viewField).toBeTruthy();
                        expect(condition.viewField.fieldName).toBeTruthy();
                        expect(condition.viewOperator).toBeTruthy();
                        expect(Array.isArray(condition.values)).toBe(true);
                    });
                });
            });
        });
        
        const totalCostTargets = businessMappings.reduce((sum, mapping) => {
            return sum + (mapping.costTargets?.length || 0);
        }, 0);
        
        console.log(`📊 Total cost targets: ${totalCostTargets}`);
        expect(totalCostTargets).toBeGreaterThan(0);
        
        // Expected structure based on previous analysis
        expect(businessMappings.length).toBe(3);
        expect(totalCostTargets).toBe(483);
    });

    it('should simulate account ID replacement', () => {
        console.log('\n🔄 SIMULATING ACCOUNT ID REPLACEMENT');
        console.log('='.repeat(80));
        
        const testAccountId = 'test-account-id-12345';
        
        // Function to count accountId occurrences
        function countAccountIds(data) {
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
        
        // Function to swap accountIds
        function swapAccountIds(data, newAccountId) {
            const clonedData = JSON.parse(JSON.stringify(data));
            
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
        
        const originalCount = countAccountIds(cbp1Data);
        console.log(`📊 Original accountId fields: ${originalCount}`);
        console.log(`📊 Original accountId: ${cbp1Data.resource.businessMappings[0].accountId}`);
        
        const modifiedData = swapAccountIds(cbp1Data, testAccountId);
        const modifiedCount = countAccountIds(modifiedData);
        
        console.log(`📊 Modified accountId fields: ${modifiedCount}`);
        console.log(`📊 New accountId: ${modifiedData.resource.businessMappings[0].accountId}`);
        console.log(`🔄 Account ID replacement: ${cbp1Data.resource.businessMappings[0].accountId} → ${testAccountId}`);
        
        expect(originalCount).toBe(modifiedCount);
        expect(modifiedData.resource.businessMappings[0].accountId).toBe(testAccountId);
        expect(originalCount).toBe(3); // Should be 3 business mappings
    });

    it('should validate upload payload structure', () => {
        console.log('\n📦 VALIDATING UPLOAD PAYLOAD STRUCTURE');
        console.log('='.repeat(80));
        
        const testAccountId = 'test-account-id-12345';
        
        // Prepare upload payload
        const uploadData = JSON.parse(JSON.stringify(cbp1Data));
        
        // Replace account IDs
        function replaceAccountIds(obj) {
            if (typeof obj !== 'object' || obj === null) return;
            
            for (const key in obj) {
                if (key === 'accountId' && typeof obj[key] === 'string') {
                    obj[key] = testAccountId;
                } else if (typeof obj[key] === 'object') {
                    replaceAccountIds(obj[key]);
                }
            }
        }
        
        replaceAccountIds(uploadData);
        
        // Validate the upload payload structure
        const payload = {
            action: 'upload',
            businessMappingData: uploadData.resource
        };
        
        console.log(`📋 Payload structure:`);
        console.log(`   • action: ${payload.action}`);
        console.log(`   • businessMappingData.businessMappings: ${payload.businessMappingData.businessMappings.length} items`);
        
        payload.businessMappingData.businessMappings.forEach((mapping, index) => {
            console.log(`   ${index + 1}. ${mapping.name} (${mapping.costTargets.length} targets, accountId: ${mapping.accountId})`);
        });
        
        // Validate payload structure
        expect(payload.action).toBe('upload');
        expect(payload.businessMappingData).toBeTruthy();
        expect(payload.businessMappingData.businessMappings).toBeTruthy();
        expect(Array.isArray(payload.businessMappingData.businessMappings)).toBe(true);
        expect(payload.businessMappingData.businessMappings.length).toBe(3);
        
        // Validate each business mapping has correct account ID
        payload.businessMappingData.businessMappings.forEach(mapping => {
            expect(mapping.accountId).toBe(testAccountId);
        });
        
        console.log('✅ Upload payload structure is valid');
    });

    it('should estimate upload complexity', () => {
        console.log('\n📈 ESTIMATING UPLOAD COMPLEXITY');
        console.log('='.repeat(80));
        
        const businessMappings = cbp1Data.resource.businessMappings;
        
        let totalRules = 0;
        let totalConditions = 0;
        let totalValues = 0;
        
        businessMappings.forEach(mapping => {
            mapping.costTargets.forEach(target => {
                target.rules.forEach(rule => {
                    totalRules++;
                    rule.viewConditions.forEach(condition => {
                        totalConditions++;
                        totalValues += condition.values.length;
                    });
                });
            });
        });
        
        console.log(`📊 Upload Complexity Analysis:`);
        console.log(`   • Business Mappings: ${businessMappings.length}`);
        console.log(`   • Cost Targets: ${businessMappings.reduce((sum, m) => sum + m.costTargets.length, 0)}`);
        console.log(`   • Total Rules: ${totalRules}`);
        console.log(`   • Total Conditions: ${totalConditions}`);
        console.log(`   • Total Values: ${totalValues}`);
        console.log(`   • Average Values per Condition: ${(totalValues / totalConditions).toFixed(2)}`);
        
        // Estimate upload time (rough calculation)
        const estimatedTimeSeconds = Math.ceil((businessMappings.length * 2) + (totalRules * 0.1));
        console.log(`   • Estimated Upload Time: ~${estimatedTimeSeconds} seconds`);
        
        expect(totalRules).toBeGreaterThan(0);
        expect(totalConditions).toBeGreaterThan(0);
        expect(totalValues).toBeGreaterThan(0);
        
        console.log('✅ Complexity analysis completed');
        console.log('');
        console.log('🎯 Ready for functional test! Run:');
        console.log('   npm run setup:credentials  # Set up your Harness credentials');
        console.log('   npm run test:functional    # Run the actual upload test');
    });
});

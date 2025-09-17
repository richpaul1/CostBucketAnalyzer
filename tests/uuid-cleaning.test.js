import { describe, it, expect } from 'vitest';

describe('UUID Cleaning for Cost Category Creation', () => {
    
    // Mock the cleanUuidsForCreation function (extracted from the API)
    function cleanUuidsForCreation(data) {
        const cleanedData = JSON.parse(JSON.stringify(data)); // Deep clone
        let uuidsRemoved = 0;
        
        // Remove UUID from the main business mapping
        if (cleanedData.uuid) {
            delete cleanedData.uuid;
            uuidsRemoved++;
        }
        
        // Clean UUIDs from cost targets
        if (cleanedData.costTargets && Array.isArray(cleanedData.costTargets)) {
            cleanedData.costTargets.forEach(target => {
                if (target.uuid) {
                    delete target.uuid;
                    uuidsRemoved++;
                }
                
                // Clean UUIDs from rules
                if (target.rules && Array.isArray(target.rules)) {
                    target.rules.forEach(rule => {
                        if (rule.uuid) {
                            delete rule.uuid;
                            uuidsRemoved++;
                        }
                        
                        // Clean UUIDs from view conditions
                        if (rule.viewConditions && Array.isArray(rule.viewConditions)) {
                            rule.viewConditions.forEach(condition => {
                                if (condition.uuid) {
                                    delete condition.uuid;
                                    uuidsRemoved++;
                                }
                                
                                // Clean UUIDs from view field
                                if (condition.viewField && condition.viewField.uuid) {
                                    delete condition.viewField.uuid;
                                    uuidsRemoved++;
                                }
                            });
                        }
                    });
                }
            });
        }
        
        return { cleanedData, uuidsRemoved };
    }

    it('should remove UUID from main business mapping', () => {
        const testData = {
            uuid: 'main-uuid-123',
            name: 'Test Category',
            accountId: 'test-account',
            costTargets: []
        };

        const { cleanedData, uuidsRemoved } = cleanUuidsForCreation(testData);

        expect(cleanedData.uuid).toBeUndefined();
        expect(cleanedData.name).toBe('Test Category');
        expect(cleanedData.accountId).toBe('test-account');
        expect(uuidsRemoved).toBe(1);
    });

    it('should remove UUIDs from cost targets', () => {
        const testData = {
            name: 'Test Category',
            costTargets: [
                {
                    uuid: 'target-uuid-1',
                    name: 'Target 1',
                    rules: []
                },
                {
                    uuid: 'target-uuid-2', 
                    name: 'Target 2',
                    rules: []
                }
            ]
        };

        const { cleanedData, uuidsRemoved } = cleanUuidsForCreation(testData);

        expect(cleanedData.costTargets[0].uuid).toBeUndefined();
        expect(cleanedData.costTargets[1].uuid).toBeUndefined();
        expect(cleanedData.costTargets[0].name).toBe('Target 1');
        expect(cleanedData.costTargets[1].name).toBe('Target 2');
        expect(uuidsRemoved).toBe(2);
    });

    it('should remove UUIDs from rules and view conditions', () => {
        const testData = {
            name: 'Test Category',
            costTargets: [
                {
                    name: 'Target 1',
                    rules: [
                        {
                            uuid: 'rule-uuid-1',
                            viewConditions: [
                                {
                                    uuid: 'condition-uuid-1',
                                    viewField: {
                                        uuid: 'field-uuid-1',
                                        fieldName: 'Business Unit'
                                    },
                                    viewOperator: 'IN',
                                    values: ['test']
                                }
                            ]
                        }
                    ]
                }
            ]
        };

        const { cleanedData, uuidsRemoved } = cleanUuidsForCreation(testData);

        const rule = cleanedData.costTargets[0].rules[0];
        const condition = rule.viewConditions[0];

        expect(rule.uuid).toBeUndefined();
        expect(condition.uuid).toBeUndefined();
        expect(condition.viewField.uuid).toBeUndefined();
        expect(condition.viewField.fieldName).toBe('Business Unit');
        expect(condition.viewOperator).toBe('IN');
        expect(condition.values).toEqual(['test']);
        expect(uuidsRemoved).toBe(3);
    });

    it('should handle complex nested structure with multiple UUIDs', () => {
        const testData = {
            uuid: 'main-uuid',
            name: 'Complex Category',
            costTargets: [
                {
                    uuid: 'target-uuid-1',
                    name: 'Target 1',
                    rules: [
                        {
                            uuid: 'rule-uuid-1',
                            viewConditions: [
                                {
                                    uuid: 'condition-uuid-1',
                                    viewField: {
                                        uuid: 'field-uuid-1',
                                        fieldName: 'Business Unit'
                                    }
                                },
                                {
                                    uuid: 'condition-uuid-2',
                                    viewField: {
                                        uuid: 'field-uuid-2',
                                        fieldName: 'Project'
                                    }
                                }
                            ]
                        },
                        {
                            uuid: 'rule-uuid-2',
                            viewConditions: [
                                {
                                    uuid: 'condition-uuid-3',
                                    viewField: {
                                        uuid: 'field-uuid-3',
                                        fieldName: 'Cost Center'
                                    }
                                }
                            ]
                        }
                    ]
                },
                {
                    uuid: 'target-uuid-2',
                    name: 'Target 2',
                    rules: [
                        {
                            uuid: 'rule-uuid-3',
                            viewConditions: [
                                {
                                    uuid: 'condition-uuid-4',
                                    viewField: {
                                        uuid: 'field-uuid-4',
                                        fieldName: 'Account'
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        };

        const { cleanedData, uuidsRemoved } = cleanUuidsForCreation(testData);

        // Verify all UUIDs are removed
        expect(cleanedData.uuid).toBeUndefined();
        expect(cleanedData.costTargets[0].uuid).toBeUndefined();
        expect(cleanedData.costTargets[1].uuid).toBeUndefined();
        
        // Check rules
        expect(cleanedData.costTargets[0].rules[0].uuid).toBeUndefined();
        expect(cleanedData.costTargets[0].rules[1].uuid).toBeUndefined();
        expect(cleanedData.costTargets[1].rules[0].uuid).toBeUndefined();
        
        // Check conditions
        expect(cleanedData.costTargets[0].rules[0].viewConditions[0].uuid).toBeUndefined();
        expect(cleanedData.costTargets[0].rules[0].viewConditions[1].uuid).toBeUndefined();
        expect(cleanedData.costTargets[0].rules[1].viewConditions[0].uuid).toBeUndefined();
        expect(cleanedData.costTargets[1].rules[0].viewConditions[0].uuid).toBeUndefined();
        
        // Check view fields
        expect(cleanedData.costTargets[0].rules[0].viewConditions[0].viewField.uuid).toBeUndefined();
        expect(cleanedData.costTargets[0].rules[0].viewConditions[1].viewField.uuid).toBeUndefined();
        expect(cleanedData.costTargets[0].rules[1].viewConditions[0].viewField.uuid).toBeUndefined();
        expect(cleanedData.costTargets[1].rules[0].viewConditions[0].viewField.uuid).toBeUndefined();
        
        // Verify data integrity is maintained
        expect(cleanedData.name).toBe('Complex Category');
        expect(cleanedData.costTargets[0].name).toBe('Target 1');
        expect(cleanedData.costTargets[1].name).toBe('Target 2');
        expect(cleanedData.costTargets[0].rules[0].viewConditions[0].viewField.fieldName).toBe('Business Unit');
        
        // Should have removed: 1 main + 2 targets + 3 rules + 4 conditions + 4 fields = 14 UUIDs
        expect(uuidsRemoved).toBe(14);
    });

    it('should handle data without UUIDs gracefully', () => {
        const testData = {
            name: 'Clean Category',
            costTargets: [
                {
                    name: 'Target 1',
                    rules: [
                        {
                            viewConditions: [
                                {
                                    viewField: {
                                        fieldName: 'Business Unit'
                                    },
                                    viewOperator: 'IN',
                                    values: ['test']
                                }
                            ]
                        }
                    ]
                }
            ]
        };

        const { cleanedData, uuidsRemoved } = cleanUuidsForCreation(testData);

        expect(cleanedData).toEqual(testData);
        expect(uuidsRemoved).toBe(0);
    });

    it('should not modify original data (deep clone)', () => {
        const originalData = {
            uuid: 'original-uuid',
            name: 'Original Category',
            costTargets: [
                {
                    uuid: 'target-uuid',
                    name: 'Target 1'
                }
            ]
        };

        const { cleanedData } = cleanUuidsForCreation(originalData);

        // Original should still have UUIDs
        expect(originalData.uuid).toBe('original-uuid');
        expect(originalData.costTargets[0].uuid).toBe('target-uuid');
        
        // Cleaned should not have UUIDs
        expect(cleanedData.uuid).toBeUndefined();
        expect(cleanedData.costTargets[0].uuid).toBeUndefined();
        
        // But names should be preserved
        expect(cleanedData.name).toBe('Original Category');
        expect(cleanedData.costTargets[0].name).toBe('Target 1');
    });
});

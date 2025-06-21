/**
 * Test suite for business mapping utility functions
 */

import { 
    processMappingFiles, 
    findOverlappingRules, 
    compareRules, 
    normalizeConditions, 
    isSubset 
} from '../src/lib/utils.js';

// Mock File class for testing
class MockFile {
    constructor(name, content) {
        this.name = name;
        this.content = content;
    }

    async text() {
        return this.content;
    }
}

// Test data
const validMapping1 = {
    uuid: "test-uuid-1",
    name: "Test Mapping 1",
    rules: [
        {
            viewConditions: [
                {
                    viewField: { fieldId: "category" },
                    viewOperator: "equals",
                    values: ["Office Supplies", "Equipment"]
                }
            ]
        }
    ]
};

const validMapping2 = {
    uuid: "test-uuid-2",
    name: "Test Mapping 2",
    rules: [
        {
            viewConditions: [
                {
                    viewField: { fieldId: "category" },
                    viewOperator: "equals",
                    values: ["Office Supplies", "Furniture"]
                }
            ]
        }
    ]
};

const overlappingMapping = {
    uuid: "test-uuid-3",
    name: "Overlapping Mapping",
    rules: [
        {
            viewConditions: [
                {
                    viewField: { fieldId: "category" },
                    viewOperator: "equals",
                    values: ["Office Supplies"]
                }
            ]
        }
    ]
};

// Test processMappingFiles function
describe('processMappingFiles', () => {
    test('should process valid JSON files correctly', async () => {
        const file1 = new MockFile('mapping1.json', JSON.stringify([validMapping1]));
        const file2 = new MockFile('mapping2.json', JSON.stringify([validMapping2]));
        
        const result = await processMappingFiles([file1, file2]);
        
        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('Test Mapping 1');
        expect(result[1].name).toBe('Test Mapping 2');
    });

    test('should reject non-JSON files', async () => {
        const txtFile = new MockFile('test.txt', 'not json');
        
        await expect(processMappingFiles([txtFile]))
            .rejects
            .toThrow('Invalid file format: test.txt. Only JSON files are supported.');
    });

    test('should reject invalid JSON content', async () => {
        const invalidJsonFile = new MockFile('invalid.json', '{ invalid json }');
        
        await expect(processMappingFiles([invalidJsonFile]))
            .rejects
            .toThrow('Invalid JSON in invalid.json');
    });

    test('should reject non-array JSON structure', async () => {
        const nonArrayFile = new MockFile('object.json', JSON.stringify(validMapping1));
        
        await expect(processMappingFiles([nonArrayFile]))
            .rejects
            .toThrow('Invalid structure in object.json. Expected an array of business mappings.');
    });

    test('should reject mappings without required fields', async () => {
        const invalidMapping = { name: "Test", rules: [] }; // missing uuid
        const invalidFile = new MockFile('invalid.json', JSON.stringify([invalidMapping]));
        
        await expect(processMappingFiles([invalidFile]))
            .rejects
            .toThrow('Invalid mapping in invalid.json. Expected uuid, name, and rules array.');
    });
});

// Test findOverlappingRules function
describe('findOverlappingRules', () => {
    test('should find overlapping rules between mappings', () => {
        const mappings = [validMapping1, validMapping2];
        const overlaps = findOverlappingRules(mappings, false);
        
        expect(overlaps).toHaveLength(1);
        expect(overlaps[0].mappingNameA).toBe('Test Mapping 1');
        expect(overlaps[0].mappingNameB).toBe('Test Mapping 2');
        expect(overlaps[0].conditions[0].values).toContain('office supplies');
    });

    test('should handle case sensitivity correctly', () => {
        const mapping1 = {
            ...validMapping1,
            rules: [{
                viewConditions: [{
                    viewField: { fieldId: "category" },
                    viewOperator: "equals",
                    values: ["Office Supplies"]
                }]
            }]
        };
        
        const mapping2 = {
            ...validMapping2,
            rules: [{
                viewConditions: [{
                    viewField: { fieldId: "category" },
                    viewOperator: "equals",
                    values: ["OFFICE SUPPLIES"]
                }]
            }]
        };

        // Case insensitive - should find overlap
        const insensitiveResult = findOverlappingRules([mapping1, mapping2], false);
        expect(insensitiveResult).toHaveLength(1);

        // Case sensitive - should not find overlap
        const sensitiveResult = findOverlappingRules([mapping1, mapping2], true);
        expect(sensitiveResult).toHaveLength(0);
    });

    test('should return empty array when no overlaps exist', () => {
        const mapping1 = {
            ...validMapping1,
            rules: [{
                viewConditions: [{
                    viewField: { fieldId: "category" },
                    viewOperator: "equals",
                    values: ["Unique Value 1"]
                }]
            }]
        };
        
        const mapping2 = {
            ...validMapping2,
            rules: [{
                viewConditions: [{
                    viewField: { fieldId: "category" },
                    viewOperator: "equals",
                    values: ["Unique Value 2"]
                }]
            }]
        };

        const result = findOverlappingRules([mapping1, mapping2], false);
        expect(result).toHaveLength(0);
    });
});

// Test compareRules function
describe('compareRules', () => {
    const rule1 = {
        viewConditions: [{
            viewField: { fieldId: "category" },
            viewOperator: "equals",
            values: ["Office Supplies", "Equipment"]
        }]
    };

    const rule2 = {
        viewConditions: [{
            viewField: { fieldId: "category" },
            viewOperator: "equals",
            values: ["Office Supplies", "Furniture"]
        }]
    };

    const identicalRule = {
        viewConditions: [{
            viewField: { fieldId: "category" },
            viewOperator: "equals",
            values: ["Office Supplies", "Equipment"]
        }]
    };

    test('should detect identical rules', () => {
        const result = compareRules(rule1, identicalRule, false);
        
        expect(result).not.toBeNull();
        expect(result[0].reason).toBe('Identical condition');
        expect(result[0].fieldId).toBe('category');
    });

    test('should detect overlapping values', () => {
        const result = compareRules(rule1, rule2, false);
        
        expect(result).not.toBeNull();
        expect(result[0].reason).toBe('Overlapping values');
        expect(result[0].values).toContain('office supplies');
    });

    test('should detect subset relationships', () => {
        const subsetRule = {
            viewConditions: [{
                viewField: { fieldId: "category" },
                viewOperator: "equals",
                values: ["Office Supplies"]
            }]
        };

        const result = compareRules(subsetRule, rule1, false);
        
        expect(result).not.toBeNull();
        expect(result[0].reason).toBe('Rule A is a subset of Rule B');
    });

    test('should return null when no overlap exists', () => {
        const noOverlapRule = {
            viewConditions: [{
                viewField: { fieldId: "category" },
                viewOperator: "equals",
                values: ["Completely Different"]
            }]
        };

        const result = compareRules(rule1, noOverlapRule, false);
        expect(result).toBeNull();
    });
});

// Test normalizeConditions function
describe('normalizeConditions', () => {
    const viewConditions = [
        {
            viewField: { fieldId: "category" },
            viewOperator: "equals",
            values: ["Office Supplies", "Equipment"]
        },
        {
            viewField: { fieldId: "department" },
            viewOperator: "contains",
            values: ["Sales", "Marketing"]
        }
    ];

    test('should normalize conditions with case insensitive values', () => {
        const result = normalizeConditions(viewConditions, false);
        
        expect(result).toHaveLength(2);
        expect(result[0].fieldId).toBe('category');
        expect(result[0].values).toEqual(['equipment', 'office supplies']);
        expect(result[1].fieldId).toBe('department');
        expect(result[1].values).toEqual(['marketing', 'sales']);
    });

    test('should preserve case when case sensitive', () => {
        const result = normalizeConditions(viewConditions, true);
        
        expect(result[0].values).toEqual(['Equipment', 'Office Supplies']);
        expect(result[1].values).toEqual(['Marketing', 'Sales']);
    });

    test('should sort conditions by fieldId', () => {
        const result = normalizeConditions(viewConditions, false);
        
        expect(result[0].fieldId).toBe('category');
        expect(result[1].fieldId).toBe('department');
    });
});

// Test isSubset function
describe('isSubset', () => {
    const conditionsA = [
        { fieldId: "category", viewOperator: "equals", values: ["Office Supplies"] }
    ];

    const conditionsB = [
        { fieldId: "category", viewOperator: "equals", values: ["Office Supplies", "Equipment"] }
    ];

    const conditionsC = [
        { fieldId: "department", viewOperator: "equals", values: ["Sales"] }
    ];

    test('should return true when A is subset of B', () => {
        const result = isSubset(conditionsA, conditionsB);
        expect(result).toBe(true);
    });

    test('should return false when A is not subset of B', () => {
        const result = isSubset(conditionsB, conditionsA);
        expect(result).toBe(false);
    });

    test('should return false when conditions have different fieldIds', () => {
        const result = isSubset(conditionsA, conditionsC);
        expect(result).toBe(false);
    });

    test('should return false when A has more conditions than B', () => {
        const moreConditions = [
            { fieldId: "category", viewOperator: "equals", values: ["Office Supplies"] },
            { fieldId: "department", viewOperator: "equals", values: ["Sales"] }
        ];

        const result = isSubset(moreConditions, conditionsA);
        expect(result).toBe(false);
    });
});

// Integration test
describe('Integration Tests', () => {
    test('should process complete workflow from files to overlap detection', async () => {
        const file1 = new MockFile('mapping1.json', JSON.stringify([validMapping1]));
        const file2 = new MockFile('mapping2.json', JSON.stringify([overlappingMapping]));
        
        const mappings = await processMappingFiles([file1, file2]);
        const overlaps = findOverlappingRules(mappings, false);
        
        expect(mappings).toHaveLength(2);
        expect(overlaps).toHaveLength(1);
        expect(overlaps[0].conditions[0].reason).toBe('Rule B is a subset of Rule A');
    });
});
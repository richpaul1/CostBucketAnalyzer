/**
 * Business mapping rules utility functions for CostAnalyzer
 */

/**
 * Processes uploaded JSON files to extract business mappings
 * @param {File[]} files - Array of files to process
 * @returns {Promise<Object[]>} Array of mapping objects
 */
export async function processMappingFiles(files) {
    const mappings = [];

    for (const file of files) {
        if (!file.name.endsWith('.json')) {
            throw new Error(`Invalid file format: ${file.name}. Only JSON files are supported.`);
        }

        const text = await file.text();
        let jsonData;
        try {
            jsonData = JSON.parse(text);
        } catch (e) {
            throw new Error(`Invalid JSON in ${file.name}: ${e.message}`);
        }

        // Ensure jsonData is an array of mappings
        if (!Array.isArray(jsonData)) {
            throw new Error(`Invalid structure in ${file.name}. Expected an array of business mappings.`);
        }

        // Validate each mapping
        for (const mapping of jsonData) {
            if (!mapping.uuid || !mapping.name || !Array.isArray(mapping.rules)) {
                throw new Error(`Invalid mapping in ${file.name}. Expected uuid, name, and rules array.`);
            }
            mappings.push(mapping);
        }
    }

    return mappings;
}

/**
 * Finds overlapping rules between business mappings
 * @param {Object[]} mappings - Array of business mapping objects
 * @param {boolean} caseSensitive - Whether to use case-sensitive comparison
 * @returns {Object[]} Array of overlap results
 */
export function findOverlappingRules(mappings, caseSensitive = false) {
    const overlaps = [];

    // Compare rules across all mappings
    for (let i = 0; i < mappings.length; i++) {
        const mappingA = mappings[i];
        for (let j = i; j < mappings.length; j++) { // Start from i to include same-mapping comparisons
            const mappingB = mappings[j];
            const rulesA = mappingA.rules;
            const rulesB = mappingB.rules;

            // Compare each pair of rules
            for (let ruleIndexA = 0; ruleIndexA < rulesA.length; ruleIndexA++) {
                for (let ruleIndexB = (i === j ? ruleIndexA + 1 : 0); ruleIndexB < rulesB.length; ruleIndexB++) {
                    const ruleA = rulesA[ruleIndexA];
                    const ruleB = rulesB[ruleIndexB];

                    // Validate rule structure
                    if (!Array.isArray(ruleA.viewConditions) || !Array.isArray(ruleB.viewConditions)) {
                        continue;
                    }

                    // Compare rules for overlap
                    const overlap = compareRules(ruleA, ruleB, caseSensitive);
                    if (overlap) {
                        overlaps.push({
                            mappingNameA: mappingA.name,
                            mappingNameB: mappingB.name,
                            ruleIndexA,
                            ruleIndexB,
                            conditions: overlap
                        });
                    }
                }
            }
        }
    }

    return overlaps;
}

/**
 * Compares two rules for overlapping conditions
 * @param {Object} ruleA - First rule object
 * @param {Object} ruleB - Second rule object
 * @param {boolean} caseSensitive - Whether to use case-sensitive comparison
 * @returns {Object[]|null} Array of overlapping conditions or null
 */
export function compareRules(ruleA, ruleB, caseSensitive = false) {
    // Normalize conditions based on case sensitivity
    const conditionsA = normalizeConditions(ruleA.viewConditions, caseSensitive);
    const conditionsB = normalizeConditions(ruleB.viewConditions, caseSensitive);

    // Check for identical conditions
    if (JSON.stringify(conditionsA) === JSON.stringify(conditionsB)) {
        return conditionsA.map(cond => ({
            fieldId: cond.fieldId,
            viewOperator: cond.viewOperator,
            values: cond.values,
            reason: 'Identical condition'
        }));
    }

    // Check for overlapping values in conditions with same fieldId and viewOperator
    const overlappingConditions = [];
    conditionsA.forEach((condA) => {
        const matchingCondB = conditionsB.find(
            (condB) => condB.fieldId === condA.fieldId && condB.viewOperator === condA.viewOperator
        );
        if (matchingCondB) {
            const commonValues = condA.values.filter((value) =>
                matchingCondB.values.includes(value)
            );
            if (commonValues.length > 0) {
                overlappingConditions.push({
                    fieldId: condA.fieldId,
                    viewOperator: condA.viewOperator,
                    values: commonValues,
                    reason: 'Overlapping values'
                });
            }
        }
    });

    // Check for subset conditions
    if (isSubset(conditionsA, conditionsB)) {
        return conditionsA.map(cond => ({
            fieldId: cond.fieldId,
            viewOperator: cond.viewOperator,
            values: cond.values,
            reason: 'Rule A is a subset of Rule B'
        }));
    }
    if (isSubset(conditionsB, conditionsA)) {
        return conditionsB.map(cond => ({
            fieldId: cond.fieldId,
            viewOperator: cond.viewOperator,
            values: cond.values,
            reason: 'Rule B is a subset of Rule A'
        }));
    }

    return overlappingConditions.length > 0 ? overlappingConditions : null;
}

/**
 * Normalizes view conditions for comparison
 * @param {Object[]} viewConditions - Array of view condition objects
 * @param {boolean} caseSensitive - Whether to preserve case sensitivity
 * @returns {Object[]} Normalized conditions array
 */
export function normalizeConditions(viewConditions, caseSensitive = false) {
    return viewConditions.map((cond) => ({
        fieldId: cond.viewField.fieldId,
        viewOperator: cond.viewOperator,
        values: cond.values
            .map((v) => (caseSensitive ? v : v.toLowerCase())) // Toggle case sensitivity
            .sort() // Ensure consistent order
    })).sort((a, b) => a.fieldId.localeCompare(b.fieldId));
}

/**
 * Checks if conditionsA is a subset of conditionsB
 * @param {Object[]} conditionsA - First conditions array
 * @param {Object[]} conditionsB - Second conditions array
 * @returns {boolean} True if A is subset of B
 */
export function isSubset(conditionsA, conditionsB) {
    if (conditionsA.length > conditionsB.length) return false;
    return conditionsA.every((condA) => {
        const condB = conditionsB.find(
            (c) => c.fieldId === condA.fieldId && c.viewOperator === condA.viewOperator
        );
        if (!condB) return false;
        return condA.values.every((value) => condB.values.includes(value));
    });
}
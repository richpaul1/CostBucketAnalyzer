/**
 * Business mapping rules utility functions for CostAnalyzer
 */

export async function getCostCategoriesAsJSON(file) {

    if (!file.name.endsWith('.json')) {
        throw new Error(`Invalid file format: ${file.name}. Only JSON files are supported.`);
    }

    const text = await file.text();
    let jsonData;
    try {
        jsonData = JSON.parse(text);
        return jsonData;
    } catch (e) {
        throw new Error(`Invalid JSON in ${file.name}: ${e.message}`);
    }

    return null;
}

// Helper function to create a File-like object from file path (for testing)
export async function createFileFromPath(filePath) {
    const fs = await import('fs/promises');
    const path = await import('path');

    const content = await fs.readFile(filePath, 'utf8');
    const fileName = path.basename(filePath);

    return {
        name: fileName,
        async text() {
            return content;
        }
    };
}

// Helper function to generate a detailed conflict report
export function generateConflictReport(conflicts, options = {}) {
    const {
        maxConflicts = 50,
        groupByCategory = true,
        includeConditionDetails = true,
        sortBy = 'category' // 'category', 'type', 'frequency'
    } = options;

    const report = {
        summary: {
            totalConflicts: conflicts.length,
            conflictTypes: {},
            categoriesInvolved: new Set(),
            mostProblematicCategories: {}
        },
        details: []
    };

    // Analyze conflicts for summary
    conflicts.forEach(conflict => {
        // Count conflict types
        const type = conflict.type || 'overlap';
        report.summary.conflictTypes[type] = (report.summary.conflictTypes[type] || 0) + 1;

        // Track categories involved
        report.summary.categoriesInvolved.add(conflict.src_cat);
        report.summary.categoriesInvolved.add(conflict.dest_cat);

        // Count conflicts per category
        const srcCat = conflict.src_cat;
        const destCat = conflict.dest_cat;
        report.summary.mostProblematicCategories[srcCat] =
            (report.summary.mostProblematicCategories[srcCat] || 0) + 1;
        if (srcCat !== destCat) {
            report.summary.mostProblematicCategories[destCat] =
                (report.summary.mostProblematicCategories[destCat] || 0) + 1;
        }
    });

    // Sort conflicts based on sortBy option
    let sortedConflicts = [...conflicts];
    if (sortBy === 'category') {
        sortedConflicts.sort((a, b) => {
            if (a.src_cat !== b.src_cat) return a.src_cat.localeCompare(b.src_cat);
            if (a.dest_cat !== b.dest_cat) return a.dest_cat.localeCompare(b.dest_cat);
            return a.src_bucket.localeCompare(b.src_bucket);
        });
    } else if (sortBy === 'type') {
        sortedConflicts.sort((a, b) => (a.type || 'overlap').localeCompare(b.type || 'overlap'));
    }

    // Group conflicts if requested
    if (groupByCategory) {
        const grouped = {};
        sortedConflicts.slice(0, maxConflicts).forEach(conflict => {
            const key = `${conflict.src_cat} ↔ ${conflict.dest_cat}`;
            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(conflict);
        });

        Object.entries(grouped).forEach(([categoryPair, conflictList]) => {
            report.details.push({
                categoryPair,
                conflictCount: conflictList.length,
                conflicts: conflictList.map(conflict => ({
                    type: conflict.type || 'overlap',
                    sourceBucket: conflict.src_bucket,
                    targetBucket: conflict.dest_bucket,
                    condition: includeConditionDetails ? conflict.condition : 'See raw data',
                    severity: conflictList.length > 10 ? 'HIGH' : conflictList.length > 5 ? 'MEDIUM' : 'LOW'
                }))
            });
        });
    } else {
        report.details = sortedConflicts.slice(0, maxConflicts).map(conflict => ({
            type: conflict.type || 'overlap',
            sourceCategory: conflict.src_cat,
            sourceBucket: conflict.src_bucket,
            targetCategory: conflict.dest_cat,
            targetBucket: conflict.dest_bucket,
            condition: includeConditionDetails ? conflict.condition : 'See raw data'
        }));
    }

    // Convert sets to arrays for JSON serialization
    report.summary.categoriesInvolved = Array.from(report.summary.categoriesInvolved);

    // Sort most problematic categories
    report.summary.mostProblematicCategories = Object.entries(report.summary.mostProblematicCategories)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .reduce((obj, [cat, count]) => {
            obj[cat] = count;
            return obj;
        }, {});

    return report;
}

function debug(message, ...args) {
    // if (process.env.DEBUG) {
    //     console.debug(`[DEBUG] ${message}`, ...args);
    // }
    console.debug(`[DEBUG] ${message}`, ...args);
}

export function getConflicts(jsonData, type = 'all') {
    // Parse JSON if it's a string
    const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
    const result = [];

    let duplicateMap = new Map();

    // Function to generate Cartesian product of arrays
    function cartesianProduct(arrays) {
        return arrays.reduce((acc, curr) => {
            const result = [];
            acc.forEach(a => {
                curr.forEach(b => {
                    result.push([...a, b]);
                });
            });
            return result;
        }, [[]]);
    }
    

    let businessMappings = data.resource.businessMappings;
    if (!Array.isArray(businessMappings)) {
        return result;
    }

    businessMappings.forEach( mapping => {
        if (!mapping.costTargets || !Array.isArray(mapping.costTargets)) {
            return; // Skip mappings without valid cost targets
        }

        if (type === 'per-category'){
            duplicateMap = new Map();
        }
        
        mapping.costTargets.forEach(costTarget => {
            if (!costTarget.rules || !Array.isArray(costTarget.rules)) {
                return; // Skip invalid cost targets
            }
            
            // Process each rule in the cost target
            costTarget.rules.forEach(rule => {
                if (!rule.viewConditions || !Array.isArray(rule.viewConditions)) {
                    return; // Skip invalid rules
                }
                
                        // Get all view conditions within a rule (AND logic)
                const conditions = rule.viewConditions;
                
                // Collect all possible values for each condition
                const valueLists = [];
                const fields = [];
                const operator = [];
                
                conditions.forEach(condition => {
                    const field = condition.viewField.fieldName;
                    const values = condition.values || []; // Handle null values
                    valueLists.push(values);
                    fields.push(field);
                    operator.push(condition.viewOperator);
                });
                
                // Generate all possible combinations of values
                const combinations = cartesianProduct(valueLists);
                
                // Format each combination as a string
                combinations.forEach(combo => {
                    const conditionStr = combo
                        .map((value, i) => `${fields[i]} ${operator[i]} ${value}`)
                        .join(' AND ');

                    // Check for duplicates or overlaps    
                    const entry = duplicateMap.has(conditionStr);
                    const nameKey = {
                        cat: mapping.name,
                        bucket: costTarget.name
                    }
                        
                    const print = false
                    if(conditionStr === "department tag null") {
                        print = true;
                    }

                    if (!entry) {
                        duplicateMap.set(conditionStr, JSON.stringify(nameKey));
                    }
                    else {
                        const keyStr = duplicateMap.get(conditionStr);
                        const key = JSON.parse(keyStr);
                        if(print){
                            console.log(`Found duplicate or overlap for condition: ${conditionStr}`);
                            console.log(`Existing key: ${keyStr}`);
                            console.log(`New key: ${JSON.stringify(nameKey)}`);
                        }
                        if (key.cat !== nameKey.cat || key.bucket !== nameKey.bucket) {
                            result.push(
                                {
                                    row: result.length + 1,
                                    src_cat: key.cat,
                                    src_bucket: key.bucket,
                                    dest_cat: nameKey.cat,
                                    dest_bucket: nameKey.bucket,
                                    condition: conditionStr,
                                    type: 'overlap'
                                }
                            );
                        }else{
                            result.push(
                                {
                                    row: result.length + 1,
                                    src_cat: key.cat,
                                    src_bucket: key.bucket,
                                    dest_cat: nameKey.cat,
                                    dest_bucket: nameKey.bucket,
                                    condition: conditionStr,
                                    type: 'duplicate'
                                }
                            );
                        }
                    }
                    
                });
            });
        });
    });

    // Return numbered list of combinations
    return result;
}
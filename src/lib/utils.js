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
                    const values = condition.values;
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
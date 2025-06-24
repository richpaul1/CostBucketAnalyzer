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
}

function debug(message, ...args) {
    console.debug(`[DEBUG] ${message}`, ...args);
}

export function getConflicts(jsonData, type = 'all') {
    const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
    const conflicts = [];
    const nodeMap = new Map(); // Track nodes for graph
    const nodes = [{ id: 'root', name: 'Cost Categories', parent: null }]; // Root node
    const links = [];

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

    let businessMappings = data.resource?.businessMappings;
    if (!Array.isArray(businessMappings)) {
        return { conflicts, graph: { nodes, links } };
    }

    // Build node hierarchy: categories -> buckets
    businessMappings.forEach(mapping => {
        if (!mapping.costTargets || !Array.isArray(mapping.costTargets)) {
            return;
        }
        // Add category node
        const catId = `cat_${mapping.name}`;
        if (!nodeMap.has(catId)) {
            nodeMap.set(catId, { id: catId, name: mapping.name, parent: 'root' });
            nodes.push(nodeMap.get(catId));
        }

        mapping.costTargets.forEach(costTarget => {
            // Add bucket node
            const bucketId = `bucket_${mapping.name}_${costTarget.name}`;
            if (!nodeMap.has(bucketId)) {
                nodeMap.set(bucketId, { id: bucketId, name: costTarget.name, parent: catId });
                nodes.push(nodeMap.get(bucketId));
            }
        });
    });

    businessMappings.forEach(mapping => {
        if (!mapping.costTargets || !Array.isArray(mapping.costTargets)) {
            return;
        }

        if (type === 'per-category') {
            duplicateMap = new Map();
        }

        mapping.costTargets.forEach(costTarget => {
            if (!costTarget.rules || !Array.isArray(costTarget.rules)) {
                return;
            }

            costTarget.rules.forEach(rule => {
                if (!rule.viewConditions || !Array.isArray(rule.viewConditions)) {
                    return;
                }

                const conditions = rule.viewConditions;
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

                const combinations = cartesianProduct(valueLists);

                combinations.forEach(combo => {
                    const conditionStr = combo
                        .map((value, i) => `${fields[i]} ${operator[i]} ${value}`)
                        .join(' AND ');

                    const entry = duplicateMap.has(conditionStr);
                    const nameKey = {
                        cat: mapping.name,
                        bucket: costTarget.name
                    };
                    const srcBucketId = `bucket_${mapping.name}_${costTarget.name}`;

                    if (!entry) {
                        duplicateMap.set(conditionStr, JSON.stringify(nameKey));
                    } else {
                        const keyStr = duplicateMap.get(conditionStr);
                        const key = JSON.parse(keyStr);
                        const destBucketId = `bucket_${key.cat}_${key.bucket}`;

                        if (key.cat !== nameKey.cat || key.bucket !== nameKey.bucket) {
                            conflicts.push({
                                row: conflicts.length + 1,
                                src_cat: key.cat,
                                src_bucket: key.bucket,
                                dest_cat: nameKey.cat,
                                dest_bucket: nameKey.bucket,
                                condition: conditionStr,
                                type: 'overlap'
                            });
                            links.push({
                                source: srcBucketId,
                                target: destBucketId,
                                condition: conditionStr,
                                type: 'overlap'
                            });
                        } else {
                            conflicts.push({
                                row: conflicts.length + 1,
                                src_cat: key.cat,
                                src_bucket: key.bucket,
                                dest_cat: nameKey.cat,
                                dest_bucket: nameKey.bucket,
                                condition: conditionStr,
                                type: 'duplicate'
                            });
                            links.push({
                                source: srcBucketId,
                                target: destBucketId,
                                condition: conditionStr,
                                type: 'duplicate'
                            });
                        }
                    }
                });
            });
        });
    });

    return { conflicts, graph: { nodes, links } };
}
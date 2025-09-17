import { describe, it, beforeAll, expect } from 'vitest';
import path from 'path';
import { getCostCategoriesAsJSON, createFileFromPath } from '../src/lib/utils.js';

describe('Cost Bucket Circular Dependencies Analysis', () => {
    let tunowData;
    let allBusinessMappings;

    beforeAll(async () => {
        const filePath = path.resolve(process.cwd(), 'costcat/tunow.json');
        const tunowFile = await createFileFromPath(filePath);
        tunowData = await getCostCategoriesAsJSON(tunowFile);

        // Extract all business mappings for comprehensive analysis
        allBusinessMappings = tunowData.resource?.businessMappings || tunowData.businessMappings;
    });

    function analyzeCostBucketCircularDependencies(businessMappings) {
        // JSON Structure (from utils.js analysis):
        // businessMappings[] = Cost Categories (e.g., "Business Units", "Business Domains")
        //   ├── mapping.costTargets[] = Cost Buckets (e.g., "onetru", "tuca")
        //       ├── costTarget.rules[] = Rules within each cost bucket
        //           ├── rule.viewConditions[] = Dependency conditions
        //               ├── condition.viewField.fieldName = Field type ("Mapped Product", "Business Units")
        //               └── condition.values[] = Referenced values (other buckets/categories)

        const circularDependencies = [];
        const dependencyMap = new Map(); // costBucketName -> [dependencies]
        const allCostBuckets = new Set(); // All cost target/bucket names
        const allCostCategories = new Set(); // All cost category names

        const analysis = {
            totalCategories: businessMappings.length,
            totalCostBuckets: 0,
            totalRules: 0,
            totalConditions: 0,
            businessMappingConditions: 0,
            totalValues: 0,
            businessMappingValues: 0,
            circularDependencies: 0,
            directCircularReferences: 0,
            indirectCircularChains: 0,
            bucketToCategoryReferences: 0,
            bucketToBucketReferences: 0,
            categoryToCategoryReferences: 0
        };

        // First pass: collect all cost category names and cost target names
        businessMappings.forEach(category => {
            const categoryName = category.name.toLowerCase();
            allCostCategories.add(categoryName);

            category.costTargets?.forEach(target => {
                const costBucketName = target.name.toLowerCase();
                allCostBuckets.add(costBucketName);
                analysis.totalCostBuckets++;

                if (!dependencyMap.has(costBucketName)) {
                    dependencyMap.set(costBucketName, []);
                }

                analysis.totalRules += target.rules?.length || 0;

                target.rules?.forEach((rule, ruleIndex) => {
                    rule.viewConditions?.forEach((condition, condIndex) => {
                        const values = condition.values || [];
                        const identifier = condition.viewField?.identifier;
                        const identifierName = condition.viewField?.identifierName;

                        analysis.totalConditions++;
                        analysis.totalValues += values.length;

                        // Only check BUSINESS_MAPPING with Cost Categories
                        if (identifier === "BUSINESS_MAPPING" && identifierName === "Cost Categories") {
                            analysis.businessMappingConditions++;
                            analysis.businessMappingValues += values.length;

                            values.forEach(value => {
                                const dependencyName = value.toLowerCase();
                                const fieldName = condition.viewField?.fieldName;

                                // Determine the type of reference
                                let referenceType = 'unknown';
                                if (fieldName === 'Business Units') {
                                    // This is a cost bucket referencing cost categories
                                    referenceType = 'bucket_to_category';
                                    analysis.categoryToCategoryReferences++;
                                } else if (fieldName === 'Mapped Product') {
                                    // This could be bucket->category or bucket->bucket
                                    if (allCostCategories.has(dependencyName)) {
                                        referenceType = 'bucket_to_category';
                                        analysis.bucketToCategoryReferences++;
                                    } else if (allCostBuckets.has(dependencyName)) {
                                        referenceType = 'bucket_to_bucket';
                                        analysis.bucketToBucketReferences++;
                                    }
                                }

                                // Find which category this dependency belongs to
                                let dependencyCategory = 'unknown';
                                for (const mapping of businessMappings) {
                                    if (mapping.costTargets && mapping.costTargets.some(target => target.name === dependencyName)) {
                                        dependencyCategory = mapping.name;
                                        break;
                                    }
                                }

                                dependencyMap.get(costBucketName).push({
                                    dependency: dependencyName,
                                    categoryName: category.name,
                                    targetName: target.name,
                                    dependencyCategory,
                                    ruleIndex,
                                    conditionIndex: condIndex,
                                    fieldName: condition.viewField?.fieldName,
                                    fieldId: condition.viewField?.fieldId,
                                    operator: condition.viewOperator,
                                    referenceType
                                });
                            });
                        }
                    });
                });
            });
        });

        // Second pass: find circular dependencies
        for (const [costBucketName, dependencies] of dependencyMap.entries()) {
            dependencies.forEach(dep => {
                const dependencyName = dep.dependency;

                // Check for different types of circular references
                if (dep.referenceType === 'bucket_to_category' && allCostCategories.has(dependencyName)) {
                    // Cost bucket referencing a cost category (normal, not circular)
                    // Only circular if bucket name matches category name
                    if (dependencyName === costBucketName) {
                        // Self-reference: bucket references category with same name
                        analysis.directCircularReferences++;
                        circularDependencies.push({
                            type: 'bucket_category_self_reference',
                            costBucket: costBucketName,
                            dependency: dependencyName,
                            level: 'bucket_to_category',
                            ...dep
                        });
                    }
                } else if (dep.referenceType === 'bucket_to_bucket' && allCostBuckets.has(dependencyName)) {
                    // Cost bucket referencing another cost bucket
                    if (dependencyName === costBucketName && dep.categoryName === dep.dependencyCategory) {
                        // TRUE Self-reference: bucket references itself within SAME category
                        analysis.directCircularReferences++;
                        circularDependencies.push({
                            type: 'bucket_self_reference',
                            costBucket: costBucketName,
                            dependency: dependencyName,
                            level: 'bucket',
                            ...dep
                        });
                    } else if (dependencyName === costBucketName && dep.categoryName !== dep.dependencyCategory) {
                        // Cross-category reference with same name (VALID, not circular)
                        console.log(`✅ Valid cross-category reference: ${dep.categoryName}."${costBucketName}" → ${dep.dependencyCategory}."${dependencyName}"`);
                    } else {
                        // Check if the dependency also depends back on this cost bucket
                        const reverseDependencies = dependencyMap.get(dependencyName) || [];
                        const hasReverseReference = reverseDependencies.some(revDep =>
                            revDep.dependency === costBucketName
                        );

                        if (hasReverseReference) {
                            analysis.directCircularReferences++;
                            circularDependencies.push({
                                type: 'bucket_mutual_reference',
                                costBucket: costBucketName,
                                dependency: dependencyName,
                                level: 'bucket',
                                ...dep
                            });
                        }

                        // Check for indirect circular chains (A -> B -> C -> A)
                        const visited = new Set();
                        const path = [costBucketName];

                        function findCircularChain(current, target, currentPath) {
                            if (visited.has(current)) return false;
                            if (current === target && currentPath.length > 2) {
                                return currentPath;
                            }

                            visited.add(current);
                            const currentDeps = dependencyMap.get(current) || [];

                            for (const currentDep of currentDeps) {
                                if (allCostBuckets.has(currentDep.dependency)) {
                                    const result = findCircularChain(
                                        currentDep.dependency,
                                        target,
                                        [...currentPath, currentDep.dependency]
                                    );
                                    if (result) return result;
                                }
                            }

                            visited.delete(current);
                            return false;
                        }

                        const circularChain = findCircularChain(dependencyName, costBucketName, [costBucketName, dependencyName]);
                        if (circularChain && circularChain.length > 2) {
                            analysis.indirectCircularChains++;
                            circularDependencies.push({
                                type: 'bucket_indirect_chain',
                                costBucket: costBucketName,
                                dependency: dependencyName,
                                chain: circularChain,
                                level: 'bucket',
                                ...dep
                            });
                        }
                    }
                }
            });
        }

        analysis.circularDependencies = circularDependencies.length;

        return { circularDependencies, dependencyMap, allCostBuckets, allCostCategories, analysis };
    }

    function analyzeRuleComplexity(businessMappings) {
        const bucketDetails = [];
        let totalRules = 0;
        let totalConditions = 0;
        let totalValues = 0;
        let totalCostBuckets = 0;

        businessMappings.forEach(mapping => {
            const categoryName = mapping.name;

            if (!mapping.costTargets || !Array.isArray(mapping.costTargets)) {
                return;
            }

            mapping.costTargets.forEach(costTarget => {
                const bucketName = costTarget.name;
                totalCostBuckets++;

                if (!costTarget.rules || !Array.isArray(costTarget.rules)) {
                    bucketDetails.push({
                        category: categoryName,
                        name: bucketName,
                        ruleCount: 0,
                        conditionCount: 0,
                        valueCount: 0,
                        complexityScore: 0,
                        evaluationCost: 0,
                        rules: []
                    });
                    return;
                }

                let bucketRuleCount = 0;
                let bucketConditionCount = 0;
                let bucketValueCount = 0;
                const ruleDetails = [];

                costTarget.rules.forEach(rule => {
                    bucketRuleCount++;
                    totalRules++;

                    if (!rule.viewConditions || !Array.isArray(rule.viewConditions)) {
                        return;
                    }

                    let ruleConditionCount = 0;
                    let ruleValueCount = 0;
                    const conditionDetails = [];

                    rule.viewConditions.forEach(condition => {
                        ruleConditionCount++;
                        bucketConditionCount++;
                        totalConditions++;

                        const values = condition.values || [];
                        const valueCount = values.length;
                        ruleValueCount += valueCount;
                        bucketValueCount += valueCount;
                        totalValues += valueCount;

                        conditionDetails.push({
                            fieldName: condition.viewField?.fieldName || 'unknown',
                            fieldId: condition.viewField?.fieldId || 'unknown',
                            operator: condition.viewOperator || 'unknown',
                            valueCount: valueCount,
                            values: values
                        });
                    });

                    ruleDetails.push({
                        conditionCount: ruleConditionCount,
                        valueCount: ruleValueCount,
                        conditions: conditionDetails
                    });
                });

                // Calculate complexity score
                // Formula: (rules * conditions * values) + (values^2 for large value sets)
                const baseComplexity = bucketRuleCount * bucketConditionCount * bucketValueCount;
                const valueComplexity = bucketValueCount > 50 ? Math.pow(bucketValueCount, 1.5) : bucketValueCount;
                const complexityScore = Math.round(baseComplexity + valueComplexity);

                // Calculate evaluation cost (estimated operations)
                const evaluationCost = bucketRuleCount * bucketConditionCount * bucketValueCount;

                bucketDetails.push({
                    category: categoryName,
                    name: bucketName,
                    ruleCount: bucketRuleCount,
                    conditionCount: bucketConditionCount,
                    valueCount: bucketValueCount,
                    complexityScore: complexityScore,
                    evaluationCost: evaluationCost,
                    rules: ruleDetails
                });
            });
        });

        // Sort by complexity score (descending)
        bucketDetails.sort((a, b) => b.complexityScore - a.complexityScore);

        const ruleComplexityAnalysis = {
            totalCostBuckets,
            totalRules,
            totalConditions,
            totalValues,
            avgRulesPerBucket: totalCostBuckets > 0 ? totalRules / totalCostBuckets : 0,
            avgConditionsPerRule: totalRules > 0 ? totalConditions / totalRules : 0,
            avgValuesPerCondition: totalConditions > 0 ? totalValues / totalConditions : 0,
            bucketDetails,
            topComplexBuckets: bucketDetails.slice(0, 20)
        };

        return { ruleComplexityAnalysis };
    }

    function analyzeRulePerformance(businessMappings) {
        const inRules = [];
        const likeRules = [];
        const highValueRules = [];
        const edlIssues = [];
        const likeOptimizations = [];
        const topIssues = [];
        let totalRules = 0;

        businessMappings.forEach(mapping => {
            const categoryName = mapping.name;

            if (!mapping.costTargets || !Array.isArray(mapping.costTargets)) {
                return;
            }

            mapping.costTargets.forEach(costTarget => {
                const bucketName = costTarget.name;

                if (!costTarget.rules || !Array.isArray(costTarget.rules)) {
                    return;
                }

                costTarget.rules.forEach((rule, ruleIndex) => {
                    totalRules++;

                    if (!rule.viewConditions || !Array.isArray(rule.viewConditions)) {
                        return;
                    }

                    rule.viewConditions.forEach((condition, conditionIndex) => {
                        const operator = condition.viewOperator;
                        const values = condition.values || [];
                        const fieldName = condition.viewField?.fieldName || 'unknown';
                        const fieldId = condition.viewField?.fieldId || 'unknown';

                        const ruleInfo = {
                            bucket: bucketName,
                            category: categoryName,
                            ruleIndex,
                            conditionIndex,
                            fieldName,
                            fieldId,
                            operator,
                            valueCount: values.length,
                            values: values
                        };

                        // Analyze operator performance
                        if (operator === 'IN') {
                            inRules.push({
                                ...ruleInfo,
                                performance: 'HIGH',
                                reason: 'Uses indexed lookup'
                            });
                        } else if (operator === 'LIKE') {
                            likeRules.push({
                                ...ruleInfo,
                                performance: 'LOW',
                                reason: 'Requires table scan'
                            });

                            // Check for LIKE optimization opportunities
                            const likePatterns = values.filter(v => typeof v === 'string');
                            const prefixPatterns = likePatterns.filter(v => v.startsWith('^') || v.endsWith('%'));

                            if (prefixPatterns.length > 1) {
                                // Group by common prefixes
                                const prefixGroups = {};
                                prefixPatterns.forEach(pattern => {
                                    const prefix = pattern.replace(/[\^%\*]/g, '').substring(0, 10);
                                    if (!prefixGroups[prefix]) prefixGroups[prefix] = [];
                                    prefixGroups[prefix].push(pattern);
                                });

                                Object.entries(prefixGroups).forEach(([prefix, patterns]) => {
                                    if (patterns.length > 1) {
                                        likeOptimizations.push({
                                            ...ruleInfo,
                                            prefix,
                                            patterns,
                                            optimization: `Combine ${patterns.length} LIKE patterns with common prefix "${prefix}"`
                                        });
                                    }
                                });
                            }
                        }

                        // Check for LIKE operators (real performance issue)
                        if (operator === 'LIKE') {
                            highValueRules.push({
                                ...ruleInfo,
                                performance: 'CRITICAL',
                                reason: `LIKE operator requires full table scan - major performance issue`
                            });
                        }

                        // Check for EDL-related LIKE performance issues
                        if (bucketName.toLowerCase().includes('edl') && operator === 'LIKE') {
                            edlIssues.push({
                                ...ruleInfo,
                                performance: 'CRITICAL',
                                reason: `EDL bucket with LIKE operator causes cascading table scan performance issues`
                            });
                        }

                        // Identify top performance issues (focus on LIKE operators)
                        let issueScore = 0;
                        let issue = '';
                        let impact = '';
                        let recommendation = '';

                        if (operator === 'LIKE') {
                            issueScore += values.length * 1000; // LIKE is extremely expensive
                            issue = `LIKE operator with ${values.length} patterns`;
                            impact = 'Requires full table scan for each pattern - cannot use indexes';
                            recommendation = 'Convert to IN operator with exact matches or combine patterns with single regex';
                        } else if (bucketName.toLowerCase().includes('edl') && operator === 'LIKE') {
                            issueScore += values.length * 2000; // EDL + LIKE is worst case
                            issue = `EDL bucket with LIKE operator`;
                            impact = 'Referenced by other buckets causing cascading table scans';
                            recommendation = 'Convert LIKE patterns to IN operators or cache results';
                        }

                        if (issueScore > 100) {
                            topIssues.push({
                                bucket: bucketName,
                                category: categoryName,
                                issue,
                                impact,
                                recommendation,
                                score: issueScore,
                                operator,
                                valueCount: values.length
                            });
                        }
                    });
                });
            });
        });

        // Sort top issues by score
        topIssues.sort((a, b) => b.score - a.score);

        return {
            totalRules,
            inRules,
            likeRules,
            highValueRules,
            edlIssues,
            likeOptimizations,
            topIssues: topIssues.slice(0, 20)
        };
    }

    function generateHTMLOptimizationReport(report) {
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rule Optimization Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
        .metric { background: #ecf0f1; padding: 15px; border-radius: 5px; text-align: center; }
        .metric-value { font-size: 24px; font-weight: bold; color: #2c3e50; }
        .metric-label { color: #7f8c8d; font-size: 14px; }
        .high-performance { background-color: #d5f4e6; border-left: 4px solid #27ae60; }
        .low-performance { background-color: #fadbd8; border-left: 4px solid #e74c3c; }
        .critical-performance { background-color: #f8d7da; border-left: 4px solid #dc3545; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; font-weight: bold; }
        .operator-in { color: #27ae60; font-weight: bold; }
        .operator-like { color: #e74c3c; font-weight: bold; }
        .value-count-high { color: #e67e22; font-weight: bold; }
        .optimization { background-color: #fff3cd; padding: 10px; border-radius: 5px; margin: 5px 0; border-left: 4px solid #ffc107; }
        .issue-critical { background-color: #f8d7da; }
        .issue-high { background-color: #fadbd8; }
        .issue-medium { background-color: #fff3cd; }
        .code { background-color: #f8f9fa; padding: 2px 4px; border-radius: 3px; font-family: monospace; }
        .recommendation { background-color: #d1ecf1; padding: 10px; border-radius: 5px; margin: 5px 0; border-left: 4px solid #17a2b8; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Rule Optimization Report</h1>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>

        <div class="summary">
            <div class="metric">
                <div class="metric-value">${report.totalRules}</div>
                <div class="metric-label">Total Rules</div>
            </div>
            <div class="metric high-performance">
                <div class="metric-value">${report.inRules.length}</div>
                <div class="metric-label">High-Performance (IN)</div>
            </div>
            <div class="metric low-performance">
                <div class="metric-value">${report.likeRules.length}</div>
                <div class="metric-label">Low-Performance (LIKE)</div>
            </div>
            <div class="metric critical-performance">
                <div class="metric-value">${report.edlIssues.length}</div>
                <div class="metric-label">Critical EDL Issues</div>
            </div>
        </div>

        <h2>🚨 Top Performance Issues</h2>
        <table>
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Bucket</th>
                    <th>Category</th>
                    <th>Issue</th>
                    <th>Impact Score</th>
                    <th>Operator</th>
                    <th>Values</th>
                    <th>Recommendation</th>
                </tr>
            </thead>
            <tbody>
                ${report.topIssues.map((issue, index) => `
                <tr class="${issue.score > 1000 ? 'issue-critical' : issue.score > 500 ? 'issue-high' : 'issue-medium'}">
                    <td>${index + 1}</td>
                    <td><strong>${issue.bucket}</strong></td>
                    <td>${issue.category}</td>
                    <td>${issue.issue}</td>
                    <td><strong>${issue.score}</strong></td>
                    <td><span class="operator-${issue.operator.toLowerCase()}">${issue.operator}</span></td>
                    <td class="${issue.valueCount > 100 ? 'value-count-high' : ''}">${issue.valueCount}</td>
                    <td class="recommendation">${issue.recommendation}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>

        <h2>⚡ LIKE Operator Optimizations</h2>
        <p>LIKE operators require full table scans and should be optimized or replaced with IN operators when possible.</p>

        ${report.likeOptimizations.length > 0 ? `
        <h3>🔧 Suggested LIKE Combinations</h3>
        ${report.likeOptimizations.map(opt => `
        <div class="optimization">
            <strong>${opt.bucket}</strong> (${opt.category})<br>
            <strong>Current:</strong> ${opt.patterns.length} separate LIKE patterns<br>
            <strong>Patterns:</strong> <span class="code">${opt.patterns.slice(0, 3).join(', ')}${opt.patterns.length > 3 ? '...' : ''}</span><br>
            <strong>Optimization:</strong> ${opt.optimization}<br>
            <strong>Example Combined Pattern:</strong> <span class="code">^${opt.prefix}(demo|prod|dev|qa)-</span>
        </div>
        `).join('')}
        ` : '<p>✅ No LIKE optimization opportunities found.</p>'}

        <h2>📊 Operator Performance Analysis</h2>

        <h3 class="high-performance">✅ High-Performance Rules (IN Operator)</h3>
        <p>These rules use indexed lookups and perform well:</p>
        <table>
            <thead>
                <tr><th>Bucket</th><th>Category</th><th>Field</th><th>Values</th><th>Performance</th></tr>
            </thead>
            <tbody>
                ${report.inRules.slice(0, 10).map(rule => `
                <tr>
                    <td>${rule.bucket}</td>
                    <td>${rule.category}</td>
                    <td>${rule.fieldName}</td>
                    <td>${rule.valueCount}</td>
                    <td class="operator-in">EXCELLENT</td>
                </tr>
                `).join('')}
                ${report.inRules.length > 10 ? `<tr><td colspan="5"><em>... and ${report.inRules.length - 10} more high-performance rules</em></td></tr>` : ''}
            </tbody>
        </table>

        <h3 class="low-performance">⚠️ Low-Performance Rules (LIKE Operator)</h3>
        <p>These rules require table scans and should be optimized:</p>
        <table>
            <thead>
                <tr><th>Bucket</th><th>Category</th><th>Field</th><th>Patterns</th><th>Impact</th><th>Recommendation</th></tr>
            </thead>
            <tbody>
                ${report.likeRules.map(rule => `
                <tr>
                    <td>${rule.bucket}</td>
                    <td>${rule.category}</td>
                    <td>${rule.fieldName}</td>
                    <td class="value-count-high">${rule.valueCount}</td>
                    <td class="operator-like">TABLE SCAN</td>
                    <td>Convert to IN or combine patterns</td>
                </tr>
                `).join('')}
            </tbody>
        </table>

        <h2>🔥 High-Value Count Rules</h2>
        <p>Rules with many values (>50) can cause performance issues regardless of operator:</p>
        <table>
            <thead>
                <tr><th>Bucket</th><th>Category</th><th>Field</th><th>Operator</th><th>Value Count</th><th>Recommendation</th></tr>
            </thead>
            <tbody>
                ${report.highValueRules.map(rule => `
                <tr>
                    <td>${rule.bucket}</td>
                    <td>${rule.category}</td>
                    <td>${rule.fieldName}</td>
                    <td><span class="operator-${rule.operator.toLowerCase()}">${rule.operator}</span></td>
                    <td class="value-count-high">${rule.valueCount}</td>
                    <td>Split into multiple rules or use range conditions</td>
                </tr>
                `).join('')}
            </tbody>
        </table>

        <h2>🚨 EDL Performance Issues</h2>
        <p>EDL buckets with high complexity cause cascading performance problems:</p>
        ${report.edlIssues.length > 0 ? `
        <table>
            <thead>
                <tr><th>Bucket</th><th>Category</th><th>Field</th><th>Values</th><th>Impact</th></tr>
            </thead>
            <tbody>
                ${report.edlIssues.map(issue => `
                <tr class="critical-performance">
                    <td>${issue.bucket}</td>
                    <td>${issue.category}</td>
                    <td>${issue.fieldName}</td>
                    <td class="value-count-high">${issue.valueCount}</td>
                    <td>CRITICAL - Referenced by OneTru and others</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
        ` : '<p>✅ No critical EDL performance issues found.</p>'}

        <h2>💡 Optimization Recommendations</h2>
        <div class="recommendation">
            <h3>Immediate Actions:</h3>
            <ul>
                <li><strong>Replace LIKE with IN:</strong> Convert LIKE patterns to exact matches where possible</li>
                <li><strong>Combine LIKE patterns:</strong> Use regex to combine multiple LIKE patterns with common prefixes</li>
                <li><strong>Index optimization:</strong> Ensure database indexes exist for all IN operator fields</li>
                <li><strong>Cache EDL results:</strong> Implement caching for frequently accessed EDL buckets</li>
            </ul>

            <h3>Long-term Improvements:</h3>
            <ul>
                <li><strong>Split large rules:</strong> Break rules with >100 values into multiple smaller rules</li>
                <li><strong>EDL restructuring:</strong> Split EDL buckets into smaller, more specific buckets</li>
                <li><strong>Query optimization:</strong> Review database query execution plans</li>
                <li><strong>Monitoring:</strong> Implement performance monitoring for rule evaluation times</li>
            </ul>
        </div>

        <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #7f8c8d; text-align: center;">
            <p>Generated by Cost Bucket Analyzer - Rule Performance Analysis Tool</p>
        </footer>
    </div>
</body>
</html>`;
        return html;
    }

    function analyzeRulePerformanceDetailed(businessMappings, targetBucket = null) {
        const inRules = [];
        const likeRules = [];
        const highValueRules = [];
        const targetBucketRules = [];
        const ruleExamples = [];
        let totalRules = 0;

        businessMappings.forEach(mapping => {
            const categoryName = mapping.name;

            if (!mapping.costTargets || !Array.isArray(mapping.costTargets)) {
                return;
            }

            mapping.costTargets.forEach(costTarget => {
                const bucketName = costTarget.name;

                if (!costTarget.rules || !Array.isArray(costTarget.rules)) {
                    return;
                }

                costTarget.rules.forEach((rule, ruleIndex) => {
                    totalRules++;

                    if (!rule.viewConditions || !Array.isArray(rule.viewConditions)) {
                        return;
                    }

                    rule.viewConditions.forEach((condition, conditionIndex) => {
                        const operator = condition.viewOperator;
                        const values = condition.values || [];
                        const fieldName = condition.viewField?.fieldName || 'unknown';
                        const fieldId = condition.viewField?.fieldId || 'unknown';

                        const ruleInfo = {
                            bucket: bucketName,
                            category: categoryName,
                            ruleIndex,
                            conditionIndex,
                            fieldName,
                            fieldId,
                            operator,
                            valueCount: values.length,
                            values: values,
                            rawRule: rule,
                            rawCondition: condition
                        };

                        // Check if this is our target bucket AND has performance issues
                        if (targetBucket && bucketName.toLowerCase().includes(targetBucket.toLowerCase())) {
                            // Only include rules that need optimization (LIKE operators or other performance issues)
                            let needsOptimization = false;
                            let optimization = '';
                            let optimizedRules = [];

                            if (operator === 'LIKE') {
                                needsOptimization = true;
                                // Convert LIKE to IN where possible
                                const exactMatches = values.filter(v => !v.includes('%') && !v.includes('*') && !v.includes('-$'));
                                const patterns = values.filter(v => v.includes('%') || v.includes('*') || v.includes('-$'));

                                if (exactMatches.length > 0) {
                                    optimizedRules.push({
                                        ruleName: `${bucketName}_exact_matches`,
                                        operator: 'IN',
                                        values: exactMatches,
                                        fieldName: fieldName
                                    });
                                }

                                if (patterns.length > 0) {
                                    // Check if patterns can be combined
                                    const prefixPatterns = patterns.filter(p => p.endsWith('-'));
                                    if (prefixPatterns.length > 1) {
                                        const combinedPattern = `^(${prefixPatterns.map(p => p.replace('-', '')).join('|')})-`;
                                        optimizedRules.push({
                                            ruleName: `${bucketName}_combined_patterns`,
                                            operator: 'REGEXP',
                                            values: [combinedPattern],
                                            fieldName: fieldName
                                        });
                                        optimization = `Convert ${patterns.length} LIKE patterns to 1 REGEXP pattern + ${exactMatches.length} exact matches (IN)`;
                                    } else {
                                        optimizedRules.push({
                                            ruleName: `${bucketName}_patterns`,
                                            operator: 'LIKE',
                                            values: patterns,
                                            fieldName: fieldName
                                        });
                                        optimization = `Convert ${exactMatches.length} exact matches to IN operator, keep ${patterns.length} LIKE patterns`;
                                    }
                                } else {
                                    optimization = `Convert all ${exactMatches.length} LIKE patterns to IN operator (100-1000x performance improvement)`;
                                }
                            } else if (operator === 'NOT_IN' && values.length > 10) {
                                needsOptimization = true;
                                optimization = `NOT_IN with ${values.length} values can be slow - consider restructuring logic`;
                            }

                            // Only add to report if optimization is needed
                            if (needsOptimization) {
                                targetBucketRules.push({
                                    ...ruleInfo,
                                    optimization,
                                    optimizedRules,
                                    currentRule: {
                                        operator: operator,
                                        values: values.slice(0, 10), // First 10 for display
                                        totalValues: values.length
                                    },
                                    performanceIssue: operator === 'LIKE' ? 'CRITICAL' : 'MEDIUM'
                                });
                            }
                        }

                        // Standard categorization
                        if (operator === 'IN') {
                            inRules.push(ruleInfo);
                        } else if (operator === 'LIKE') {
                            likeRules.push(ruleInfo);
                        }

                        if (values.length > 50) {
                            highValueRules.push(ruleInfo);
                        }

                        // Collect examples for the report
                        if (bucketName.toLowerCase().includes(targetBucket?.toLowerCase() || '')) {
                            ruleExamples.push({
                                bucket: bucketName,
                                category: categoryName,
                                field: fieldName,
                                operator: operator,
                                sampleValues: values.slice(0, 5),
                                totalValues: values.length,
                                fullRule: {
                                    viewField: condition.viewField,
                                    viewOperator: operator,
                                    values: values
                                }
                            });
                        }
                    });
                });
            });
        });

        return {
            totalRules,
            inRules,
            likeRules,
            highValueRules,
            targetBucketRules,
            ruleExamples
        };
    }

    function generateDetailedHTMLOptimizationReport(report, targetBucket) {
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Detailed Rule Optimization Report - ${targetBucket.toUpperCase()}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1400px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        h3 { color: #2c3e50; margin-top: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
        .metric { background: #ecf0f1; padding: 15px; border-radius: 5px; text-align: center; }
        .metric-value { font-size: 24px; font-weight: bold; color: #2c3e50; }
        .metric-label { color: #7f8c8d; font-size: 14px; }
        .rule-example { background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 5px; margin: 15px 0; padding: 15px; }
        .rule-current { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 10px 0; }
        .rule-optimized { background-color: #d1ecf1; border-left: 4px solid #17a2b8; padding: 10px; margin: 10px 0; }
        .code { background-color: #f8f9fa; padding: 8px; border-radius: 3px; font-family: 'Courier New', monospace; font-size: 12px; overflow-x: auto; }
        .json-code { background-color: #2d3748; color: #e2e8f0; padding: 15px; border-radius: 5px; font-family: 'Courier New', monospace; font-size: 12px; overflow-x: auto; white-space: pre-wrap; }
        .values-list { max-height: 200px; overflow-y: auto; background-color: #f8f9fa; padding: 10px; border-radius: 3px; margin: 5px 0; }
        .optimization-benefit { background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px; padding: 10px; margin: 10px 0; }
        .performance-impact { background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 5px; padding: 10px; margin: 10px 0; }
        .split-rule { background-color: #e2f3ff; border: 1px solid #b8daff; border-radius: 5px; padding: 10px; margin: 5px 0; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; font-weight: bold; }
        .operator-in { color: #27ae60; font-weight: bold; }
        .operator-like { color: #e74c3c; font-weight: bold; }
        .value-count-high { color: #e67e22; font-weight: bold; }
        .before-after { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
        .before { border-left: 4px solid #e74c3c; }
        .after { border-left: 4px solid #27ae60; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 Detailed Rule Optimization Report - ${targetBucket.toUpperCase()}</h1>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Target Bucket:</strong> ${targetBucket}</p>

        <div class="summary">
            <div class="metric">
                <div class="metric-value">${report.totalRules}</div>
                <div class="metric-label">Total Rules Analyzed</div>
            </div>
            <div class="metric critical-performance">
                <div class="metric-value">${report.targetBucketRules.length}</div>
                <div class="metric-label">${targetBucket.toUpperCase()} Rules Needing Optimization</div>
            </div>
            <div class="metric high-performance">
                <div class="metric-value">${report.ruleExamples.length - report.targetBucketRules.length}</div>
                <div class="metric-label">${targetBucket.toUpperCase()} Rules Already Optimized</div>
            </div>
            <div class="metric">
                <div class="metric-value">${report.targetBucketRules.filter(r => r.performanceIssue === 'CRITICAL').length}</div>
                <div class="metric-label">Critical Issues (LIKE operators)</div>
            </div>
        </div>

        ${report.ruleExamples.length - report.targetBucketRules.length > 0 ? `
        <div class="optimization-benefit">
            <h3>✅ Good News: ${report.ruleExamples.length - report.targetBucketRules.length} ${targetBucket.toUpperCase()} rules are already well-optimized!</h3>
            <p>These rules use efficient IN operators with proper indexing and don't require any changes. Only the ${report.targetBucketRules.length} problematic rules shown below need attention.</p>
        </div>
        ` : ''}

        <h2>🚨 ${targetBucket.toUpperCase()} Rules Requiring Optimization</h2>
        <p><strong>Focus:</strong> Only showing rules with performance issues. LIKE operators require full table scans and must be optimized. Well-performing IN operators are excluded from this report.</p>

        ${report.targetBucketRules.length === 0 ? `
        <div class="optimization-benefit">
            <h3>🎉 Excellent! No ${targetBucket.toUpperCase()} rules need optimization!</h3>
            <p>All ${targetBucket.toUpperCase()} rules are using efficient operators and are already well-optimized.</p>
        </div>
        ` : ''}

        ${report.targetBucketRules.map((rule, index) => `
        <div class="rule-example">
            <h3>Rule ${index + 1}: ${rule.category}.${rule.bucket}</h3>

            <div class="${rule.operator === 'LIKE' ? 'performance-impact' : 'optimization-benefit'}">
                <strong>${rule.operator === 'LIKE' ? '🚨 CRITICAL PERFORMANCE ISSUE' : '✅ GOOD PERFORMANCE'}:</strong><br>
                • Field: ${rule.fieldName}<br>
                • Operator: <span class="operator-${rule.operator.toLowerCase()}">${rule.operator}</span><br>
                • Value Count: ${rule.valueCount}<br>
                • Query Performance: ${rule.operator === 'IN' ? '✅ Fast - Uses Index Lookup' : '🚨 Slow - Requires Full Table Scan'}<br>
                • Index Usage: ${rule.operator === 'IN' ? '✅ Can use database indexes' : '❌ Cannot use indexes effectively'}
            </div>

            <div class="before-after">
                <div class="before">
                    <h4>${rule.operator === 'LIKE' ? '🔴 Current Rule (CRITICAL ISSUE)' : '✅ Current Rule (Good Performance)'}</h4>
                    <div class="json-code">{
  "viewField": {
    "fieldId": "${rule.fieldId}",
    "fieldName": "${rule.fieldName}"
  },
  "viewOperator": "${rule.operator}",
  "values": [
    ${rule.values.slice(0, 10).map(v => `"${v}"`).join(',\n    ')}${rule.valueCount > 10 ? `,\n    ... and ${rule.valueCount - 10} more values` : ''}
  ]
}</div>
                    ${rule.operator === 'LIKE' ? `
                    <div class="performance-impact">
                        <strong>🚨 Critical Issues with LIKE:</strong><br>
                        • Requires full table scan - cannot use indexes<br>
                        • Scans every row in the database table<br>
                        • Performance degrades linearly with table size<br>
                        • Blocks other queries during scan<br>
                        • Major bottleneck for OneTru performance
                    </div>
                    ` : `
                    <div class="optimization-benefit">
                        <strong>✅ IN Operator is Efficient:</strong><br>
                        • Uses database indexes for fast lookup<br>
                        • O(log n) performance with proper indexing<br>
                        • Scales well with large datasets<br>
                        • ${rule.valueCount} values is perfectly fine for IN operator<br>
                        • No optimization needed - this rule performs well
                    </div>
                    `}
                </div>

                <div class="after">
                    <h4>✅ Optimized Rules (CRITICAL - Must Fix)</h4>
                    ${rule.optimizedRules && rule.optimizedRules.length > 0 ?
                        rule.optimizedRules.map((optRule, optIndex) => `
                        <div class="split-rule">
                            <strong>Optimized Rule ${optIndex + 1}: ${optRule.ruleName}</strong>
                            <div class="json-code">{
  "viewField": {
    "fieldId": "${rule.fieldId}",
    "fieldName": "${optRule.fieldName}"
  },
  "viewOperator": "${optRule.operator}",
  "values": [
    ${optRule.values.slice(0, 5).map(v => `"${v}"`).join(',\n    ')}${optRule.values.length > 5 ? `,\n    ... ${optRule.values.length - 5} more values` : ''}
  ]
}</div>
                        </div>
                        `).join('')
                        :
                        `<div class="split-rule">
                            <strong>Convert LIKE to IN:</strong> Replace pattern matching with exact value matching
                        </div>`
                    }
                    <div class="optimization-benefit">
                        <strong>🚀 Performance Benefits:</strong><br>
                        • 100-1000x faster query execution<br>
                        • Uses database indexes instead of table scans<br>
                        • Eliminates OneTru performance bottleneck<br>
                        • Scales with database size<br>
                        • Reduces server load dramatically
                    </div>
                </div>
            </div>

            <div class="optimization-benefit">
                <strong>💡 Optimization Strategy:</strong> ${rule.optimization || 'Split into smaller, more manageable rules'}
            </div>

            <h4>📋 Sample Values (First 20)</h4>
            <div class="values-list">
                ${rule.values.slice(0, 20).map((value, i) => `${i + 1}. "${value}"`).join('<br>')}
                ${rule.valueCount > 20 ? `<br><em>... and ${rule.valueCount - 20} more values</em>` : ''}
            </div>
        </div>
        `).join('')}

        <h2>📈 Performance Improvement Estimates</h2>
        <table>
            <thead>
                <tr>
                    <th>Metric</th>
                    <th>Current</th>
                    <th>After Optimization</th>
                    <th>Improvement</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Query Execution Time</td>
                    <td>${report.targetBucketRules.reduce((sum, rule) => sum + rule.valueCount, 0)}ms (estimated)</td>
                    <td>${Math.ceil(report.targetBucketRules.reduce((sum, rule) => sum + rule.valueCount, 0) / 10)}ms (estimated)</td>
                    <td class="optimization-benefit">10x faster</td>
                </tr>
                <tr>
                    <td>Memory Usage</td>
                    <td>High (large value arrays)</td>
                    <td>Low (smaller chunks)</td>
                    <td class="optimization-benefit">50-80% reduction</td>
                </tr>
                <tr>
                    <td>SQL Query Complexity</td>
                    <td>Very High</td>
                    <td>Moderate</td>
                    <td class="optimization-benefit">Significant reduction</td>
                </tr>
                <tr>
                    <td>Maintainability</td>
                    <td>Difficult</td>
                    <td>Easy</td>
                    <td class="optimization-benefit">Much easier to debug</td>
                </tr>
            </tbody>
        </table>

        <h2>🛠️ Implementation Steps</h2>
        <div class="optimization-benefit">
            <h3>Phase 1: Immediate (Low Risk)</h3>
            <ol>
                <li><strong>Backup current rules:</strong> Export existing ${targetBucket.toUpperCase()} rule configuration</li>
                <li><strong>Create test environment:</strong> Set up staging environment for testing</li>
                <li><strong>Implement caching:</strong> Add result caching for ${targetBucket.toUpperCase()} evaluations</li>
                <li><strong>Monitor performance:</strong> Establish baseline metrics</li>
            </ol>

            <h3>Phase 2: Rule Optimization (Medium Risk)</h3>
            <ol>
                <li><strong>Split large rules:</strong> Break rules with >100 values into chunks of 50</li>
                <li><strong>Test functionality:</strong> Verify cost allocation accuracy</li>
                <li><strong>Performance testing:</strong> Measure improvement in staging</li>
                <li><strong>Gradual rollout:</strong> Deploy to production with monitoring</li>
            </ol>

            <h3>Phase 3: Architecture Review (Higher Risk)</h3>
            <ol>
                <li><strong>Rule restructuring:</strong> Consider fundamental changes to ${targetBucket.toUpperCase()} architecture</li>
                <li><strong>Database optimization:</strong> Review indexes and query plans</li>
                <li><strong>Alternative approaches:</strong> Evaluate different rule evaluation strategies</li>
            </ol>
        </div>

        <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #7f8c8d; text-align: center;">
            <p>Generated by Cost Bucket Analyzer - Detailed Rule Performance Analysis Tool</p>
            <p>Focus: ${targetBucket.toUpperCase()} Bucket Optimization</p>
        </footer>
    </div>
</body>
</html>`;
        return html;
    }



    it('should analyze cost bucket circular dependencies across all categories', () => {
        expect(allBusinessMappings).toBeDefined();
        expect(allBusinessMappings.length).toBeGreaterThan(0);

        const { circularDependencies, dependencyMap, allCostBuckets, allCostCategories, analysis } = analyzeCostBucketCircularDependencies(allBusinessMappings);

        console.log('\n🎯 COST BUCKET CIRCULAR DEPENDENCIES ANALYSIS');
        console.log('='.repeat(80));

        console.log('\n📊 BUSINESS MAPPINGS OVERVIEW:');
        console.log('-'.repeat(50));
        console.log(`Total Cost Categories: ${analysis.totalCategories}`);
        console.log(`Total Cost Buckets: ${analysis.totalCostBuckets}`);
        console.log(`Total Rules: ${analysis.totalRules}`);
        console.log(`Total Conditions: ${analysis.totalConditions}`);
        console.log(`Total Values: ${analysis.totalValues}`);
        console.log(`BUSINESS_MAPPING Conditions: ${analysis.businessMappingConditions}`);
        console.log(`BUSINESS_MAPPING Values: ${analysis.businessMappingValues}`);

        console.log('\n🔄 CIRCULAR DEPENDENCY ANALYSIS:');
        console.log('-'.repeat(50));
        console.log('(Checking BUSINESS_MAPPING fields with "Cost Categories" identifier)');
        console.log(`Total Circular Dependencies: ${analysis.circularDependencies}`);
        console.log(`Direct Circular References: ${analysis.directCircularReferences}`);
        console.log(`Indirect Circular Chains: ${analysis.indirectCircularChains}`);
        console.log(`Circular Percentage: ${analysis.businessMappingValues > 0 ? ((analysis.circularDependencies / analysis.businessMappingValues) * 100).toFixed(1) : 0}%`);

        console.log('\n📊 REFERENCE TYPE BREAKDOWN:');
        console.log('-'.repeat(50));
        console.log(`Bucket → Category References: ${analysis.categoryToCategoryReferences}`);
        console.log(`Bucket → Category References (via Mapped Product): ${analysis.bucketToCategoryReferences}`);
        console.log(`Bucket → Bucket References: ${analysis.bucketToBucketReferences}`);

        console.log('\n📋 ALL COST CATEGORIES:');
        console.log('-'.repeat(50));
        const costCategoryArray = Array.from(allCostCategories).sort();
        costCategoryArray.forEach((category, index) => {
            console.log(`${index + 1}. ${category}`);
        });

        console.log('\n🎯 ALL COST BUCKETS (COST TARGETS):');
        console.log('-'.repeat(50));
        const costBucketArray = Array.from(allCostBuckets).sort();
        console.log(`Total: ${costBucketArray.length} cost buckets`);
        costBucketArray.slice(0, 20).forEach((bucket, index) => {
            console.log(`${index + 1}. ${bucket}`);
        });
        if (costBucketArray.length > 20) {
            console.log(`... and ${costBucketArray.length - 20} more cost buckets`);
        }

        if (circularDependencies.length > 0) {
            console.log('\n🚨 CIRCULAR DEPENDENCY VIOLATIONS:');
            console.log('-'.repeat(50));

            circularDependencies.forEach((dep, index) => {
                console.log(`\n${index + 1}. ${dep.type.toUpperCase()}`);
                console.log(`   Level: ${dep.level || 'unknown'}`);
                console.log(`   Cost Bucket: "${dep.costBucket}"`);
                console.log(`   Depends On: "${dep.dependency}"`);
                console.log(`   Category: ${dep.categoryName}`);
                console.log(`   Cost Target: ${dep.targetName}`);
                console.log(`   Rule ${dep.ruleIndex + 1}, Condition ${dep.conditionIndex + 1}`);
                console.log(`   Field: ${dep.fieldName}`);
                console.log(`   Field ID: ${dep.fieldId}`);
                console.log(`   Reference Type: ${dep.referenceType}`);
                console.log(`   Operator: ${dep.operator}`);

                if (dep.chain) {
                    console.log(`   Circular Chain: ${dep.chain.join(' → ')}`);
                }

                console.log(`   Issue: Cost bucket references itself creating circular dependency`);
            });
        }

        console.log('\n🗂️  DEPENDENCY MAP SAMPLE:');
        console.log('-'.repeat(50));
        let sampleCount = 0;
        for (const [costBucket, dependencies] of dependencyMap.entries()) {
            if (sampleCount >= 10) break;
            if (dependencies.length > 0) {
                console.log(`${costBucket}:`);
                dependencies.slice(0, 3).forEach(dep => {
                    console.log(`  → ${dep.dependency}`);
                });
                if (dependencies.length > 3) {
                    console.log(`  ... and ${dependencies.length - 3} more`);
                }
                sampleCount++;
            }
        }

        expect(analysis).toBeDefined();
        expect(analysis.totalCategories).toBeGreaterThan(0);
    });



    it('should identify specific circular dependency patterns', () => {
        const { circularDependencies, dependencyMap, allCostBuckets, allCostCategories, analysis } = analyzeCostBucketCircularDependencies(allBusinessMappings);

        console.log('\n🔍 SPECIFIC CIRCULAR DEPENDENCY PATTERNS');
        console.log('='.repeat(80));

        // Group by type and level
        const byType = {
            bucket_category_self_reference: [],
            bucket_self_reference: [],
            bucket_mutual_reference: [],
            bucket_indirect_chain: []
        };

        circularDependencies.forEach(dep => {
            if (byType[dep.type]) {
                byType[dep.type].push(dep);
            }
        });

        console.log('\n🔄 BUCKET-CATEGORY SELF-REFERENCES:');
        console.log('-'.repeat(50));
        if (byType.bucket_category_self_reference.length === 0) {
            console.log('✅ No bucket-category self-references found');
        } else {
            byType.bucket_category_self_reference.forEach((dep, index) => {
                console.log(`${index + 1}. Bucket "${dep.costBucket}" references category with same name`);
                console.log(`   Field: ${dep.fieldName} (${dep.fieldId})`);
                console.log(`   Category: ${dep.categoryName}`);
            });
        }

        console.log('\n🎯 COST BUCKET SELF-REFERENCES:');
        console.log('-'.repeat(50));
        if (byType.bucket_self_reference.length === 0) {
            console.log('✅ No bucket self-references found');
        } else {
            byType.bucket_self_reference.forEach((dep, index) => {
                console.log(`${index + 1}. Bucket "${dep.costBucket}" references itself`);
                console.log(`   Field: ${dep.fieldName} (${dep.fieldId})`);
                console.log(`   Category: ${dep.categoryName} → Cost Bucket: ${dep.targetName}`);
            });
        }

        console.log('\n🔄 BUCKET MUTUAL REFERENCES:');
        console.log('-'.repeat(50));
        if (byType.bucket_mutual_reference.length === 0) {
            console.log('✅ No bucket mutual references found');
        } else {
            // Group mutual references by pairs to avoid duplicates
            const pairs = new Set();
            byType.bucket_mutual_reference.forEach((dep, index) => {
                const pair = [dep.costBucket, dep.dependency].sort().join(' ↔ ');
                if (!pairs.has(pair)) {
                    pairs.add(pair);
                    console.log(`${pairs.size}. "${dep.costBucket}" ↔ "${dep.dependency}"`);
                    console.log(`   Category: ${dep.categoryName} → Cost Bucket: ${dep.targetName}`);
                }
            });
        }

        console.log('\n🔄 BUCKET INDIRECT CIRCULAR CHAINS:');
        console.log('-'.repeat(50));
        if (byType.bucket_indirect_chain.length === 0) {
            console.log('✅ No bucket indirect circular chains found');
        } else {
            byType.bucket_indirect_chain.forEach((dep, index) => {
                console.log(`${index + 1}. Chain: ${dep.chain.join(' → ')}`);
                console.log(`   Starting from: ${dep.categoryName} → ${dep.targetName}`);
            });
        }

        console.log('\n📊 PATTERN SUMMARY:');
        console.log('-'.repeat(50));
        console.log(`Bucket-Category Self-References: ${byType.bucket_category_self_reference.length}`);
        console.log(`Bucket Self-References: ${byType.bucket_self_reference.length}`);
        console.log(`Bucket Mutual References: ${byType.bucket_mutual_reference.length}`);
        console.log(`Bucket Indirect Chains: ${byType.bucket_indirect_chain.length}`);
        console.log(`Total Circular Dependencies: ${circularDependencies.length}`);

        expect(analysis).toBeDefined();
    });

    it('should analyze rule complexity and performance bottlenecks', () => {
        console.log('\n🔍 RULE COMPLEXITY AND PERFORMANCE ANALYSIS');
        console.log('='.repeat(80));

        const { ruleComplexityAnalysis } = analyzeRuleComplexity(allBusinessMappings);

        console.log('\n📊 OVERALL COMPLEXITY METRICS:');
        console.log('-'.repeat(50));
        console.log(`Total Cost Buckets: ${ruleComplexityAnalysis.totalCostBuckets}`);
        console.log(`Total Rules: ${ruleComplexityAnalysis.totalRules}`);
        console.log(`Total Conditions: ${ruleComplexityAnalysis.totalConditions}`);
        console.log(`Total Values: ${ruleComplexityAnalysis.totalValues}`);
        console.log(`Average Rules per Bucket: ${ruleComplexityAnalysis.avgRulesPerBucket.toFixed(2)}`);
        console.log(`Average Conditions per Rule: ${ruleComplexityAnalysis.avgConditionsPerRule.toFixed(2)}`);
        console.log(`Average Values per Condition: ${ruleComplexityAnalysis.avgValuesPerCondition.toFixed(2)}`);

        console.log('\n🎯 TOP 10 MOST COMPLEX COST BUCKETS:');
        console.log('-'.repeat(50));
        ruleComplexityAnalysis.topComplexBuckets.slice(0, 10).forEach((bucket, index) => {
            console.log(`${index + 1}. ${bucket.category}."${bucket.name}"`);
            console.log(`   Rules: ${bucket.ruleCount}, Conditions: ${bucket.conditionCount}, Values: ${bucket.valueCount}`);
            console.log(`   Complexity Score: ${bucket.complexityScore}, Evaluation Cost: ${bucket.evaluationCost}`);
            if (bucket.name === 'onetru') {
                console.log(`   ⚠️  THIS IS YOUR PERFORMANCE BOTTLENECK!`);
            }
        });

        console.log('\n🔍 ONETRU DETAILED ANALYSIS:');
        console.log('-'.repeat(50));
        const onetruBucket = ruleComplexityAnalysis.bucketDetails.find(b => b.name === 'onetru');
        if (onetruBucket) {
            console.log(`Category: ${onetruBucket.category}`);
            console.log(`Rules: ${onetruBucket.ruleCount}`);
            console.log(`Conditions: ${onetruBucket.conditionCount}`);
            console.log(`Total Values: ${onetruBucket.valueCount}`);
            console.log(`Complexity Score: ${onetruBucket.complexityScore}`);
            console.log(`Evaluation Cost: ${onetruBucket.evaluationCost}`);
            console.log(`Performance Rank: ${ruleComplexityAnalysis.bucketDetails.findIndex(b => b.name === 'onetru') + 1} of ${ruleComplexityAnalysis.bucketDetails.length}`);

            console.log('\n📋 OneTru Rule Breakdown:');
            onetruBucket.rules.forEach((rule, index) => {
                console.log(`  Rule ${index + 1}: ${rule.conditionCount} conditions, ${rule.valueCount} values`);
                rule.conditions.forEach((condition, condIndex) => {
                    console.log(`    Condition ${condIndex + 1}: ${condition.fieldName} ${condition.operator} [${condition.valueCount} values]`);
                    if (condition.fieldName === 'Mapped Product' && condition.valueCount > 50) {
                        console.log(`      ⚠️  HIGH VALUE COUNT - PERFORMANCE IMPACT!`);
                    }
                });
            });
        } else {
            console.log('❌ OneTru bucket not found');
        }

        console.log('\n📈 PERFORMANCE RECOMMENDATIONS:');
        console.log('-'.repeat(50));
        if (onetruBucket && onetruBucket.complexityScore > 1000) {
            console.log('🚨 OneTru has extremely high complexity score');
            console.log('💡 Recommendations:');
            console.log('   1. Split OneTru into multiple smaller buckets');
            console.log('   2. Reduce the number of values in Mapped Product conditions');
            console.log('   3. Consider using more specific field conditions');
            console.log('   4. Implement caching for frequently evaluated rules');
        } else if (onetruBucket && onetruBucket.complexityScore > 500) {
            console.log('⚠️  OneTru has high complexity score');
            console.log('💡 Recommendations:');
            console.log('   1. Consider reducing the number of values per condition');
            console.log('   2. Optimize rule evaluation order');
            console.log('   3. Add indexing for frequently used values');
        } else {
            console.log('✅ OneTru complexity is within normal range');
        }

        console.log('\n🔍 COMPARISON WITH OTHER BUCKETS:');
        console.log('-'.repeat(50));
        const avgComplexity = ruleComplexityAnalysis.bucketDetails.reduce((sum, b) => sum + b.complexityScore, 0) / ruleComplexityAnalysis.bucketDetails.length;
        console.log(`Average Complexity Score: ${avgComplexity.toFixed(2)}`);
        if (onetruBucket) {
            const complexityRatio = onetruBucket.complexityScore / avgComplexity;
            console.log(`OneTru vs Average: ${complexityRatio.toFixed(2)}x more complex`);
            if (complexityRatio > 10) {
                console.log('🚨 OneTru is significantly more complex than average!');
            }
        }

        expect(ruleComplexityAnalysis).toBeDefined();
        expect(ruleComplexityAnalysis.totalCostBuckets).toBeGreaterThan(0);
    });

    it('should check if OneTru references edl', () => {
        console.log('\n🔍 ONETRU → EDL DEPENDENCY CHECK');
        console.log('='.repeat(80));

        const { dependencyMap } = analyzeCostBucketCircularDependencies(allBusinessMappings);

        const onetruDependencies = dependencyMap.get('onetru') || [];
        const edlReferences = onetruDependencies.filter(dep =>
            dep.dependency && dep.dependency.toLowerCase().includes('edl')
        );

        console.log('\n📊 ONETRU DEPENDENCY SUMMARY:');
        console.log('-'.repeat(50));
        console.log(`Total OneTru Dependencies: ${onetruDependencies.length}`);
        console.log(`EDL References Found: ${edlReferences.length}`);

        if (edlReferences.length > 0) {
            console.log('\n🚨 EDL REFERENCES IN ONETRU:');
            console.log('-'.repeat(50));
            edlReferences.forEach((ref, index) => {
                console.log(`${index + 1}. "${ref.dependency}"`);
                console.log(`   Field: ${ref.fieldName}`);
                console.log(`   Category: ${ref.categoryName}`);
                console.log(`   Rule ${ref.ruleIndex + 1}, Condition ${ref.conditionIndex + 1}`);
            });

            console.log('\n💡 PERFORMANCE IMPACT:');
            console.log('-'.repeat(50));
            console.log('🚨 CRITICAL FINDING: OneTru references EDL!');
            console.log('This could explain the 10x performance degradation:');
            console.log('1. OneTru evaluation triggers EDL evaluation');
            console.log('2. EDL has 437x higher complexity than OneTru');
            console.log('3. Cascading evaluation creates performance bottleneck');
            console.log('4. Each OneTru check potentially evaluates 3,549 EDL values');
        } else {
            console.log('\n✅ NO EDL REFERENCES FOUND');
            console.log('-'.repeat(50));
            console.log('OneTru does not directly reference EDL buckets.');
            console.log('The performance issue must be caused by other factors.');
        }

        console.log('\n📋 ALL ONETRU DEPENDENCIES:');
        console.log('-'.repeat(50));
        console.log('(First 20 dependencies shown)');
        onetruDependencies.slice(0, 20).forEach((dep, index) => {
            console.log(`${index + 1}. "${dep.dependency}" (${dep.fieldName})`);
        });
        if (onetruDependencies.length > 20) {
            console.log(`... and ${onetruDependencies.length - 20} more dependencies`);
        }

        expect(onetruDependencies).toBeDefined();
    });

    it('should evaluate EDL for circular references', () => {
        console.log('\n🔍 EDL CIRCULAR REFERENCE ANALYSIS');
        console.log('='.repeat(80));

        const { dependencyMap, circularDependencies } = analyzeCostBucketCircularDependencies(allBusinessMappings);

        // Find all EDL buckets
        const edlBuckets = [];
        for (const [bucketName, dependencies] of dependencyMap.entries()) {
            if (bucketName.toLowerCase().includes('edl')) {
                edlBuckets.push({
                    name: bucketName,
                    dependencies: dependencies,
                    dependencyCount: dependencies.length
                });
            }
        }

        console.log('\n📊 EDL BUCKETS FOUND:');
        console.log('-'.repeat(50));
        console.log(`Total EDL-related buckets: ${edlBuckets.length}`);

        edlBuckets.forEach((bucket, index) => {
            console.log(`${index + 1}. "${bucket.name}" - ${bucket.dependencyCount} dependencies`);
        });

        // Check for EDL circular references
        const edlCircularRefs = circularDependencies.filter(dep =>
            dep.costBucket.toLowerCase().includes('edl') ||
            dep.dependency.toLowerCase().includes('edl')
        );

        console.log('\n🔄 EDL CIRCULAR REFERENCES:');
        console.log('-'.repeat(50));
        if (edlCircularRefs.length === 0) {
            console.log('✅ No circular references found in EDL buckets');
        } else {
            console.log(`🚨 Found ${edlCircularRefs.length} EDL circular references:`);
            edlCircularRefs.forEach((ref, index) => {
                console.log(`${index + 1}. ${ref.type}: "${ref.costBucket}" → "${ref.dependency}"`);
                console.log(`   Category: ${ref.categoryName}`);
                console.log(`   Field: ${ref.fieldName}`);
            });
        }

        // Check for EDL self-references and mutual references
        console.log('\n🔍 EDL DEPENDENCY ANALYSIS:');
        console.log('-'.repeat(50));

        edlBuckets.forEach(bucket => {
            console.log(`\n📋 "${bucket.name}" dependencies:`);

            // Check for self-references
            const selfRefs = bucket.dependencies.filter(dep =>
                dep.dependency.toLowerCase() === bucket.name.toLowerCase()
            );

            // Check for other EDL references
            const edlRefs = bucket.dependencies.filter(dep =>
                dep.dependency.toLowerCase().includes('edl') &&
                dep.dependency.toLowerCase() !== bucket.name.toLowerCase()
            );

            // Check for references TO this EDL bucket from other buckets
            const referencesToThisBucket = [];
            for (const [otherBucketName, otherDeps] of dependencyMap.entries()) {
                const refsToThis = otherDeps.filter(dep =>
                    dep.dependency.toLowerCase() === bucket.name.toLowerCase()
                );
                if (refsToThis.length > 0) {
                    referencesToThisBucket.push({
                        bucketName: otherBucketName,
                        count: refsToThis.length
                    });
                }
            }

            console.log(`   Self-references: ${selfRefs.length}`);
            console.log(`   References to other EDL buckets: ${edlRefs.length}`);
            console.log(`   Referenced by other buckets: ${referencesToThisBucket.length} buckets`);

            if (selfRefs.length > 0) {
                console.log(`   🚨 SELF-REFERENCE DETECTED!`);
                selfRefs.forEach(ref => {
                    console.log(`      Field: ${ref.fieldName}, Category: ${ref.categoryName}`);
                });
            }

            if (edlRefs.length > 0) {
                console.log(`   ⚠️  EDL cross-references:`);
                edlRefs.slice(0, 5).forEach(ref => {
                    console.log(`      → "${ref.dependency}" (${ref.fieldName})`);
                });
                if (edlRefs.length > 5) {
                    console.log(`      ... and ${edlRefs.length - 5} more EDL references`);
                }
            }

            if (referencesToThisBucket.length > 0) {
                console.log(`   📈 Referenced by: ${referencesToThisBucket.slice(0, 5).map(r => r.bucketName).join(', ')}`);
                if (referencesToThisBucket.length > 5) {
                    console.log(`      ... and ${referencesToThisBucket.length - 5} more buckets`);
                }

                // Check if OneTru references this EDL bucket
                const onetruRef = referencesToThisBucket.find(r => r.bucketName === 'onetru');
                if (onetruRef) {
                    console.log(`   🎯 OneTru references this EDL bucket!`);
                }
            }
        });

        console.log('\n💡 EDL PERFORMANCE IMPACT:');
        console.log('-'.repeat(50));
        if (edlBuckets.length > 0) {
            const totalEdlDependencies = edlBuckets.reduce((sum, bucket) => sum + bucket.dependencyCount, 0);
            console.log(`Total EDL dependencies: ${totalEdlDependencies}`);
            console.log(`Average dependencies per EDL bucket: ${(totalEdlDependencies / edlBuckets.length).toFixed(2)}`);

            if (edlCircularRefs.length > 0) {
                console.log('🚨 EDL circular references could cause infinite evaluation loops!');
            }

            const edlCrossRefs = edlBuckets.filter(bucket =>
                bucket.dependencies.some(dep => dep.dependency.toLowerCase().includes('edl'))
            );
            if (edlCrossRefs.length > 0) {
                console.log(`⚠️  ${edlCrossRefs.length} EDL buckets reference other EDL buckets (cascading complexity)`);
            }
        }

        expect(edlBuckets.length).toBeGreaterThan(0);
    });

    it('should generate detailed HTML optimization report with examples', () => {
        console.log('\n📊 GENERATING DETAILED HTML OPTIMIZATION REPORT');
        console.log('='.repeat(80));

        // Focus on EDL bucket for detailed analysis
        const targetBucket = 'edl';
        const optimizationReport = analyzeRulePerformanceDetailed(allBusinessMappings, targetBucket);
        const htmlReport = generateDetailedHTMLOptimizationReport(optimizationReport, targetBucket);

        // Save the HTML report
        const fs = require('fs');
        const reportPath = `rule-optimization-report-${targetBucket}.html`;
        fs.writeFileSync(reportPath, htmlReport);

        console.log(`✅ Detailed HTML report generated: ${reportPath}`);
        console.log('\n📊 OPTIMIZATION SUMMARY:');
        console.log('-'.repeat(50));
        console.log(`Target Bucket: ${targetBucket}`);
        console.log(`Total Rules Analyzed: ${optimizationReport.totalRules}`);
        console.log(`Target Bucket Rules: ${optimizationReport.targetBucketRules.length}`);
        console.log(`High-Performance (IN) Rules: ${optimizationReport.inRules.length}`);
        console.log(`Low-Performance (LIKE) Rules: ${optimizationReport.likeRules.length}`);
        console.log(`High-Value Count Rules: ${optimizationReport.highValueRules.length}`);

        if (optimizationReport.targetBucketRules.length > 0) {
            console.log('\n🔍 TARGET BUCKET ANALYSIS:');
            console.log('-'.repeat(50));
            optimizationReport.targetBucketRules.forEach((rule, index) => {
                console.log(`Rule ${index + 1}: ${rule.category}.${rule.bucket}`);
                console.log(`   Field: ${rule.fieldName}`);
                console.log(`   Operator: ${rule.operator}`);
                console.log(`   Values: ${rule.valueCount} (showing first 5)`);
                console.log(`   Sample Values: ${rule.values.slice(0, 5).join(', ')}`);
                console.log(`   Optimization: ${rule.optimization || 'Split into smaller rules'}`);
            });
        }

        expect(optimizationReport).toBeDefined();
        expect(htmlReport).toContain('Rule Optimization Report');
        expect(htmlReport).toContain(targetBucket);
    });
});

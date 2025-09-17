import { describe, it, expect } from 'vitest';
import { getCostCategoriesAsJSON, getConflicts } from '../src/lib/utilsv2.js';
import { createFileFromPath } from '../src/lib/utils.js';

describe('CBP1 Conflict Analysis using utilsv2.js', () => {
    let cbp1Data;

    beforeAll(async () => {
        console.log('\n🔍 LOADING CBP1 DATA');
        console.log('='.repeat(80));

        // Load CBP1 data using utilsv2.js
        console.log('Creating file object from path...');
        const cbp1File = await createFileFromPath('costcat/cbp1.json');
        console.log('File object created:', cbp1File ? 'success' : 'failed');
        console.log('File name:', cbp1File?.name);

        cbp1Data = await getCostCategoriesAsJSON(cbp1File);

        console.log(`✅ CBP1 data loaded successfully`);
        console.log(`📊 Business Mappings: ${cbp1Data.resource?.businessMappings?.length || 0}`);

        if (cbp1Data.resource?.businessMappings) {
            const totalCostTargets = cbp1Data.resource.businessMappings.reduce((sum, mapping) => {
                return sum + (mapping.costTargets?.length || 0);
            }, 0);
            console.log(`📊 Total Cost Targets: ${totalCostTargets}`);
        }
    });

    it('should analyze CBP1 data structure', () => {
        console.log('\n📊 CBP1 DATA STRUCTURE ANALYSIS');
        console.log('='.repeat(80));
        
        expect(cbp1Data).toBeDefined();
        expect(cbp1Data.resource).toBeDefined();
        expect(cbp1Data.resource.businessMappings).toBeDefined();
        expect(Array.isArray(cbp1Data.resource.businessMappings)).toBe(true);
        
        const businessMappings = cbp1Data.resource.businessMappings;
        
        console.log(`📋 BUSINESS MAPPINGS OVERVIEW:`);
        console.log('-'.repeat(50));
        console.log(`Total Categories: ${businessMappings.length}`);
        
        businessMappings.forEach((mapping, index) => {
            const costTargetsCount = mapping.costTargets?.length || 0;
            console.log(`${index + 1}. "${mapping.name}" - ${costTargetsCount} cost targets`);
        });
        
        // Analyze rules structure
        let totalRules = 0;
        let totalConditions = 0;
        let totalValues = 0;
        
        businessMappings.forEach(mapping => {
            if (mapping.costTargets) {
                mapping.costTargets.forEach(costTarget => {
                    if (costTarget.rules) {
                        totalRules += costTarget.rules.length;
                        costTarget.rules.forEach(rule => {
                            if (rule.viewConditions) {
                                totalConditions += rule.viewConditions.length;
                                rule.viewConditions.forEach(condition => {
                                    if (condition.values) {
                                        totalValues += condition.values.length;
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
        
        console.log(`\n📊 RULES OVERVIEW:`);
        console.log('-'.repeat(50));
        console.log(`Total Rules: ${totalRules}`);
        console.log(`Total Conditions: ${totalConditions}`);
        console.log(`Total Values: ${totalValues}`);
        console.log(`Average Values per Condition: ${totalConditions > 0 ? (totalValues / totalConditions).toFixed(2) : 0}`);
        
        expect(totalRules).toBeGreaterThan(0);
    });

    it('should find conflicts in CBP1 data using utilsv2.js', () => {
        console.log('\n🔍 CBP1 CONFLICT ANALYSIS');
        console.log('='.repeat(80));
        
        const conflictAnalysis = getConflicts(cbp1Data, 'all');
        
        console.log(`📊 CONFLICT ANALYSIS RESULTS:`);
        console.log('-'.repeat(50));
        console.log(`Total Conflicts Found: ${conflictAnalysis.conflicts.length}`);
        console.log(`Graph Nodes: ${conflictAnalysis.graph.nodes.length}`);
        console.log(`Graph Links: ${conflictAnalysis.graph.links.length}`);
        
        if (conflictAnalysis.conflicts.length > 0) {
            console.log(`\n🚨 CONFLICTS DETECTED:`);
            console.log('-'.repeat(50));
            
            // Group conflicts by type
            const conflictsByType = conflictAnalysis.conflicts.reduce((acc, conflict) => {
                if (!acc[conflict.type]) acc[conflict.type] = [];
                acc[conflict.type].push(conflict);
                return acc;
            }, {});
            
            Object.entries(conflictsByType).forEach(([type, conflicts]) => {
                console.log(`\n${type.toUpperCase()} Conflicts: ${conflicts.length}`);
                
                // Show first 5 conflicts of each type
                conflicts.slice(0, 5).forEach((conflict, index) => {
                    console.log(`  ${index + 1}. ${conflict.src_cat}."${conflict.src_bucket}" ↔ ${conflict.dest_cat}."${conflict.dest_bucket}"`);
                    console.log(`     Condition: ${conflict.condition}`);
                });
                
                if (conflicts.length > 5) {
                    console.log(`     ... and ${conflicts.length - 5} more ${type} conflicts`);
                }
            });
        } else {
            console.log(`✅ No conflicts found in CBP1 data`);
        }
        
        expect(conflictAnalysis).toBeDefined();
        expect(conflictAnalysis.conflicts).toBeDefined();
        expect(Array.isArray(conflictAnalysis.conflicts)).toBe(true);
        expect(conflictAnalysis.graph).toBeDefined();
        expect(conflictAnalysis.graph.nodes).toBeDefined();
        expect(conflictAnalysis.graph.links).toBeDefined();
    });

    it('should analyze CBP1 conflicts per category', () => {
        console.log('\n🔍 CBP1 PER-CATEGORY CONFLICT ANALYSIS');
        console.log('='.repeat(80));
        
        const perCategoryAnalysis = getConflicts(cbp1Data, 'per-category');
        
        console.log(`📊 PER-CATEGORY ANALYSIS RESULTS:`);
        console.log('-'.repeat(50));
        console.log(`Total Conflicts Found: ${perCategoryAnalysis.conflicts.length}`);
        
        if (perCategoryAnalysis.conflicts.length > 0) {
            // Group conflicts by source category
            const conflictsByCategory = perCategoryAnalysis.conflicts.reduce((acc, conflict) => {
                if (!acc[conflict.src_cat]) acc[conflict.src_cat] = [];
                acc[conflict.src_cat].push(conflict);
                return acc;
            }, {});
            
            console.log(`\n📋 CONFLICTS BY CATEGORY:`);
            console.log('-'.repeat(50));
            
            Object.entries(conflictsByCategory).forEach(([category, conflicts]) => {
                console.log(`\n"${category}" Category: ${conflicts.length} conflicts`);
                
                // Show first 3 conflicts for each category
                conflicts.slice(0, 3).forEach((conflict, index) => {
                    console.log(`  ${index + 1}. "${conflict.src_bucket}" ↔ "${conflict.dest_bucket}"`);
                    console.log(`     Type: ${conflict.type}`);
                    console.log(`     Condition: ${conflict.condition.substring(0, 100)}${conflict.condition.length > 100 ? '...' : ''}`);
                });
                
                if (conflicts.length > 3) {
                    console.log(`     ... and ${conflicts.length - 3} more conflicts in this category`);
                }
            });
        } else {
            console.log(`✅ No per-category conflicts found in CBP1 data`);
        }
        
        expect(perCategoryAnalysis).toBeDefined();
        expect(perCategoryAnalysis.conflicts).toBeDefined();
        expect(Array.isArray(perCategoryAnalysis.conflicts)).toBe(true);
    });

    it('should analyze CBP1 field usage patterns', () => {
        console.log('\n📊 CBP1 FIELD USAGE ANALYSIS');
        console.log('='.repeat(80));
        
        const fieldUsage = new Map();
        const operatorUsage = new Map();
        const valueCountDistribution = new Map();
        
        cbp1Data.resource.businessMappings.forEach(mapping => {
            if (mapping.costTargets) {
                mapping.costTargets.forEach(costTarget => {
                    if (costTarget.rules) {
                        costTarget.rules.forEach(rule => {
                            if (rule.viewConditions) {
                                rule.viewConditions.forEach(condition => {
                                    const fieldName = condition.viewField?.fieldName || 'unknown';
                                    const operator = condition.viewOperator || 'unknown';
                                    const valueCount = condition.values?.length || 0;
                                    
                                    // Track field usage
                                    fieldUsage.set(fieldName, (fieldUsage.get(fieldName) || 0) + 1);
                                    
                                    // Track operator usage
                                    operatorUsage.set(operator, (operatorUsage.get(operator) || 0) + 1);
                                    
                                    // Track value count distribution
                                    const countRange = valueCount === 0 ? '0' : 
                                                     valueCount <= 10 ? '1-10' :
                                                     valueCount <= 50 ? '11-50' :
                                                     valueCount <= 100 ? '51-100' :
                                                     valueCount <= 500 ? '101-500' : '500+';
                                    valueCountDistribution.set(countRange, (valueCountDistribution.get(countRange) || 0) + 1);
                                });
                            }
                        });
                    }
                });
            }
        });
        
        console.log(`📋 FIELD USAGE PATTERNS:`);
        console.log('-'.repeat(50));
        Array.from(fieldUsage.entries())
            .sort((a, b) => b[1] - a[1])
            .forEach(([field, count]) => {
                console.log(`  "${field}": ${count} conditions`);
            });
        
        console.log(`\n📋 OPERATOR USAGE PATTERNS:`);
        console.log('-'.repeat(50));
        Array.from(operatorUsage.entries())
            .sort((a, b) => b[1] - a[1])
            .forEach(([operator, count]) => {
                console.log(`  ${operator}: ${count} conditions`);
            });
        
        console.log(`\n📋 VALUE COUNT DISTRIBUTION:`);
        console.log('-'.repeat(50));
        Array.from(valueCountDistribution.entries())
            .sort((a, b) => {
                const order = ['0', '1-10', '11-50', '51-100', '101-500', '500+'];
                return order.indexOf(a[0]) - order.indexOf(b[0]);
            })
            .forEach(([range, count]) => {
                console.log(`  ${range} values: ${count} conditions`);
            });
        
        expect(fieldUsage.size).toBeGreaterThan(0);
        expect(operatorUsage.size).toBeGreaterThan(0);
    });

    it('should generate HTML conflict report for CBP1', () => {
        console.log('\n📊 GENERATING CBP1 HTML CONFLICT REPORT');
        console.log('='.repeat(80));

        const conflictAnalysis = getConflicts(cbp1Data, 'all');

        // Generate HTML report
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CBP1 Conflict Analysis Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
        .metric { background: #ecf0f1; padding: 15px; border-radius: 5px; text-align: center; }
        .metric-value { font-size: 24px; font-weight: bold; color: #2c3e50; }
        .metric-label { color: #7f8c8d; font-size: 14px; }
        .conflict-duplicate { background-color: #fff3cd; border-left: 4px solid #ffc107; }
        .conflict-overlap { background-color: #f8d7da; border-left: 4px solid #dc3545; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; font-weight: bold; }
        .condition { font-family: monospace; background-color: #f8f9fa; padding: 4px; border-radius: 3px; }
        .no-conflicts { background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px; padding: 15px; color: #155724; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 CBP1 Conflict Analysis Report</h1>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Data Source:</strong> costcat/cbp1.json</p>

        <div class="summary">
            <div class="metric">
                <div class="metric-value">${cbp1Data.resource.businessMappings.length}</div>
                <div class="metric-label">Cost Categories</div>
            </div>
            <div class="metric">
                <div class="metric-value">${cbp1Data.resource.businessMappings.reduce((sum, m) => sum + (m.costTargets?.length || 0), 0)}</div>
                <div class="metric-label">Cost Targets</div>
            </div>
            <div class="metric ${conflictAnalysis.conflicts.length > 0 ? 'conflict-overlap' : 'no-conflicts'}">
                <div class="metric-value">${conflictAnalysis.conflicts.length}</div>
                <div class="metric-label">Total Conflicts</div>
            </div>
            <div class="metric">
                <div class="metric-value">${conflictAnalysis.conflicts.filter(c => c.type === 'duplicate').length}</div>
                <div class="metric-label">Duplicate Conflicts</div>
            </div>
            <div class="metric">
                <div class="metric-value">${conflictAnalysis.conflicts.filter(c => c.type === 'overlap').length}</div>
                <div class="metric-label">Overlap Conflicts</div>
            </div>
        </div>

        ${conflictAnalysis.conflicts.length === 0 ? `
        <div class="no-conflicts">
            <h3>✅ No Conflicts Found!</h3>
            <p>The CBP1 cost allocation rules are well-structured with no overlapping or duplicate conditions.</p>
        </div>
        ` : `
        <h2>🚨 Detected Conflicts</h2>
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Type</th>
                    <th>Source</th>
                    <th>Target</th>
                    <th>Condition</th>
                </tr>
            </thead>
            <tbody>
                ${conflictAnalysis.conflicts.map((conflict, index) => `
                <tr class="conflict-${conflict.type}">
                    <td>${index + 1}</td>
                    <td><strong>${conflict.type.toUpperCase()}</strong></td>
                    <td>${conflict.src_cat}."${conflict.src_bucket}"</td>
                    <td>${conflict.dest_cat}."${conflict.dest_bucket}"</td>
                    <td class="condition">${conflict.condition}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
        `}

        <h2>📊 Data Overview</h2>
        <table>
            <thead>
                <tr><th>Category</th><th>Cost Targets</th><th>Description</th></tr>
            </thead>
            <tbody>
                ${cbp1Data.resource.businessMappings.map(mapping => `
                <tr>
                    <td><strong>${mapping.name}</strong></td>
                    <td>${mapping.costTargets?.length || 0}</td>
                    <td>Cost allocation rules for ${mapping.name.toLowerCase()}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>

        <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #7f8c8d; text-align: center;">
            <p>Generated by Cost Bucket Analyzer - CBP1 Conflict Analysis Tool</p>
        </footer>
    </div>
</body>
</html>`;

        // Save the HTML report
        const fs = require('fs');
        const reportPath = 'cbp1-conflict-report.html';
        fs.writeFileSync(reportPath, html);

        console.log(`✅ CBP1 HTML report generated: ${reportPath}`);
        console.log(`📊 Report Summary:`);
        console.log(`   • Categories: ${cbp1Data.resource.businessMappings.length}`);
        console.log(`   • Cost Targets: ${cbp1Data.resource.businessMappings.reduce((sum, m) => sum + (m.costTargets?.length || 0), 0)}`);
        console.log(`   • Conflicts: ${conflictAnalysis.conflicts.length}`);
        console.log(`   • Duplicates: ${conflictAnalysis.conflicts.filter(c => c.type === 'duplicate').length}`);
        console.log(`   • Overlaps: ${conflictAnalysis.conflicts.filter(c => c.type === 'overlap').length}`);

        expect(html).toContain('CBP1 Conflict Analysis Report');
        expect(fs.existsSync(reportPath)).toBe(true);
    });
});

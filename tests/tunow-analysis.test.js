/**
 * Unit test for analyzing CostBucketAnalyzer/costcat/tunow.json
 * This test demonstrates the analysis capabilities of the utils.js functions
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { getCostCategoriesAsJSON, getConflicts, createFileFromPath } from '../src/lib/utils.js';
import path from 'path';

describe('TuNow JSON Analysis', () => {
    let tunowData;
    let tunowFile;
    
    beforeAll(async () => {
        // Load the tunow.json file
        const filePath = path.resolve(process.cwd(), 'costcat/tunow.json');
        tunowFile = await createFileFromPath(filePath);
        tunowData = await getCostCategoriesAsJSON(tunowFile);
    });

    describe('File Loading and Structure Validation', () => {
        it('should successfully load tunow.json file', () => {
            expect(tunowFile).toBeDefined();
            expect(tunowFile.name).toBe('tunow.json');
        });

        it('should parse JSON data correctly', () => {
            expect(tunowData).toBeDefined();
            expect(tunowData).toHaveProperty('metaData');
            expect(tunowData).toHaveProperty('resource');
        });

        it('should have valid business mappings structure', () => {
            expect(tunowData.resource).toHaveProperty('businessMappings');
            expect(Array.isArray(tunowData.resource.businessMappings)).toBe(true);
            expect(tunowData.resource.businessMappings.length).toBeGreaterThan(0);
        });

        it('should have expected business mapping categories', () => {
            const mappings = tunowData.resource.businessMappings;
            const categoryNames = mappings.map(m => m.name);
            
            expect(categoryNames).toContain('test cost category');
            expect(categoryNames).toContain('Mapped Application');
            
            console.log('📊 Found Business Mapping Categories:');
            categoryNames.forEach((name, index) => {
                console.log(`  ${index + 1}. ${name}`);
            });
        });
    });

    describe('Business Mappings Analysis', () => {
        it('should analyze cost targets for each business mapping', () => {
            const mappings = tunowData.resource.businessMappings;
            
            console.log('\n🎯 Cost Targets Analysis:');
            mappings.forEach((mapping, index) => {
                console.log(`\n${index + 1}. Category: "${mapping.name}"`);
                console.log(`   UUID: ${mapping.uuid}`);
                console.log(`   Cost Targets: ${mapping.costTargets?.length || 0}`);
                
                if (mapping.costTargets) {
                    mapping.costTargets.forEach((target, targetIndex) => {
                        console.log(`     ${targetIndex + 1}. ${target.name} (${target.rules?.length || 0} rules)`);
                    });
                }
            });
            
            // Validate structure
            mappings.forEach(mapping => {
                expect(mapping).toHaveProperty('uuid');
                expect(mapping).toHaveProperty('name');
                expect(mapping).toHaveProperty('costTargets');
                expect(Array.isArray(mapping.costTargets)).toBe(true);
            });
        });

        it('should analyze view conditions and rules', () => {
            const mappings = tunowData.resource.businessMappings;
            let totalRules = 0;
            let totalConditions = 0;
            
            console.log('\n📋 Rules and Conditions Analysis:');
            mappings.forEach((mapping) => {
                mapping.costTargets?.forEach((target) => {
                    target.rules?.forEach((rule) => {
                        totalRules++;
                        const conditionCount = rule.viewConditions?.length || 0;
                        totalConditions += conditionCount;
                        
                        if (conditionCount > 0) {
                            console.log(`\n  Rule in "${mapping.name}" > "${target.name}":`);
                            rule.viewConditions.forEach((condition, condIndex) => {
                                const fieldName = condition.viewField?.fieldName || 'Unknown';
                                const operator = condition.viewOperator || 'Unknown';
                                const valueCount = condition.values?.length || 0;
                                console.log(`    ${condIndex + 1}. ${fieldName} ${operator} [${valueCount} values]`);
                                
                                // Show first few values as examples
                                if (condition.values && condition.values.length > 0) {
                                    const examples = condition.values.slice(0, 3);
                                    const more = condition.values.length > 3 ? `, +${condition.values.length - 3} more` : '';
                                    console.log(`       Examples: ${examples.join(', ')}${more}`);
                                }
                            });
                        }
                    });
                });
            });
            
            console.log(`\n📊 Summary: ${totalRules} total rules, ${totalConditions} total conditions`);
            expect(totalRules).toBeGreaterThan(0);
            expect(totalConditions).toBeGreaterThan(0);
        });
    });

    describe('Conflict Detection Analysis', () => {
        it('should detect conflicts across all categories', () => {
            const conflicts = getConflicts(tunowData, 'all');
            
            console.log('\n⚠️  Conflict Analysis (All Categories):');
            console.log(`Found ${conflicts.length} conflicts/overlaps`);
            
            if (conflicts.length > 0) {
                console.log('\nDetailed Conflicts:');
                conflicts.forEach((conflict, index) => {
                    console.log(`\n${index + 1}. ${conflict.type?.toUpperCase() || 'CONFLICT'}`);
                    console.log(`   Source: ${conflict.src_cat} > ${conflict.src_bucket}`);
                    console.log(`   Target: ${conflict.dest_cat} > ${conflict.dest_bucket}`);
                    console.log(`   Condition: ${conflict.condition}`);
                });
            } else {
                console.log('✅ No conflicts detected across all categories');
            }
            
            expect(Array.isArray(conflicts)).toBe(true);
        });

        it('should detect conflicts per category', () => {
            const conflicts = getConflicts(tunowData, 'per-category');
            
            console.log('\n⚠️  Conflict Analysis (Per Category):');
            console.log(`Found ${conflicts.length} conflicts/overlaps`);
            
            if (conflicts.length > 0) {
                console.log('\nDetailed Per-Category Conflicts:');
                conflicts.forEach((conflict, index) => {
                    console.log(`\n${index + 1}. ${conflict.type?.toUpperCase() || 'CONFLICT'}`);
                    console.log(`   Source: ${conflict.src_cat} > ${conflict.src_bucket}`);
                    console.log(`   Target: ${conflict.dest_cat} > ${conflict.dest_bucket}`);
                    console.log(`   Condition: ${conflict.condition}`);
                });
            } else {
                console.log('✅ No per-category conflicts detected');
            }
            
            expect(Array.isArray(conflicts)).toBe(true);
        });

        it('should provide detailed conflict statistics', () => {
            const allConflicts = getConflicts(tunowData, 'all');
            const perCategoryConflicts = getConflicts(tunowData, 'per-category');
            
            // Count conflict types
            const conflictTypes = {
                duplicate: 0,
                overlap: 0,
                total: allConflicts.length
            };
            
            allConflicts.forEach(conflict => {
                if (conflict.type === 'duplicate') {
                    conflictTypes.duplicate++;
                } else if (conflict.type === 'overlap') {
                    conflictTypes.overlap++;
                }
            });
            
            console.log('\n📈 Conflict Statistics:');
            console.log(`   Total Conflicts (All): ${conflictTypes.total}`);
            console.log(`   Total Conflicts (Per-Category): ${perCategoryConflicts.length}`);
            console.log(`   Duplicates: ${conflictTypes.duplicate}`);
            console.log(`   Overlaps: ${conflictTypes.overlap}`);
            
            // Analyze which categories have the most conflicts
            const categoryConflictCount = {};
            allConflicts.forEach(conflict => {
                const srcCat = conflict.src_cat;
                const destCat = conflict.dest_cat;
                categoryConflictCount[srcCat] = (categoryConflictCount[srcCat] || 0) + 1;
                if (srcCat !== destCat) {
                    categoryConflictCount[destCat] = (categoryConflictCount[destCat] || 0) + 1;
                }
            });
            
            if (Object.keys(categoryConflictCount).length > 0) {
                console.log('\n🏷️  Categories with Most Conflicts:');
                Object.entries(categoryConflictCount)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .forEach(([category, count]) => {
                        console.log(`   ${category}: ${count} conflicts`);
                    });
            }
            
            expect(typeof conflictTypes.total).toBe('number');
            expect(typeof conflictTypes.duplicate).toBe('number');
            expect(typeof conflictTypes.overlap).toBe('number');
        });
    });

    describe('Data Quality Assessment', () => {
        it('should assess data completeness and quality', () => {
            const mappings = tunowData.resource.businessMappings;
            let stats = {
                totalMappings: mappings.length,
                totalCostTargets: 0,
                totalRules: 0,
                totalConditions: 0,
                emptyRules: 0,
                emptyConditions: 0,
                dataSources: new Set(),
                operators: new Set(),
                fieldTypes: new Set()
            };
            
            mappings.forEach(mapping => {
                // Track data sources
                if (mapping.dataSources) {
                    mapping.dataSources.forEach(ds => stats.dataSources.add(ds));
                }
                
                mapping.costTargets?.forEach(target => {
                    stats.totalCostTargets++;
                    
                    if (!target.rules || target.rules.length === 0) {
                        stats.emptyRules++;
                    }
                    
                    target.rules?.forEach(rule => {
                        stats.totalRules++;
                        
                        if (!rule.viewConditions || rule.viewConditions.length === 0) {
                            stats.emptyConditions++;
                        }
                        
                        rule.viewConditions?.forEach(condition => {
                            stats.totalConditions++;
                            
                            // Track operators and field types
                            if (condition.viewOperator) {
                                stats.operators.add(condition.viewOperator);
                            }
                            if (condition.viewField?.identifier) {
                                stats.fieldTypes.add(condition.viewField.identifier);
                            }
                        });
                    });
                });
            });
            
            console.log('\n📊 Data Quality Assessment:');
            console.log(`   Business Mappings: ${stats.totalMappings}`);
            console.log(`   Cost Targets: ${stats.totalCostTargets}`);
            console.log(`   Rules: ${stats.totalRules}`);
            console.log(`   Conditions: ${stats.totalConditions}`);
            console.log(`   Empty Rules: ${stats.emptyRules}`);
            console.log(`   Empty Conditions: ${stats.emptyConditions}`);
            console.log(`   Data Sources: ${Array.from(stats.dataSources).join(', ')}`);
            console.log(`   Operators Used: ${Array.from(stats.operators).join(', ')}`);
            console.log(`   Field Types: ${Array.from(stats.fieldTypes).join(', ')}`);
            
            // Quality assertions
            expect(stats.totalMappings).toBeGreaterThan(0);
            expect(stats.totalCostTargets).toBeGreaterThan(0);
            expect(stats.totalRules).toBeGreaterThan(0);
            expect(stats.totalConditions).toBeGreaterThan(0);
            expect(stats.dataSources.size).toBeGreaterThan(0);
        });
    });
});

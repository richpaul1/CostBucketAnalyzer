import { describe, it, beforeAll, expect } from 'vitest';
import path from 'path';
import { getCostCategoriesAsJSON, getConflicts, createFileFromPath } from '../src/lib/utils.js';

describe('OneTru Circular Rules and Optimization Analysis', () => {
    let tunowData;
    let onetruRules;
    let allConflicts;

    beforeAll(async () => {
        const filePath = path.resolve(process.cwd(), 'costcat/tunow.json');
        const tunowFile = await createFileFromPath(filePath);
        tunowData = await getCostCategoriesAsJSON(tunowFile);
        
        // Get all conflicts to analyze OneTru-related ones
        allConflicts = getConflicts(tunowData, 'all');
        
        // Extract all OneTru-related rules across all categories
        onetruRules = extractAllOnetruRules(tunowData);
    });

    function extractAllOnetruRules(data) {
        const businessMappings = data.resource?.businessMappings || data.businessMappings;
        const onetruRelatedRules = [];
        
        businessMappings.forEach(category => {
            category.costTargets.forEach(target => {
                // Check if target name contains "onetru" or if rules reference onetru products
                const isOnetruTarget = target.name.toLowerCase().includes('onetru');
                
                target.rules.forEach(rule => {
                    const hasOnetruValues = rule.viewConditions?.some(condition => 
                        condition.values?.some(value => 
                            value.toLowerCase().includes('onetru')
                        )
                    );
                    
                    if (isOnetruTarget || hasOnetruValues) {
                        onetruRelatedRules.push({
                            category: category.name,
                            categoryUuid: category.uuid,
                            target: target.name,
                            targetUuid: target.uuid,
                            rule: rule,
                            isOnetruTarget,
                            hasOnetruValues
                        });
                    }
                });
            });
        });
        
        return onetruRelatedRules;
    }

    function findCircularReferences(rules) {
        const circularRefs = [];
        const onetruProducts = new Set();
        
        // First, collect all OneTru products referenced in rules
        rules.forEach(ruleInfo => {
            ruleInfo.rule.viewConditions?.forEach(condition => {
                if (condition.viewField?.fieldName === 'Mapped Product') {
                    condition.values?.forEach(value => {
                        if (value.toLowerCase().includes('onetru')) {
                            onetruProducts.add(value);
                        }
                    });
                }
            });
        });
        
        // Check for circular references
        rules.forEach(ruleInfo => {
            if (ruleInfo.target.toLowerCase().includes('onetru')) {
                ruleInfo.rule.viewConditions?.forEach(condition => {
                    if (condition.viewField?.fieldName === 'Mapped Product') {
                        condition.values?.forEach(value => {
                            if (value.toLowerCase().includes('onetru') && value !== ruleInfo.target) {
                                circularRefs.push({
                                    sourceCategory: ruleInfo.category,
                                    sourceTarget: ruleInfo.target,
                                    referencedProduct: value,
                                    type: 'PRODUCT_REFERENCE',
                                    severity: 'HIGH'
                                });
                            }
                        });
                    }
                });
            }
        });
        
        return { circularRefs, onetruProducts };
    }

    function analyzeOnetruConflicts(conflicts, onetruRules) {
        const onetruConflicts = conflicts.filter(conflict => 
            conflict.src_bucket?.toLowerCase().includes('onetru') ||
            conflict.dest_bucket?.toLowerCase().includes('onetru') ||
            conflict.src_cat?.toLowerCase().includes('onetru') ||
            conflict.dest_cat?.toLowerCase().includes('onetru')
        );
        
        const conflictsByType = {};
        const conflictsByCategory = {};
        
        onetruConflicts.forEach(conflict => {
            const type = conflict.type || 'overlap';
            conflictsByType[type] = (conflictsByType[type] || 0) + 1;
            
            const categoryPair = `${conflict.src_cat} ↔ ${conflict.dest_cat}`;
            if (!conflictsByCategory[categoryPair]) {
                conflictsByCategory[categoryPair] = [];
            }
            conflictsByCategory[categoryPair].push(conflict);
        });
        
        return { onetruConflicts, conflictsByType, conflictsByCategory };
    }

    function generateOptimizationRecommendations(rules, conflicts, circularRefs) {
        const recommendations = [];
        
        // Rule consolidation opportunities
        const productGroups = groupOnetruProducts(rules);
        if (Object.keys(productGroups).length > 1) {
            recommendations.push({
                type: 'RULE_CONSOLIDATION',
                priority: 'HIGH',
                description: 'Consolidate OneTru product groups into separate rules',
                impact: 'Reduce rule evaluation complexity',
                details: productGroups
            });
        }
        
        // Large value set optimization
        const largeValueSets = rules.filter(rule => 
            rule.rule.viewConditions?.some(condition => 
                condition.values?.length > 20
            )
        );
        
        if (largeValueSets.length > 0) {
            recommendations.push({
                type: 'VALUE_SET_OPTIMIZATION',
                priority: 'CRITICAL',
                description: 'Break down large value sets into smaller, logical groups',
                impact: 'Significantly improve lookup performance',
                affectedRules: largeValueSets.length
            });
        }
        
        // Circular reference resolution
        if (circularRefs.length > 0) {
            recommendations.push({
                type: 'CIRCULAR_REFERENCE_RESOLUTION',
                priority: 'HIGH',
                description: 'Resolve circular references between OneTru products',
                impact: 'Prevent infinite loops and improve rule clarity',
                circularRefs: circularRefs.length
            });
        }
        
        // Conflict resolution
        if (conflicts.length > 100) {
            recommendations.push({
                type: 'CONFLICT_RESOLUTION',
                priority: 'MEDIUM',
                description: 'Resolve overlapping OneTru rules',
                impact: 'Improve cost allocation accuracy',
                conflicts: conflicts.length
            });
        }
        
        return recommendations;
    }

    function groupOnetruProducts(rules) {
        const groups = {
            analytics: [],
            credit: [],
            platform: [],
            storage: [],
            other: []
        };
        
        rules.forEach(ruleInfo => {
            ruleInfo.rule.viewConditions?.forEach(condition => {
                if (condition.viewField?.fieldName === 'Mapped Product') {
                    condition.values?.forEach(value => {
                        if (value.toLowerCase().includes('onetru')) {
                            if (value.includes('analytics')) {
                                groups.analytics.push(value);
                            } else if (value.includes('credit')) {
                                groups.credit.push(value);
                            } else if (value.includes('platform')) {
                                groups.platform.push(value);
                            } else if (value.includes('storage')) {
                                groups.storage.push(value);
                            } else {
                                groups.other.push(value);
                            }
                        }
                    });
                }
            });
        });
        
        // Remove empty groups and duplicates
        Object.keys(groups).forEach(key => {
            groups[key] = [...new Set(groups[key])];
            if (groups[key].length === 0) {
                delete groups[key];
            }
        });
        
        return groups;
    }

    it('should analyze OneTru for circular references', () => {
        console.log('\n🔄 ONETRU CIRCULAR REFERENCE ANALYSIS');
        console.log('='.repeat(80));
        
        const { circularRefs, onetruProducts } = findCircularReferences(onetruRules);
        
        console.log(`\n📊 ONETRU RULES SUMMARY:`);
        console.log(`Total OneTru-related rules: ${onetruRules.length}`);
        console.log(`Unique OneTru products: ${onetruProducts.size}`);
        
        console.log(`\n🔍 CIRCULAR REFERENCE CHECK:`);
        if (circularRefs.length > 0) {
            console.log(`🚨 Found ${circularRefs.length} circular references:`);
            circularRefs.forEach((ref, index) => {
                console.log(`\n${index + 1}. ${ref.sourceCategory} > ${ref.sourceTarget}`);
                console.log(`   References: ${ref.referencedProduct}`);
                console.log(`   Type: ${ref.type}`);
                console.log(`   Severity: ${ref.severity}`);
            });
        } else {
            console.log('✅ No direct circular references found');
        }
        
        console.log(`\n🏷️  ONETRU PRODUCTS INVENTORY:`);
        const sortedProducts = Array.from(onetruProducts).sort();
        sortedProducts.forEach((product, index) => {
            console.log(`${index + 1}. ${product}`);
        });
        
        expect(onetruRules.length).toBeGreaterThan(0);
    });

    it('should analyze OneTru-related conflicts', () => {
        console.log('\n⚔️  ONETRU CONFLICT ANALYSIS');
        console.log('='.repeat(80));
        
        const { onetruConflicts, conflictsByType, conflictsByCategory } = analyzeOnetruConflicts(allConflicts, onetruRules);
        
        console.log(`\n📊 CONFLICT SUMMARY:`);
        console.log(`Total OneTru-related conflicts: ${onetruConflicts.length}`);
        console.log(`Percentage of total conflicts: ${((onetruConflicts.length / allConflicts.length) * 100).toFixed(1)}%`);
        
        console.log(`\n🏷️  CONFLICTS BY TYPE:`);
        Object.entries(conflictsByType).forEach(([type, count]) => {
            console.log(`${type.toUpperCase()}: ${count}`);
        });
        
        console.log(`\n🔍 TOP CONFLICT CATEGORIES:`);
        const sortedCategories = Object.entries(conflictsByCategory)
            .sort(([,a], [,b]) => b.length - a.length)
            .slice(0, 10);
            
        sortedCategories.forEach(([categoryPair, conflicts], index) => {
            console.log(`${index + 1}. ${categoryPair}: ${conflicts.length} conflicts`);
            
            // Show examples
            const examples = conflicts.slice(0, 3);
            examples.forEach((conflict, i) => {
                console.log(`   Example ${i + 1}: ${conflict.src_bucket} → ${conflict.dest_bucket}`);
            });
            
            if (conflicts.length > 3) {
                console.log(`   ... and ${conflicts.length - 3} more`);
            }
        });
        
        expect(onetruConflicts).toBeDefined();
    });

    it('should provide optimization recommendations', () => {
        console.log('\n🛠️  ONETRU OPTIMIZATION RECOMMENDATIONS');
        console.log('='.repeat(80));
        
        const { onetruConflicts } = analyzeOnetruConflicts(allConflicts, onetruRules);
        const { circularRefs } = findCircularReferences(onetruRules);
        const recommendations = generateOptimizationRecommendations(onetruRules, onetruConflicts, circularRefs);
        
        console.log(`\n📋 OPTIMIZATION OPPORTUNITIES:`);
        
        recommendations.forEach((rec, index) => {
            console.log(`\n${index + 1}. ${rec.type.replace(/_/g, ' ')}`);
            console.log(`   Priority: ${rec.priority}`);
            console.log(`   Description: ${rec.description}`);
            console.log(`   Impact: ${rec.impact}`);
            
            if (rec.details) {
                console.log(`   Product Groups:`);
                Object.entries(rec.details).forEach(([group, products]) => {
                    console.log(`     ${group}: ${products.length} products`);
                });
            }
            
            if (rec.affectedRules) {
                console.log(`   Affected Rules: ${rec.affectedRules}`);
            }
            
            if (rec.circularRefs) {
                console.log(`   Circular References: ${rec.circularRefs}`);
            }
            
            if (rec.conflicts) {
                console.log(`   Conflicts: ${rec.conflicts}`);
            }
        });
        
        console.log(`\n💡 SPECIFIC OPTIMIZATION STRATEGIES:`);
        console.log(`1. 🗂️  RULE SPLITTING BY PRODUCT TYPE:`);
        console.log(`   • Create separate rules for analytics, credit, platform, storage`);
        console.log(`   • Reduces single large rule to multiple smaller, focused rules`);
        
        console.log(`\n2. 🏗️  HIERARCHICAL ORGANIZATION:`);
        console.log(`   • Group related OneTru products into parent categories`);
        console.log(`   • Use NOT_IN for exclusions instead of large IN lists`);
        
        console.log(`\n3. ⚡ PERFORMANCE OPTIMIZATIONS:`);
        console.log(`   • Implement hash-based lookups for O(1) access`);
        console.log(`   • Cache rule evaluation results`);
        console.log(`   • Use early termination for rule matching`);
        
        console.log(`\n4. 🎯 RULE PRECEDENCE:`);
        console.log(`   • Establish clear precedence order for overlapping rules`);
        console.log(`   • Most specific rules should be evaluated first`);
        
        expect(recommendations.length).toBeGreaterThan(0);
    });
});

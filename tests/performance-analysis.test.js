import { describe, it, beforeAll, expect } from 'vitest';
import path from 'path';
import { getCostCategoriesAsJSON, createFileFromPath } from '../src/lib/utils.js';

describe('Performance Analysis: Marketing Solutions vs OneTru', () => {
    let tunowData;
    let marketingSolutionsRules;
    let onetruRules;

    beforeAll(async () => {
        const filePath = path.resolve(process.cwd(), 'costcat/tunow.json');
        const tunowFile = await createFileFromPath(filePath);
        tunowData = await getCostCategoriesAsJSON(tunowFile);

        // Extract rules for both business units
        marketingSolutionsRules = extractBusinessUnitRules(tunowData, 'marketing solutions');
        onetruRules = extractBusinessUnitRules(tunowData, 'onetru');
    });

    function extractBusinessUnitRules(data, businessUnitName) {
        // The data structure is data.resource.businessMappings
        const businessMappings = data.resource?.businessMappings || data.businessMappings;

        if (!businessMappings) {
            console.log('No business mappings found in data structure');
            return null;
        }

        const businessUnitsCategory = businessMappings.find(
            mapping => mapping.name === 'Business Units'
        );

        if (!businessUnitsCategory) {
            console.log('Business Units category not found');
            return null;
        }

        const businessUnit = businessUnitsCategory.costTargets.find(
            target => target.name === businessUnitName
        );

        return businessUnit || null;
    }

    function analyzeRuleComplexity(rules) {
        if (!rules || !rules.rules) return { error: 'No rules found' };
        
        const analysis = {
            totalRules: rules.rules.length,
            totalConditions: 0,
            totalValues: 0,
            conditionsByType: {},
            valuesByField: {},
            largestValueSet: 0,
            averageValuesPerCondition: 0,
            complexityScore: 0
        };

        rules.rules.forEach(rule => {
            if (rule.viewConditions) {
                rule.viewConditions.forEach(condition => {
                    analysis.totalConditions++;
                    
                    const fieldName = condition.viewField?.fieldName || 'unknown';
                    const operator = condition.viewOperator || 'unknown';
                    const values = condition.values || [];
                    
                    // Track condition types
                    const conditionKey = `${fieldName}_${operator}`;
                    analysis.conditionsByType[conditionKey] = (analysis.conditionsByType[conditionKey] || 0) + 1;
                    
                    // Track values by field
                    if (!analysis.valuesByField[fieldName]) {
                        analysis.valuesByField[fieldName] = 0;
                    }
                    analysis.valuesByField[fieldName] += values.length;
                    
                    analysis.totalValues += values.length;
                    analysis.largestValueSet = Math.max(analysis.largestValueSet, values.length);
                });
            }
        });

        analysis.averageValuesPerCondition = analysis.totalConditions > 0 
            ? (analysis.totalValues / analysis.totalConditions).toFixed(2)
            : 0;

        // Calculate complexity score (higher = more complex)
        analysis.complexityScore = (
            analysis.totalRules * 1 +
            analysis.totalConditions * 2 +
            analysis.totalValues * 0.1 +
            analysis.largestValueSet * 5
        );

        return analysis;
    }

    function calculateCartesianProductSize(rules) {
        if (!rules || !rules.rules) return 0;
        
        let totalCartesianSize = 0;
        
        rules.rules.forEach(rule => {
            if (rule.viewConditions && rule.viewConditions.length > 0) {
                // Calculate cartesian product for this rule
                let ruleCartesianSize = 1;
                rule.viewConditions.forEach(condition => {
                    const values = condition.values || [];
                    ruleCartesianSize *= Math.max(values.length, 1);
                });
                totalCartesianSize += ruleCartesianSize;
            }
        });
        
        return totalCartesianSize;
    }

    it('should analyze rule complexity differences', () => {
        console.log('\n🔍 PERFORMANCE ANALYSIS: Marketing Solutions vs OneTru');
        console.log('='.repeat(80));

        const marketingAnalysis = analyzeRuleComplexity(marketingSolutionsRules);
        const onetruAnalysis = analyzeRuleComplexity(onetruRules);

        console.log('\n📊 RULE COMPLEXITY COMPARISON');
        console.log('-'.repeat(50));
        
        console.log('\n🏢 Marketing Solutions:');
        if (marketingAnalysis.error) {
            console.log(`   ❌ ${marketingAnalysis.error}`);
        } else {
            console.log(`   Rules: ${marketingAnalysis.totalRules}`);
            console.log(`   Conditions: ${marketingAnalysis.totalConditions}`);
            console.log(`   Total Values: ${marketingAnalysis.totalValues.toLocaleString()}`);
            console.log(`   Largest Value Set: ${marketingAnalysis.largestValueSet}`);
            console.log(`   Avg Values/Condition: ${marketingAnalysis.averageValuesPerCondition}`);
            console.log(`   Complexity Score: ${marketingAnalysis.complexityScore.toFixed(0)}`);
        }

        console.log('\n🏢 OneTru:');
        if (onetruAnalysis.error) {
            console.log(`   ❌ ${onetruAnalysis.error}`);
        } else {
            console.log(`   Rules: ${onetruAnalysis.totalRules}`);
            console.log(`   Conditions: ${onetruAnalysis.totalConditions}`);
            console.log(`   Total Values: ${onetruAnalysis.totalValues.toLocaleString()}`);
            console.log(`   Largest Value Set: ${onetruAnalysis.largestValueSet}`);
            console.log(`   Avg Values/Condition: ${onetruAnalysis.averageValuesPerCondition}`);
            console.log(`   Complexity Score: ${onetruAnalysis.complexityScore.toFixed(0)}`);
        }

        if (!marketingAnalysis.error && !onetruAnalysis.error) {
            console.log('\n📈 PERFORMANCE IMPACT RATIOS:');
            console.log(`   Rules Ratio: ${(onetruAnalysis.totalRules / marketingAnalysis.totalRules).toFixed(1)}x`);
            console.log(`   Conditions Ratio: ${(onetruAnalysis.totalConditions / marketingAnalysis.totalConditions).toFixed(1)}x`);
            console.log(`   Values Ratio: ${(onetruAnalysis.totalValues / marketingAnalysis.totalValues).toFixed(1)}x`);
            console.log(`   Complexity Ratio: ${(onetruAnalysis.complexityScore / marketingAnalysis.complexityScore).toFixed(1)}x`);
        }

        expect(marketingSolutionsRules || onetruRules).toBeDefined();
    });

    it('should analyze cartesian product complexity', () => {
        console.log('\n🧮 CARTESIAN PRODUCT ANALYSIS');
        console.log('-'.repeat(50));

        const marketingCartesian = calculateCartesianProductSize(marketingSolutionsRules);
        const onetruCartesian = calculateCartesianProductSize(onetruRules);

        console.log(`\n📊 Cartesian Product Sizes:`);
        console.log(`   Marketing Solutions: ${marketingCartesian.toLocaleString()}`);
        console.log(`   OneTru: ${onetruCartesian.toLocaleString()}`);
        
        if (marketingCartesian > 0 && onetruCartesian > 0) {
            const ratio = onetruCartesian / marketingCartesian;
            console.log(`   Ratio (OneTru/Marketing): ${ratio.toFixed(1)}x`);
            
            if (ratio >= 10) {
                console.log(`   🚨 CRITICAL: OneTru has ${ratio.toFixed(1)}x larger cartesian product!`);
            } else if (ratio >= 5) {
                console.log(`   ⚠️  WARNING: OneTru has ${ratio.toFixed(1)}x larger cartesian product`);
            } else {
                console.log(`   ✅ Manageable difference in cartesian product size`);
            }
        }

        expect(marketingCartesian).toBeGreaterThanOrEqual(0);
        expect(onetruCartesian).toBeGreaterThanOrEqual(0);
    });

    it('should provide detailed field analysis', () => {
        console.log('\n🔍 DETAILED FIELD ANALYSIS');
        console.log('-'.repeat(50));

        const marketingAnalysis = analyzeRuleComplexity(marketingSolutionsRules);
        const onetruAnalysis = analyzeRuleComplexity(onetruRules);

        if (!marketingAnalysis.error) {
            console.log('\n🏢 Marketing Solutions - Fields:');
            Object.entries(marketingAnalysis.valuesByField)
                .sort(([,a], [,b]) => b - a)
                .forEach(([field, count]) => {
                    console.log(`   ${field}: ${count} values`);
                });

            console.log('\n🏢 Marketing Solutions - Condition Types:');
            Object.entries(marketingAnalysis.conditionsByType)
                .sort(([,a], [,b]) => b - a)
                .forEach(([type, count]) => {
                    console.log(`   ${type}: ${count} conditions`);
                });
        }

        if (!onetruAnalysis.error) {
            console.log('\n🏢 OneTru - Fields:');
            Object.entries(onetruAnalysis.valuesByField)
                .sort(([,a], [,b]) => b - a)
                .forEach(([field, count]) => {
                    console.log(`   ${field}: ${count} values`);
                });

            console.log('\n🏢 OneTru - Condition Types:');
            Object.entries(onetruAnalysis.conditionsByType)
                .sort(([,a], [,b]) => b - a)
                .forEach(([type, count]) => {
                    console.log(`   ${type}: ${count} conditions`);
                });
        }

        console.log('\n💡 PERFORMANCE RECOMMENDATIONS:');
        console.log('-'.repeat(40));
        
        if (!onetruAnalysis.error && onetruAnalysis.totalValues > 1000) {
            console.log('🚨 OneTru has high value count - consider:');
            console.log('   • Rule consolidation');
            console.log('   • Value set optimization');
            console.log('   • Caching strategies');
        }
        
        if (!onetruAnalysis.error && onetruAnalysis.largestValueSet > 100) {
            console.log('⚠️  Large value sets detected - consider:');
            console.log('   • Breaking large sets into smaller rules');
            console.log('   • Using NOT_IN operators where appropriate');
        }
        
        console.log('✅ General optimizations:');
        console.log('   • Index frequently queried fields');
        console.log('   • Implement rule result caching');
        console.log('   • Consider lazy evaluation');

        expect(true).toBe(true); // Always pass, this is analysis
    });
});

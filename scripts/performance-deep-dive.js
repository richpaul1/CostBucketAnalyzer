#!/usr/bin/env node

/**
 * Deep Performance Analysis: Marketing Solutions vs OneTru
 * 
 * This script provides detailed analysis of why OneTru is 10x slower than Marketing Solutions
 */

import path from 'path';
import { getCostCategoriesAsJSON, createFileFromPath } from '../src/lib/utils.js';

async function main() {
    try {
        console.log('🔄 Loading tunow.json file...');
        const filePath = path.resolve(process.cwd(), 'costcat/tunow.json');
        const tunowFile = await createFileFromPath(filePath);
        const tunowData = await getCostCategoriesAsJSON(tunowFile);
        
        console.log('🔍 Analyzing Business Unit rules...\n');
        
        const businessMappings = tunowData.resource?.businessMappings || tunowData.businessMappings;
        const businessUnitsCategory = businessMappings.find(mapping => mapping.name === 'Business Units');
        
        if (!businessUnitsCategory) {
            console.log('❌ Business Units category not found');
            return;
        }
        
        const marketingSolutions = businessUnitsCategory.costTargets.find(target => target.name === 'marketing solutions');
        const onetru = businessUnitsCategory.costTargets.find(target => target.name === 'onetru');
        
        console.log('🚨 PERFORMANCE ISSUE ANALYSIS');
        console.log('='.repeat(80));
        
        analyzeBusinessUnit('Marketing Solutions', marketingSolutions);
        analyzeBusinessUnit('OneTru', onetru);
        
        comparePerformance(marketingSolutions, onetru);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

function analyzeBusinessUnit(name, businessUnit) {
    console.log(`\n📊 ${name.toUpperCase()} ANALYSIS`);
    console.log('-'.repeat(50));
    
    if (!businessUnit) {
        console.log('❌ Business unit not found');
        return;
    }
    
    console.log(`UUID: ${businessUnit.uuid}`);
    console.log(`Rules: ${businessUnit.rules.length}`);
    
    let totalConditions = 0;
    let totalValues = 0;
    let maxValuesInSingleCondition = 0;
    let fieldBreakdown = {};
    
    businessUnit.rules.forEach((rule, ruleIndex) => {
        console.log(`\n  Rule ${ruleIndex + 1}:`);
        
        if (rule.viewConditions) {
            rule.viewConditions.forEach((condition, condIndex) => {
                totalConditions++;
                const fieldName = condition.viewField?.fieldName || 'unknown';
                const operator = condition.viewOperator || 'unknown';
                const values = condition.values || [];
                
                totalValues += values.length;
                maxValuesInSingleCondition = Math.max(maxValuesInSingleCondition, values.length);
                
                if (!fieldBreakdown[fieldName]) {
                    fieldBreakdown[fieldName] = { conditions: 0, values: 0, operators: new Set() };
                }
                fieldBreakdown[fieldName].conditions++;
                fieldBreakdown[fieldName].values += values.length;
                fieldBreakdown[fieldName].operators.add(operator);
                
                console.log(`    Condition ${condIndex + 1}: ${fieldName} ${operator} [${values.length} values]`);
                
                if (values.length > 20) {
                    console.log(`      🚨 LARGE VALUE SET: ${values.length} values`);
                    console.log(`      First 5: ${values.slice(0, 5).join(', ')}`);
                    console.log(`      Last 5: ${values.slice(-5).join(', ')}`);
                } else if (values.length > 0) {
                    console.log(`      Values: ${values.slice(0, 10).join(', ')}${values.length > 10 ? '...' : ''}`);
                }
            });
        }
    });
    
    console.log(`\n📈 SUMMARY:`);
    console.log(`  Total Conditions: ${totalConditions}`);
    console.log(`  Total Values: ${totalValues}`);
    console.log(`  Max Values in Single Condition: ${maxValuesInSingleCondition}`);
    console.log(`  Average Values per Condition: ${(totalValues / totalConditions).toFixed(1)}`);
    
    console.log(`\n🏷️  FIELD BREAKDOWN:`);
    Object.entries(fieldBreakdown).forEach(([field, stats]) => {
        console.log(`  ${field}:`);
        console.log(`    Conditions: ${stats.conditions}`);
        console.log(`    Total Values: ${stats.values}`);
        console.log(`    Operators: ${Array.from(stats.operators).join(', ')}`);
        console.log(`    Avg Values/Condition: ${(stats.values / stats.conditions).toFixed(1)}`);
    });
}

function comparePerformance(marketingSolutions, onetru) {
    console.log('\n🔥 PERFORMANCE IMPACT ANALYSIS');
    console.log('='.repeat(80));
    
    if (!marketingSolutions || !onetru) {
        console.log('❌ Cannot compare - missing data');
        return;
    }
    
    const msStats = calculateStats(marketingSolutions);
    const otStats = calculateStats(onetru);
    
    console.log('\n📊 COMPARISON TABLE:');
    console.log('Metric                    | Marketing Solutions | OneTru      | Ratio');
    console.log('-'.repeat(70));
    console.log(`Rules                     | ${msStats.rules.toString().padEnd(19)} | ${otStats.rules.toString().padEnd(11)} | ${(otStats.rules / msStats.rules).toFixed(1)}x`);
    console.log(`Conditions                | ${msStats.conditions.toString().padEnd(19)} | ${otStats.conditions.toString().padEnd(11)} | ${(otStats.conditions / msStats.conditions).toFixed(1)}x`);
    console.log(`Total Values              | ${msStats.totalValues.toString().padEnd(19)} | ${otStats.totalValues.toString().padEnd(11)} | ${(otStats.totalValues / msStats.totalValues).toFixed(1)}x`);
    console.log(`Max Values/Condition      | ${msStats.maxValues.toString().padEnd(19)} | ${otStats.maxValues.toString().padEnd(11)} | ${(otStats.maxValues / msStats.maxValues).toFixed(1)}x`);
    console.log(`Avg Values/Condition      | ${msStats.avgValues.toString().padEnd(19)} | ${otStats.avgValues.toString().padEnd(11)} | ${(otStats.avgValues / msStats.avgValues).toFixed(1)}x`);
    
    console.log('\n🎯 ROOT CAUSE ANALYSIS:');
    console.log('-'.repeat(40));
    
    const valueRatio = otStats.totalValues / msStats.totalValues;
    const maxValueRatio = otStats.maxValues / msStats.maxValues;
    
    if (valueRatio >= 4) {
        console.log(`🚨 CRITICAL: OneTru has ${valueRatio.toFixed(1)}x more values to process`);
    }
    
    if (maxValueRatio >= 4) {
        console.log(`🚨 CRITICAL: OneTru's largest condition has ${maxValueRatio.toFixed(1)}x more values`);
    }
    
    console.log('\n💡 WHY ONETRU IS 10X SLOWER:');
    console.log('-'.repeat(40));
    console.log('1. 📈 VALUE VOLUME:');
    console.log(`   • OneTru: ${otStats.totalValues} values vs Marketing Solutions: ${msStats.totalValues} values`);
    console.log(`   • ${valueRatio.toFixed(1)}x more data to process in memory`);
    
    console.log('\n2. 🔍 LOOKUP COMPLEXITY:');
    console.log(`   • OneTru's single condition has ${otStats.maxValues} values`);
    console.log(`   • Each cost allocation requires checking against ${otStats.maxValues} possible matches`);
    console.log(`   • Linear search through large arrays is expensive`);
    
    console.log('\n3. 🧮 CARTESIAN PRODUCT:');
    const msCartesian = calculateCartesianProduct(marketingSolutions);
    const otCartesian = calculateCartesianProduct(onetru);
    console.log(`   • Marketing Solutions: ${msCartesian} combinations`);
    console.log(`   • OneTru: ${otCartesian} combinations`);
    console.log(`   • ${(otCartesian / msCartesian).toFixed(1)}x more combinations to evaluate`);
    
    console.log('\n🛠️  OPTIMIZATION RECOMMENDATIONS:');
    console.log('-'.repeat(40));
    console.log('1. 🗂️  RULE SPLITTING:');
    console.log('   • Break OneTru\'s 94-value condition into smaller chunks');
    console.log('   • Create separate rules for logical groupings (e.g., by product type)');
    
    console.log('\n2. 🏗️  INDEXING:');
    console.log('   • Create hash maps for O(1) lookups instead of O(n) array searches');
    console.log('   • Pre-compute mappings for frequently accessed values');
    
    console.log('\n3. 🎯 RULE OPTIMIZATION:');
    console.log('   • Use NOT_IN operators for exclusions when appropriate');
    console.log('   • Group similar products into hierarchical categories');
    console.log('   • Implement rule precedence to short-circuit evaluations');
    
    console.log('\n4. 💾 CACHING:');
    console.log('   • Cache rule evaluation results');
    console.log('   • Implement memoization for repeated lookups');
    
    console.log('\n5. ⚡ LAZY EVALUATION:');
    console.log('   • Only evaluate rules when needed');
    console.log('   • Implement early termination for rule matching');
}

function calculateStats(businessUnit) {
    let conditions = 0;
    let totalValues = 0;
    let maxValues = 0;
    
    businessUnit.rules.forEach(rule => {
        if (rule.viewConditions) {
            rule.viewConditions.forEach(condition => {
                conditions++;
                const values = condition.values || [];
                totalValues += values.length;
                maxValues = Math.max(maxValues, values.length);
            });
        }
    });
    
    return {
        rules: businessUnit.rules.length,
        conditions,
        totalValues,
        maxValues,
        avgValues: conditions > 0 ? (totalValues / conditions).toFixed(1) : 0
    };
}

function calculateCartesianProduct(businessUnit) {
    let total = 0;
    
    businessUnit.rules.forEach(rule => {
        if (rule.viewConditions && rule.viewConditions.length > 0) {
            let ruleProduct = 1;
            rule.viewConditions.forEach(condition => {
                const values = condition.values || [];
                ruleProduct *= Math.max(values.length, 1);
            });
            total += ruleProduct;
        }
    });
    
    return total;
}

main().catch(console.error);

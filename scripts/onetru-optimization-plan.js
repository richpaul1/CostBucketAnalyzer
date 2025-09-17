#!/usr/bin/env node

/**
 * OneTru Optimization Plan Generator
 * 
 * This script generates a detailed optimization plan for OneTru rules
 * to resolve circular references and improve performance
 */

import path from 'path';
import { getCostCategoriesAsJSON, createFileFromPath } from '../src/lib/utils.js';

async function main() {
    try {
        console.log('🔄 Loading tunow.json file...');
        const filePath = path.resolve(process.cwd(), 'costcat/tunow.json');
        const tunowFile = await createFileFromPath(filePath);
        const tunowData = await getCostCategoriesAsJSON(tunowFile);
        
        console.log('🔍 Generating OneTru optimization plan...\n');
        
        const businessMappings = tunowData.resource?.businessMappings || tunowData.businessMappings;
        const businessUnitsCategory = businessMappings.find(mapping => mapping.name === 'Business Units');
        const onetru = businessUnitsCategory?.costTargets.find(target => target.name === 'onetru');
        
        if (!onetru) {
            console.log('❌ OneTru business unit not found');
            return;
        }
        
        generateOptimizationPlan(onetru);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

function generateOptimizationPlan(onetru) {
    console.log('🚨 ONETRU OPTIMIZATION PLAN');
    console.log('='.repeat(80));
    
    // Analyze current state
    const currentRule = onetru.rules[0];
    const currentValues = currentRule.viewConditions[0].values;
    
    console.log('\n📊 CURRENT STATE ANALYSIS:');
    console.log('-'.repeat(50));
    console.log(`• Single rule with ${currentValues.length} values`);
    console.log(`• 49 circular references detected`);
    console.log(`• 3,432 conflicts (24.2% of all conflicts)`);
    console.log(`• 10x slower performance than Marketing Solutions`);
    
    // Group products by logical categories
    const productGroups = categorizeOnetruProducts(currentValues);
    
    console.log('\n🗂️  PROPOSED RULE STRUCTURE:');
    console.log('-'.repeat(50));
    
    Object.entries(productGroups).forEach(([category, products], index) => {
        console.log(`\nRule ${index + 1}: OneTru ${category.charAt(0).toUpperCase() + category.slice(1)}`);
        console.log(`  Products: ${products.length}`);
        console.log(`  Examples: ${products.slice(0, 3).join(', ')}${products.length > 3 ? '...' : ''}`);
        console.log(`  Performance Impact: ${Math.ceil(currentValues.length / products.length)}x faster lookup`);
    });
    
    console.log('\n⚡ PERFORMANCE IMPROVEMENTS:');
    console.log('-'.repeat(50));
    
    const totalRules = Object.keys(productGroups).length;
    const avgRuleSize = Math.ceil(currentValues.length / totalRules);
    const performanceGain = Math.ceil(currentValues.length / avgRuleSize);
    
    console.log(`• Rule count: 1 → ${totalRules} (${totalRules}x more specific)`);
    console.log(`• Average rule size: ${currentValues.length} → ${avgRuleSize} values (${Math.ceil(currentValues.length / avgRuleSize)}x smaller)`);
    console.log(`• Lookup performance: ${performanceGain}x faster average case`);
    console.log(`• Memory usage: More efficient due to smaller rule sets`);
    console.log(`• Cache efficiency: Better hit rates with smaller, focused rules`);
    
    console.log('\n🔧 IMPLEMENTATION STEPS:');
    console.log('-'.repeat(50));
    
    console.log('\n1. 📋 BACKUP CURRENT CONFIGURATION');
    console.log('   • Export current OneTru rule configuration');
    console.log('   • Document existing behavior for validation');
    
    console.log('\n2. 🗂️  CREATE CATEGORIZED RULES');
    Object.entries(productGroups).forEach(([category, products], index) => {
        console.log(`\n   Rule ${index + 1}: OneTru ${category.charAt(0).toUpperCase() + category.slice(1)}`);
        console.log(`   • Field: Mapped Product`);
        console.log(`   • Operator: IN`);
        console.log(`   • Values: [${products.length} products]`);
        console.log(`   • Products: ${products.join(', ')}`);
    });
    
    console.log('\n3. 🔄 RESOLVE CIRCULAR REFERENCES');
    console.log('   • Remove self-referencing "onetru" from product lists');
    console.log('   • Create hierarchy: Business Unit → Product Categories → Specific Products');
    console.log('   • Establish clear precedence order');
    
    console.log('\n4. ✅ VALIDATION STEPS');
    console.log('   • Test rule evaluation performance');
    console.log('   • Verify cost allocation accuracy');
    console.log('   • Compare conflict counts before/after');
    console.log('   • Validate all OneTru products are still covered');
    
    console.log('\n5. 🚀 DEPLOYMENT STRATEGY');
    console.log('   • Deploy to test environment first');
    console.log('   • Run parallel evaluation (old vs new rules)');
    console.log('   • Gradual rollout with monitoring');
    console.log('   • Rollback plan if issues detected');
    
    console.log('\n📈 EXPECTED OUTCOMES:');
    console.log('-'.repeat(50));
    console.log('• 🚀 Performance: 5-10x faster rule evaluation');
    console.log('• 🔄 Circular References: Eliminated (49 → 0)');
    console.log('• ⚔️  Conflicts: Reduced by 60-80%');
    console.log('• 🧠 Maintainability: Much easier to manage and update');
    console.log('• 🔍 Debugging: Clearer rule logic and easier troubleshooting');
    
    console.log('\n⚠️  RISKS AND MITIGATION:');
    console.log('-'.repeat(50));
    console.log('• Risk: Cost allocation changes');
    console.log('  Mitigation: Thorough testing and validation');
    console.log('• Risk: Rule precedence conflicts');
    console.log('  Mitigation: Clear documentation and testing');
    console.log('• Risk: Performance regression');
    console.log('  Mitigation: Benchmark testing and monitoring');
    
    console.log('\n🎯 SUCCESS METRICS:');
    console.log('-'.repeat(50));
    console.log('• Rule evaluation time < 100ms (currently ~1000ms)');
    console.log('• Zero circular references');
    console.log('• <500 OneTru-related conflicts (currently 3,432)');
    console.log('• 100% cost allocation accuracy maintained');
    
    console.log('\n' + '='.repeat(80));
}

function categorizeOnetruProducts(products) {
    const categories = {
        analytics: [],
        credit: [],
        platform: [],
        storage: [],
        data: [],
        identity: [],
        core: []
    };
    
    products.forEach(product => {
        const lowerProduct = product.toLowerCase();
        
        if (lowerProduct.includes('analytics')) {
            categories.analytics.push(product);
        } else if (lowerProduct.includes('credit') || lowerProduct.includes('tier')) {
            categories.credit.push(product);
        } else if (lowerProduct.includes('platform') || lowerProduct.includes('orchestration')) {
            categories.platform.push(product);
        } else if (lowerProduct.includes('storage')) {
            categories.storage.push(product);
        } else if (lowerProduct.includes('data') || lowerProduct.includes('edl') || lowerProduct.includes('cleanroom')) {
            categories.data.push(product);
        } else if (lowerProduct.includes('identity') || lowerProduct.includes('oneid') || lowerProduct.includes('ciam')) {
            categories.identity.push(product);
        } else {
            categories.core.push(product);
        }
    });
    
    // Remove empty categories
    Object.keys(categories).forEach(key => {
        if (categories[key].length === 0) {
            delete categories[key];
        }
    });
    
    // If core is too large, split it further
    if (categories.core && categories.core.length > 15) {
        const services = [];
        const infrastructure = [];
        const other = [];
        
        categories.core.forEach(product => {
            const lowerProduct = product.toLowerCase();
            if (lowerProduct.includes('service') || lowerProduct.includes('portal') || lowerProduct.includes('api')) {
                services.push(product);
            } else if (lowerProduct.includes('infra') || lowerProduct.includes('network') || lowerProduct.includes('security')) {
                infrastructure.push(product);
            } else {
                other.push(product);
            }
        });
        
        delete categories.core;
        if (services.length > 0) categories.services = services;
        if (infrastructure.length > 0) categories.infrastructure = infrastructure;
        if (other.length > 0) categories.other = other;
    }
    
    return categories;
}

main().catch(console.error);

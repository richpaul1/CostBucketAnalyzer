#!/usr/bin/env node

/**
 * OneTru Circular Reference Deep Analysis
 * 
 * This script analyzes the specific circular reference where OneTru Business Unit
 * references itself through 49 different OneTru products, creating a logical loop.
 */

import path from 'path';
import { getCostCategoriesAsJSON, createFileFromPath } from '../src/lib/utils.js';

async function main() {
    try {
        console.log('🔄 Loading tunow.json file...');
        const filePath = path.resolve(process.cwd(), 'costcat/tunow.json');
        const tunowFile = await createFileFromPath(filePath);
        const tunowData = await getCostCategoriesAsJSON(tunowFile);
        
        console.log('🔍 Analyzing OneTru circular reference problem...\n');
        
        analyzeCircularReference(tunowData);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

function analyzeCircularReference(tunowData) {
    const businessMappings = tunowData.resource?.businessMappings || tunowData.businessMappings;
    
    // Find Business Units category
    const businessUnitsCategory = businessMappings.find(mapping => mapping.name === 'Business Units');
    const onetruBusinessUnit = businessUnitsCategory?.costTargets.find(target => target.name === 'onetru');
    
    // Find Mapped Product category  
    const mappedProductCategory = businessMappings.find(mapping => mapping.name === 'Mapped Product');
    
    console.log('🚨 CIRCULAR REFERENCE ANALYSIS');
    console.log('='.repeat(80));
    
    console.log('\n📊 THE PROBLEM:');
    console.log('-'.repeat(50));
    console.log('Business Units > onetru → references → Mapped Products containing "onetru"');
    console.log('This creates a logical circular dependency where:');
    console.log('  OneTru Business Unit → OneTru Products → Back to OneTru Business Unit');
    
    if (!onetruBusinessUnit) {
        console.log('❌ OneTru business unit not found');
        return;
    }
    
    // Extract the OneTru products that create circular references
    const onetruRule = onetruBusinessUnit.rules[0];
    const onetruProducts = onetruRule.viewConditions[0].values;
    const circularProducts = onetruProducts.filter(product => 
        product.toLowerCase().includes('onetru')
    );
    
    console.log(`\n🔄 CIRCULAR REFERENCE DETAILS:`);
    console.log('-'.repeat(50));
    console.log(`Business Unit "onetru" references ${circularProducts.length} products that contain "onetru"`);
    console.log(`Total products in rule: ${onetruProducts.length}`);
    console.log(`Circular percentage: ${((circularProducts.length / onetruProducts.length) * 100).toFixed(1)}%`);
    
    console.log(`\n🏷️  CIRCULAR PRODUCTS (${circularProducts.length}):`);
    circularProducts.forEach((product, index) => {
        console.log(`${index + 1}. ${product}`);
    });
    
    // Analyze the impact
    console.log(`\n💥 IMPACT ANALYSIS:`);
    console.log('-'.repeat(50));
    console.log('1. 🔄 LOGICAL LOOP:');
    console.log('   • Cost allocation rule says: "OneTru business unit includes OneTru products"');
    console.log('   • But OneTru products are defined by... OneTru business unit');
    console.log('   • This creates a circular definition problem');
    
    console.log('\n2. 🐌 PERFORMANCE IMPACT:');
    console.log('   • Rule evaluation may need to resolve circular dependencies');
    console.log('   • Potential for infinite loops in rule processing');
    console.log('   • Increased complexity in conflict detection algorithms');
    
    console.log('\n3. 🧠 LOGICAL INCONSISTENCY:');
    console.log('   • Business Unit should define WHAT products belong to it');
    console.log('   • Products should not reference back to their parent business unit');
    console.log('   • Creates ambiguity in cost allocation hierarchy');
    
    // Find where these products are also defined in Mapped Product
    console.log(`\n🔍 MAPPED PRODUCT ANALYSIS:`);
    console.log('-'.repeat(50));
    
    let mappedProductMatches = 0;
    if (mappedProductCategory) {
        mappedProductCategory.costTargets.forEach(target => {
            if (circularProducts.includes(target.name)) {
                mappedProductMatches++;
                console.log(`Found in Mapped Product: ${target.name}`);
            }
        });
    }
    
    console.log(`Products also in Mapped Product category: ${mappedProductMatches}`);
    
    // Provide solutions
    console.log(`\n🛠️  SOLUTION STRATEGIES:`);
    console.log('-'.repeat(50));
    
    console.log('\n1. 🗂️  HIERARCHICAL SEPARATION:');
    console.log('   • Business Unit "onetru" should only reference NON-OneTru products');
    console.log('   • OneTru-specific products should be handled by product-level rules');
    console.log('   • Create clear hierarchy: Business Unit → Product Category → Specific Products');
    
    console.log('\n2. 🎯 RULE RESTRUCTURING:');
    console.log('   • Option A: Remove OneTru products from Business Unit rule');
    console.log('   • Option B: Create separate OneTru product category rules');
    console.log('   • Option C: Use exclusion rules (NOT_IN) for non-OneTru products');
    
    console.log('\n3. 📋 RECOMMENDED APPROACH:');
    console.log('   Step 1: Remove circular OneTru products from Business Unit rule');
    console.log('   Step 2: Create dedicated OneTru product category rules');
    console.log('   Step 3: Establish clear precedence order');
    console.log('   Step 4: Test for logical consistency');
    
    // Generate the fixed rule
    const nonCircularProducts = onetruProducts.filter(product => 
        !product.toLowerCase().includes('onetru')
    );
    
    console.log(`\n✅ PROPOSED SOLUTION:`);
    console.log('-'.repeat(50));
    console.log(`Current Business Unit "onetru" rule: ${onetruProducts.length} products`);
    console.log(`Proposed Business Unit "onetru" rule: ${nonCircularProducts.length} products`);
    console.log(`Products to move to separate rules: ${circularProducts.length} products`);
    
    console.log(`\n📝 NON-CIRCULAR PRODUCTS FOR BUSINESS UNIT (${nonCircularProducts.length}):`);
    nonCircularProducts.forEach((product, index) => {
        console.log(`${index + 1}. ${product}`);
    });
    
    console.log(`\n🔧 IMPLEMENTATION PLAN:`);
    console.log('-'.repeat(50));
    console.log('1. Backup current configuration');
    console.log('2. Update Business Unit "onetru" to only include non-OneTru products');
    console.log('3. Create separate rules for OneTru product categories');
    console.log('4. Test cost allocation accuracy');
    console.log('5. Validate performance improvements');
    
    console.log(`\n📈 EXPECTED BENEFITS:`);
    console.log('-'.repeat(50));
    console.log('• ✅ Eliminates circular references');
    console.log('• 🚀 Improves rule evaluation performance');
    console.log('• 🧠 Creates logical, maintainable rule structure');
    console.log('• 🔍 Easier debugging and troubleshooting');
    console.log('• ⚔️  Reduces rule conflicts');
    
    console.log('\n' + '='.repeat(80));
}

main().catch(console.error);

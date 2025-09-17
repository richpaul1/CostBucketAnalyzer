import { describe, it, beforeAll, expect } from 'vitest';
import path from 'path';
import { getCostCategoriesAsJSON, createFileFromPath } from '../src/lib/utils.js';

describe('True Circular Rules Analysis', () => {
    let tunowData;

    beforeAll(async () => {
        const filePath = path.resolve(process.cwd(), 'costcat/tunow.json');
        const tunowFile = await createFileFromPath(filePath);
        tunowData = await getCostCategoriesAsJSON(tunowFile);
    });

    function findTrueCircularRules(data) {
        const businessMappings = data.resource?.businessMappings || data.businessMappings;
        const circularRules = [];
        
        businessMappings.forEach(category => {
            category.costTargets.forEach(target => {
                target.rules.forEach((rule, ruleIndex) => {
                    rule.viewConditions?.forEach((condition, condIndex) => {
                        const values = condition.values || [];
                        
                        // Check if the target name appears in its own values
                        if (values.includes(target.name)) {
                            circularRules.push({
                                category: category.name,
                                categoryUuid: category.uuid,
                                target: target.name,
                                targetUuid: target.uuid,
                                ruleIndex,
                                conditionIndex: condIndex,
                                fieldName: condition.viewField?.fieldName,
                                operator: condition.viewOperator,
                                allValues: values,
                                circularValue: target.name,
                                severity: 'CRITICAL'
                            });
                        }
                        
                        // Also check for variations (case-insensitive, with spaces/hyphens)
                        const targetVariations = [
                            target.name.toLowerCase(),
                            target.name.replace(/\s+/g, ''),
                            target.name.replace(/\s+/g, '-'),
                            target.name.replace(/-/g, ' '),
                            target.name.replace(/_/g, ' '),
                            target.name.replace(/\s+/g, '_')
                        ];
                        
                        values.forEach(value => {
                            const lowerValue = value.toLowerCase();
                            if (targetVariations.some(variation => 
                                lowerValue === variation || 
                                lowerValue.includes(variation) ||
                                variation.includes(lowerValue)
                            ) && value !== target.name) {
                                circularRules.push({
                                    category: category.name,
                                    categoryUuid: category.uuid,
                                    target: target.name,
                                    targetUuid: target.uuid,
                                    ruleIndex,
                                    conditionIndex: condIndex,
                                    fieldName: condition.viewField?.fieldName,
                                    operator: condition.viewOperator,
                                    allValues: values,
                                    circularValue: value,
                                    severity: 'HIGH',
                                    type: 'VARIATION'
                                });
                            }
                        });
                    });
                });
            });
        });
        
        return circularRules;
    }

    function analyzeOnetruCircularRules(circularRules) {
        return circularRules.filter(rule => 
            rule.target.toLowerCase().includes('onetru') ||
            rule.circularValue.toLowerCase().includes('onetru')
        );
    }

    function generateCircularRuleFixes(circularRules) {
        const fixes = [];
        
        circularRules.forEach(rule => {
            const filteredValues = rule.allValues.filter(value => 
                value !== rule.circularValue
            );
            
            fixes.push({
                category: rule.category,
                target: rule.target,
                issue: `Target "${rule.target}" references itself in values`,
                currentValues: rule.allValues.length,
                fixedValues: filteredValues.length,
                removedValue: rule.circularValue,
                recommendation: filteredValues.length > 0 
                    ? 'Remove self-reference from values array'
                    : 'Rule becomes empty - consider deletion or restructuring',
                priority: rule.severity
            });
        });
        
        return fixes;
    }

    it('should identify true circular rules', () => {
        console.log('\n🔄 TRUE CIRCULAR RULES ANALYSIS');
        console.log('='.repeat(80));
        console.log('(Where cost bucket name appears in its own values section)');
        
        const circularRules = findTrueCircularRules(tunowData);
        
        console.log(`\n📊 SUMMARY:`);
        console.log(`Total circular rules found: ${circularRules.length}`);
        
        if (circularRules.length === 0) {
            console.log('✅ No true circular rules detected');
            console.log('   (No cost buckets reference themselves in their values)');
        } else {
            console.log(`🚨 Found ${circularRules.length} circular rule violations`);
            
            const bySeverity = circularRules.reduce((acc, rule) => {
                acc[rule.severity] = (acc[rule.severity] || 0) + 1;
                return acc;
            }, {});
            
            console.log('\n📈 BY SEVERITY:');
            Object.entries(bySeverity).forEach(([severity, count]) => {
                console.log(`${severity}: ${count} rules`);
            });
            
            console.log('\n🔍 CIRCULAR RULE DETAILS:');
            circularRules.forEach((rule, index) => {
                console.log(`\n${index + 1}. ${rule.category} > ${rule.target}`);
                console.log(`   Field: ${rule.fieldName}`);
                console.log(`   Operator: ${rule.operator}`);
                console.log(`   Circular Value: "${rule.circularValue}"`);
                console.log(`   Total Values: ${rule.allValues.length}`);
                console.log(`   Severity: ${rule.severity}`);
                if (rule.type) {
                    console.log(`   Type: ${rule.type}`);
                }
                
                // Show first few values for context
                const contextValues = rule.allValues.slice(0, 5);
                console.log(`   Values (first 5): ${contextValues.join(', ')}${rule.allValues.length > 5 ? '...' : ''}`);
            });
        }
        
        expect(circularRules).toBeDefined();
    });

    it('should analyze OneTru circular rules specifically', () => {
        console.log('\n🎯 ONETRU CIRCULAR RULES ANALYSIS');
        console.log('='.repeat(80));
        
        const allCircularRules = findTrueCircularRules(tunowData);
        const onetruCircularRules = analyzeOnetruCircularRules(allCircularRules);
        
        console.log(`\n📊 ONETRU CIRCULAR RULES:`);
        console.log(`Total OneTru circular rules: ${onetruCircularRules.length}`);
        console.log(`Percentage of all circular rules: ${allCircularRules.length > 0 ? ((onetruCircularRules.length / allCircularRules.length) * 100).toFixed(1) : 0}%`);
        
        if (onetruCircularRules.length > 0) {
            console.log('\n🔍 ONETRU CIRCULAR RULE DETAILS:');
            onetruCircularRules.forEach((rule, index) => {
                console.log(`\n${index + 1}. ${rule.category} > ${rule.target}`);
                console.log(`   Circular Value: "${rule.circularValue}"`);
                console.log(`   Field: ${rule.fieldName}`);
                console.log(`   Total Values: ${rule.allValues.length}`);
                console.log(`   Impact: Self-referencing rule creates logical loop`);
            });
        } else {
            console.log('✅ No OneTru-specific circular rules found');
        }
        
        expect(onetruCircularRules).toBeDefined();
    });

    it('should provide circular rule fixes', () => {
        console.log('\n🛠️  CIRCULAR RULE FIXES');
        console.log('='.repeat(80));
        
        const circularRules = findTrueCircularRules(tunowData);
        
        if (circularRules.length === 0) {
            console.log('✅ No circular rules to fix');
            return;
        }
        
        const fixes = generateCircularRuleFixes(circularRules);
        
        console.log(`\n📋 RECOMMENDED FIXES (${fixes.length}):`);
        
        fixes.forEach((fix, index) => {
            console.log(`\n${index + 1}. ${fix.category} > ${fix.target}`);
            console.log(`   Issue: ${fix.issue}`);
            console.log(`   Current Values: ${fix.currentValues}`);
            console.log(`   After Fix: ${fix.fixedValues} values`);
            console.log(`   Remove: "${fix.removedValue}"`);
            console.log(`   Recommendation: ${fix.recommendation}`);
            console.log(`   Priority: ${fix.priority}`);
        });
        
        console.log('\n💡 IMPLEMENTATION STEPS:');
        console.log('1. 📋 Backup current configuration');
        console.log('2. 🔧 Remove self-referencing values from rules');
        console.log('3. ✅ Validate rules still have meaningful values');
        console.log('4. 🧪 Test cost allocation accuracy');
        console.log('5. 📈 Measure performance improvements');
        
        console.log('\n📈 EXPECTED BENEFITS:');
        console.log('• ✅ Eliminates logical inconsistencies');
        console.log('• 🚀 Improves rule evaluation performance');
        console.log('• 🔍 Clearer cost allocation logic');
        console.log('• ⚔️  Reduces rule conflicts');
        
        expect(fixes.length).toBeGreaterThanOrEqual(0);
    });
});

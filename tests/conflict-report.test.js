import { describe, it, beforeAll, expect } from 'vitest';
import path from 'path';
import { getCostCategoriesAsJSON, getConflicts, generateConflictReport, createFileFromPath } from '../src/lib/utils.js';

describe('Conflict Report Analysis', () => {
    let tunowData;
    let tunowFile;
    let conflicts;

    beforeAll(async () => {
        const filePath = path.resolve(process.cwd(), 'costcat/tunow.json');
        tunowFile = await createFileFromPath(filePath);
        tunowData = await getCostCategoriesAsJSON(tunowFile);
        conflicts = getConflicts(tunowData, 'all');
    });

    it('should generate a comprehensive conflict report', () => {
        const report = generateConflictReport(conflicts, {
            maxConflicts: 100,
            groupByCategory: true,
            includeConditionDetails: true,
            sortBy: 'category'
        });

        console.log('\n🔍 COMPREHENSIVE CONFLICT REPORT');
        console.log('=' .repeat(80));
        
        // Summary Section
        console.log('\n📊 EXECUTIVE SUMMARY');
        console.log('-'.repeat(40));
        console.log(`Total Conflicts Found: ${report.summary.totalConflicts.toLocaleString()}`);
        console.log(`Categories Involved: ${report.summary.categoriesInvolved.length}`);
        console.log(`Conflict Types:`);
        Object.entries(report.summary.conflictTypes).forEach(([type, count]) => {
            console.log(`  • ${type.toUpperCase()}: ${count.toLocaleString()}`);
        });

        console.log('\n🏆 TOP PROBLEMATIC CATEGORIES');
        console.log('-'.repeat(40));
        Object.entries(report.summary.mostProblematicCategories).forEach(([category, count], index) => {
            const rank = index + 1;
            const emoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '📍';
            console.log(`${emoji} ${rank}. ${category}: ${count.toLocaleString()} conflicts`);
        });

        console.log('\n🔍 DETAILED CONFLICT ANALYSIS');
        console.log('-'.repeat(40));
        
        // Show top 10 category pairs with most conflicts
        const topConflictPairs = report.details
            .sort((a, b) => b.conflictCount - a.conflictCount)
            .slice(0, 10);

        topConflictPairs.forEach((detail, index) => {
            console.log(`\n${index + 1}. ${detail.categoryPair}`);
            console.log(`   Conflicts: ${detail.conflictCount} (${detail.conflicts[0]?.severity || 'UNKNOWN'} severity)`);
            
            // Show first few examples
            const examples = detail.conflicts.slice(0, 3);
            examples.forEach((conflict, i) => {
                console.log(`   Example ${i + 1}:`);
                console.log(`     Source: ${conflict.sourceBucket}`);
                console.log(`     Target: ${conflict.targetBucket}`);
                console.log(`     Type: ${conflict.type.toUpperCase()}`);
                if (conflict.condition && typeof conflict.condition === 'string') {
                    const conditionPreview = conflict.condition.length > 80 
                        ? conflict.condition.substring(0, 80) + '...'
                        : conflict.condition;
                    console.log(`     Condition: ${conditionPreview}`);
                }
            });
            
            if (detail.conflictCount > 3) {
                console.log(`     ... and ${detail.conflictCount - 3} more conflicts`);
            }
        });

        console.log('\n📈 IMPACT ANALYSIS');
        console.log('-'.repeat(40));
        
        const highSeverityCount = report.details.filter(d => 
            d.conflicts.some(c => c.severity === 'HIGH')).length;
        const mediumSeverityCount = report.details.filter(d => 
            d.conflicts.some(c => c.severity === 'MEDIUM')).length;
        const lowSeverityCount = report.details.filter(d => 
            d.conflicts.some(c => c.severity === 'LOW')).length;

        console.log(`🔴 High Severity Category Pairs: ${highSeverityCount}`);
        console.log(`🟡 Medium Severity Category Pairs: ${mediumSeverityCount}`);
        console.log(`🟢 Low Severity Category Pairs: ${lowSeverityCount}`);

        console.log('\n💡 RECOMMENDATIONS');
        console.log('-'.repeat(40));
        
        if (report.summary.totalConflicts > 10000) {
            console.log('🚨 CRITICAL: Extremely high number of conflicts detected');
            console.log('   • Immediate review of cost allocation rules required');
            console.log('   • Consider rule consolidation and simplification');
        } else if (report.summary.totalConflicts > 1000) {
            console.log('⚠️  WARNING: High number of conflicts detected');
            console.log('   • Review and optimize overlapping rules');
        } else {
            console.log('✅ GOOD: Manageable number of conflicts');
        }

        const topCategory = Object.keys(report.summary.mostProblematicCategories)[0];
        if (topCategory) {
            console.log(`   • Focus optimization efforts on "${topCategory}" category`);
        }

        console.log('   • Implement rule precedence hierarchy');
        console.log('   • Add validation checks for new rules');
        console.log('   • Consider automated conflict resolution strategies');

        console.log('\n' + '='.repeat(80));

        // Assertions
        expect(report).toBeDefined();
        expect(report.summary.totalConflicts).toBeGreaterThan(0);
        expect(report.details).toBeInstanceOf(Array);
        expect(report.summary.categoriesInvolved.length).toBeGreaterThan(0);
    });

    it('should generate a focused high-severity conflict report', () => {
        const report = generateConflictReport(conflicts, {
            maxConflicts: 25,
            groupByCategory: true,
            includeConditionDetails: false,
            sortBy: 'category'
        });

        console.log('\n🚨 HIGH-SEVERITY CONFLICTS REPORT');
        console.log('=' .repeat(60));

        // Filter for high-impact conflicts (category pairs with >100 conflicts)
        const highImpactPairs = report.details
            .filter(detail => detail.conflictCount > 100)
            .sort((a, b) => b.conflictCount - a.conflictCount);

        console.log(`\n📊 Found ${highImpactPairs.length} high-impact category pairs`);
        console.log(`(Category pairs with >100 conflicts each)\n`);

        highImpactPairs.forEach((detail, index) => {
            console.log(`${index + 1}. ${detail.categoryPair}`);
            console.log(`   🔥 ${detail.conflictCount.toLocaleString()} conflicts`);
            
            // Show conflict types breakdown
            const typeBreakdown = {};
            detail.conflicts.forEach(conflict => {
                typeBreakdown[conflict.type] = (typeBreakdown[conflict.type] || 0) + 1;
            });
            
            console.log(`   Types: ${Object.entries(typeBreakdown)
                .map(([type, count]) => `${type}(${count})`)
                .join(', ')}`);
            
            // Show unique buckets involved
            const sourceBuckets = new Set(detail.conflicts.map(c => c.sourceBucket));
            const targetBuckets = new Set(detail.conflicts.map(c => c.targetBucket));
            
            console.log(`   Source buckets: ${sourceBuckets.size}, Target buckets: ${targetBuckets.size}`);
            console.log('');
        });

        if (highImpactPairs.length === 0) {
            console.log('✅ No high-impact conflict pairs found (>100 conflicts per pair)');
        }

        console.log('='.repeat(60));

        expect(report).toBeDefined();
        expect(Array.isArray(report.details)).toBe(true);
    });

    it('should generate a summary-only conflict report', () => {
        const report = generateConflictReport(conflicts, {
            maxConflicts: 0, // Only summary
            groupByCategory: false,
            includeConditionDetails: false
        });

        console.log('\n📋 CONFLICT SUMMARY REPORT');
        console.log('=' .repeat(50));
        
        console.log(`\n🔢 QUICK STATS`);
        console.log(`Total Conflicts: ${report.summary.totalConflicts.toLocaleString()}`);
        console.log(`Categories Involved: ${report.summary.categoriesInvolved.length}`);
        
        console.log(`\n📊 CONFLICT DISTRIBUTION`);
        Object.entries(report.summary.conflictTypes).forEach(([type, count]) => {
            const percentage = ((count / report.summary.totalConflicts) * 100).toFixed(1);
            console.log(`${type.toUpperCase()}: ${count.toLocaleString()} (${percentage}%)`);
        });

        console.log(`\n🎯 TOP 5 PROBLEMATIC CATEGORIES`);
        Object.entries(report.summary.mostProblematicCategories)
            .slice(0, 5)
            .forEach(([category, count], index) => {
                const percentage = ((count / report.summary.totalConflicts) * 100).toFixed(1);
                console.log(`${index + 1}. ${category}: ${count.toLocaleString()} (${percentage}%)`);
            });

        console.log('\n' + '='.repeat(50));

        expect(report.summary.totalConflicts).toBeGreaterThan(0);
        expect(report.details.length).toBe(0); // Should be empty for summary-only
    });
});

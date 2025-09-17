#!/usr/bin/env node

/**
 * Standalone Conflict Report Generator
 * 
 * This script analyzes the tunow.json file and generates a detailed conflict report
 * without running the full test suite.
 * 
 * Usage:
 *   node scripts/generate-conflict-report.js
 *   node scripts/generate-conflict-report.js --detailed
 *   node scripts/generate-conflict-report.js --summary-only
 */

import path from 'path';
import { getCostCategoriesAsJSON, getConflicts, generateConflictReport, createFileFromPath } from '../src/lib/utils.js';

async function main() {
    const args = process.argv.slice(2);
    const isDetailed = args.includes('--detailed');
    const isSummaryOnly = args.includes('--summary-only');
    
    try {
        console.log('🔄 Loading tunow.json file...');
        const filePath = path.resolve(process.cwd(), 'costcat/tunow.json');
        const tunowFile = await createFileFromPath(filePath);
        
        console.log('📊 Parsing cost bucket data...');
        const tunowData = await getCostCategoriesAsJSON(tunowFile);
        
        console.log('🔍 Analyzing conflicts...');
        const conflicts = getConflicts(tunowData, 'all');
        
        if (isSummaryOnly) {
            // Generate summary-only report
            const report = generateConflictReport(conflicts, {
                maxConflicts: 0,
                groupByCategory: false,
                includeConditionDetails: false
            });
            
            printSummaryReport(report);
            
        } else if (isDetailed) {
            // Generate detailed report
            const report = generateConflictReport(conflicts, {
                maxConflicts: 200,
                groupByCategory: true,
                includeConditionDetails: true,
                sortBy: 'category'
            });
            
            printDetailedReport(report);
            
        } else {
            // Generate standard report
            const report = generateConflictReport(conflicts, {
                maxConflicts: 50,
                groupByCategory: true,
                includeConditionDetails: false,
                sortBy: 'category'
            });
            
            printStandardReport(report);
        }
        
    } catch (error) {
        console.error('❌ Error generating conflict report:', error.message);
        process.exit(1);
    }
}

function printSummaryReport(report) {
    console.log('\n📋 CONFLICT SUMMARY REPORT');
    console.log('='.repeat(50));
    
    console.log(`\n🔢 QUICK STATS`);
    console.log(`Total Conflicts: ${report.summary.totalConflicts.toLocaleString()}`);
    console.log(`Categories Involved: ${report.summary.categoriesInvolved.length}`);
    
    console.log(`\n📊 CONFLICT DISTRIBUTION`);
    Object.entries(report.summary.conflictTypes).forEach(([type, count]) => {
        const percentage = ((count / report.summary.totalConflicts) * 100).toFixed(1);
        console.log(`${type.toUpperCase()}: ${count.toLocaleString()} (${percentage}%)`);
    });

    console.log(`\n🎯 TOP PROBLEMATIC CATEGORIES`);
    Object.entries(report.summary.mostProblematicCategories).forEach(([category, count], index) => {
        const percentage = ((count / report.summary.totalConflicts) * 100).toFixed(1);
        console.log(`${index + 1}. ${category}: ${count.toLocaleString()} (${percentage}%)`);
    });

    console.log('\n' + '='.repeat(50));
}

function printStandardReport(report) {
    console.log('\n🔍 STANDARD CONFLICT REPORT');
    console.log('='.repeat(70));
    
    // Executive Summary
    console.log('\n📊 EXECUTIVE SUMMARY');
    console.log('-'.repeat(40));
    console.log(`Total Conflicts Found: ${report.summary.totalConflicts.toLocaleString()}`);
    console.log(`Categories Involved: ${report.summary.categoriesInvolved.length}`);
    
    console.log('\n🏆 TOP PROBLEMATIC CATEGORIES');
    console.log('-'.repeat(40));
    Object.entries(report.summary.mostProblematicCategories).slice(0, 5).forEach(([category, count], index) => {
        const rank = index + 1;
        const emoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '📍';
        console.log(`${emoji} ${rank}. ${category}: ${count.toLocaleString()} conflicts`);
    });

    console.log('\n🔍 TOP CONFLICT PAIRS');
    console.log('-'.repeat(40));
    
    const topPairs = report.details
        .sort((a, b) => b.conflictCount - a.conflictCount)
        .slice(0, 10);

    topPairs.forEach((detail, index) => {
        console.log(`\n${index + 1}. ${detail.categoryPair}`);
        console.log(`   Conflicts: ${detail.conflictCount} (${getSeverityLabel(detail.conflictCount)})`);
        
        if (detail.conflicts.length > 0) {
            const example = detail.conflicts[0];
            console.log(`   Example: ${example.sourceBucket} → ${example.targetBucket}`);
        }
    });

    console.log('\n💡 RECOMMENDATIONS');
    console.log('-'.repeat(40));
    
    if (report.summary.totalConflicts > 10000) {
        console.log('🚨 CRITICAL: Review cost allocation rules immediately');
    } else if (report.summary.totalConflicts > 1000) {
        console.log('⚠️  WARNING: High number of conflicts detected');
    } else {
        console.log('✅ GOOD: Manageable number of conflicts');
    }

    console.log('\n' + '='.repeat(70));
}

function printDetailedReport(report) {
    console.log('\n🔍 DETAILED CONFLICT REPORT');
    console.log('='.repeat(80));
    
    printStandardReport(report);
    
    console.log('\n📋 DETAILED CONFLICT BREAKDOWN');
    console.log('-'.repeat(50));
    
    report.details.slice(0, 20).forEach((detail, index) => {
        console.log(`\n${index + 1}. ${detail.categoryPair} (${detail.conflictCount} conflicts)`);
        
        detail.conflicts.slice(0, 5).forEach((conflict, i) => {
            console.log(`   ${i + 1}. ${conflict.sourceBucket} → ${conflict.targetBucket}`);
            if (conflict.condition && typeof conflict.condition === 'string') {
                const conditionPreview = conflict.condition.length > 100 
                    ? conflict.condition.substring(0, 100) + '...'
                    : conflict.condition;
                console.log(`      Condition: ${conditionPreview}`);
            }
        });
        
        if (detail.conflictCount > 5) {
            console.log(`      ... and ${detail.conflictCount - 5} more conflicts`);
        }
    });
}

function getSeverityLabel(conflictCount) {
    if (conflictCount > 100) return 'HIGH SEVERITY';
    if (conflictCount > 10) return 'MEDIUM SEVERITY';
    return 'LOW SEVERITY';
}

// Run the script
main().catch(console.error);

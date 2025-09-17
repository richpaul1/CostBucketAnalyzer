#!/usr/bin/env node

// Test script to verify the selection logic
import fs from 'fs';

function testSelectionLogic() {
    console.log('🧪 Testing selection logic...');
    
    // Load test data
    const jsonData = JSON.parse(fs.readFileSync('costcat/cbp1-cleaned.json', 'utf8'));
    console.log('📁 Original data:', {
        businessMappingsCount: jsonData.resource?.businessMappings?.length || 0,
        categories: jsonData.resource?.businessMappings?.map(bm => bm.name) || []
    });

    // Simulate the selection logic
    const costCategoriesToUpload = jsonData.resource.businessMappings.map(mapping => ({
        name: mapping.name,
        costTargets: mapping.costTargets?.length || 0,
        accountId: mapping.accountId,
        selected: true, // Default to selected
        exists: false,
        action: 'create'
    }));

    // Select all by default (simulating the UI)
    const selectedCategories = new Set(costCategoriesToUpload.map(cat => cat.name));
    
    console.log('📋 Categories prepared:', {
        totalCategories: costCategoriesToUpload.length,
        selectedCategories: Array.from(selectedCategories),
        selectedCount: selectedCategories.size
    });

    // Simulate filtering (same logic as in the UI)
    const filteredData = {
        ...jsonData,
        resource: {
            ...jsonData.resource,
            businessMappings: jsonData.resource.businessMappings.filter(mapping => 
                selectedCategories.has(mapping.name)
            )
        }
    };

    console.log('🔍 Filtered result:', {
        originalCount: jsonData.resource.businessMappings.length,
        filteredCount: filteredData.resource.businessMappings.length,
        filteredNames: filteredData.resource.businessMappings.map(bm => bm.name)
    });

    // Test with no selection
    console.log('\n🚫 Testing with no selection...');
    const emptySelection = new Set();
    const emptyFilteredData = {
        ...jsonData,
        resource: {
            ...jsonData.resource,
            businessMappings: jsonData.resource.businessMappings.filter(mapping => 
                emptySelection.has(mapping.name)
            )
        }
    };

    console.log('📭 Empty filtered result:', {
        originalCount: jsonData.resource.businessMappings.length,
        filteredCount: emptyFilteredData.resource.businessMappings.length,
        filteredNames: emptyFilteredData.resource.businessMappings.map(bm => bm.name)
    });

    console.log('\n✅ Selection logic test complete!');
}

testSelectionLogic();

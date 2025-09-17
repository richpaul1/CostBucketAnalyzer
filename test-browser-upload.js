#!/usr/bin/env node

// Test script to simulate browser upload with session
import fs from 'fs';

async function testBrowserUpload() {
    try {
        console.log('🌐 Testing browser-like upload...');
        
        // First, set up credentials (simulate settings page)
        console.log('🔑 Setting up credentials...');
        const credentialsResponse = await fetch('http://localhost:5002/api/session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': 'session=test-session'
            },
            body: JSON.stringify({
                accountId: 'SxuV0ChbRqWGSYClFlMQMQ',
                apiKey: 'pat.SxuV0ChbRqWGSYClFlMQMQ.682795c831fb9600116bb0df.QwCTkC2njp1HJ0CKKULA'
            })
        });

        if (!credentialsResponse.ok) {
            console.log('⚠️ Credentials setup failed, continuing anyway...');
        }

        // Load test data
        const testData = JSON.parse(fs.readFileSync('costcat/cbp1-cleaned.json', 'utf8'));
        console.log('📁 Loaded test data:', {
            businessMappingsCount: testData.resource?.businessMappings?.length || 0,
            categories: testData.resource?.businessMappings?.map(bm => bm.name) || []
        });

        // Simulate the upload request (with all categories selected)
        const uploadData = {
            action: 'upload',
            businessMappingData: testData.resource
        };

        console.log('📤 Making upload request...');
        const response = await fetch('http://localhost:5002/api/cost-categories', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': 'session=test-session'
            },
            body: JSON.stringify(uploadData)
        });

        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ Upload failed:', errorData);
            return;
        }

        const result = await response.json();
        console.log('✅ Upload result:', JSON.stringify(result, null, 2));

    } catch (error) {
        console.error('💥 Test failed:', error.message);
    }
}

testBrowserUpload();

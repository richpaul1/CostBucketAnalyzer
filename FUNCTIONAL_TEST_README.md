# Harness Upload Functional Test

## Overview

This functional test validates the complete upload process for CBP1 cost categories to Harness. It tests the real integration with Harness APIs using your actual credentials.

## What the Test Does

The functional test will:

1. **Load CBP1 Data**: Reads the `costcat/cbp1.json` file containing 3 cost categories:
   - "Programs" (27 cost targets)
   - "Projects" (437 cost targets) 
   - "Cost Center" (19 cost targets)

2. **Replace Account IDs**: Automatically replaces all `accountId` fields with your Harness account ID

3. **Upload to Harness**: Uses the real Harness APIs to upload all cost categories

4. **Verify Results**: Confirms the upload was successful and categories exist in Harness

## Prerequisites

### 1. Harness Credentials

You need:
- **Harness Account ID**: Found in your Harness URL or account settings
- **Harness API Key**: Generated in Harness with cost management permissions

### 2. API Key Permissions

Your API key must have these permissions:
- `ccm:costCategory:create` - To create new cost categories
- `ccm:costCategory:edit` - To update existing cost categories
- `ccm:costCategory:view` - To read cost categories

## Setup Instructions

### Option 1: Interactive Setup (Recommended)

Run the interactive setup script:

```bash
node setup-test-credentials.js
```

This will:
- Prompt you for your Harness credentials
- Create `config/test-credentials.js` with your credentials
- Provide next steps

### Option 2: Manual Setup

1. **Copy the example file**:
   ```bash
   cp config/test-credentials.example.js config/test-credentials.js
   ```

2. **Edit the credentials**:
   ```javascript
   export const TEST_CREDENTIALS = {
       accountId: 'your-actual-account-id',
       apiKey: 'your-actual-api-key'
   };
   ```

### Option 3: Environment Variables

Set environment variables:
```bash
export HARNESS_ACCOUNT_ID="your-account-id"
export HARNESS_API_KEY="your-api-key"
```

## Running the Test

### Basic Test Run

```bash
npm test tests/harness-upload-functional.test.js
```

### Verbose Output

```bash
npm test tests/harness-upload-functional.test.js -- --reporter=verbose
```

### Watch Mode

```bash
npm test tests/harness-upload-functional.test.js -- --watch
```

## Test Scenarios

The functional test includes these scenarios:

### 1. Data Structure Validation
- Validates CBP1.json structure
- Counts cost categories and targets
- Verifies data integrity

### 2. Account ID Replacement
- Tests the account ID swapping logic
- Verifies all fields are updated correctly
- Confirms data consistency

### 3. Harness Upload
- Uploads all 3 cost categories to Harness
- Tests both create and update operations
- Handles existing categories gracefully
- Reports detailed success/failure statistics

### 4. Upload Verification
- Fetches categories from Harness
- Verifies uploaded categories exist
- Confirms data was saved correctly

## Expected Results

### Successful Test Output

```
🔧 SETTING UP HARNESS UPLOAD FUNCTIONAL TEST
✅ Account ID: your-account-id
✅ API Key: pat.your-k...
✅ CBP1 data loaded successfully
📊 Business Mappings: 3
✅ Test credentials configured in session
✅ Credentials validated successfully with Harness API

📊 VALIDATING CBP1 DATA STRUCTURE
📋 Found 3 business mappings:
  1. "Programs" - 27 cost targets
  2. "Projects" - 437 cost targets
  3. "Cost Center" - 19 cost targets
📊 Total cost targets: 483

🔄 TESTING ACCOUNT ID REPLACEMENT
📊 Original accountId fields: 3
📊 Modified accountId fields: 3
🔄 Account ID replaced: nMAehCfqRM-9VjvRcSkmVw → your-account-id

🚀 UPLOADING ALL COST CATEGORIES TO HARNESS
📤 Starting upload to Harness...
📊 Uploading 3 cost categories

📊 UPLOAD RESULTS:
✅ Total Processed: 3
✅ Successful: 3
❌ Failed: 0
📈 Success Rate: 100.0%

✅ SUCCESSFUL UPLOADS:
  1. Programs (created)
  2. Projects (updated)
  3. Cost Center (created)

🔍 VERIFYING UPLOADED COST CATEGORIES
📋 Expected categories: Programs, Projects, Cost Center
📊 Found 3 categories in Harness
✅ Found categories: 3/3
   Programs, Projects, Cost Center
✅ Verification completed!

🎉 Upload test completed successfully!
```

## Troubleshooting

### Common Issues

#### 1. Credential Validation Failed
```
❌ CREDENTIAL VALIDATION FAILED
The provided credentials don't work with Harness API.
```

**Solutions**:
- Verify your Account ID is correct
- Check that your API Key is valid and not expired
- Ensure API Key has cost management permissions
- Test network connectivity to Harness

#### 2. Missing Credentials
```
❌ MISSING HARNESS ACCOUNT ID
Please provide your Harness credentials...
```

**Solutions**:
- Run `node setup-test-credentials.js`
- Or set environment variables
- Or update the test file directly

#### 3. Upload Failures
```
❌ Failed: 1
   Category Name: Permission denied
```

**Solutions**:
- Check API key permissions
- Verify account access to cost management
- Check for naming conflicts in Harness

### Debug Mode

For detailed debugging, set environment variable:
```bash
DEBUG=1 npm test tests/harness-upload-functional.test.js -- --reporter=verbose
```

## Security Notes

- **Never commit credentials**: Ensure `config/test-credentials.js` is in `.gitignore`
- **Use dedicated test API keys**: Don't use production API keys for testing
- **Rotate keys regularly**: Generate new API keys periodically
- **Limit permissions**: Only grant necessary permissions to test API keys

## Test Data

The test uses `costcat/cbp1.json` which contains:
- **3 cost categories** with different structures
- **483 total cost targets** across all categories
- **Real-world data** from CBP1 environment
- **Complex rule structures** with various operators and conditions

## Next Steps

After running the functional test:

1. **Check Harness Dashboard**: Verify the cost categories appear in your Harness account
2. **Review Upload Results**: Check the detailed success/failure report
3. **Test UI Upload**: Try the same upload through the web interface
4. **Production Planning**: Use learnings to plan production deployment

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the test output for specific error messages
3. Verify your Harness account permissions
4. Test with a smaller dataset first

# Harness Upload API Documentation

## Overview

The Cost Categories API (`src/routes/api/cost-categories/+server.js`) has been enhanced to support uploading and overwriting cost categories in Harness using the official Harness APIs:

- **Create Business Mapping**: `https://apidocs.harness.io/openapi-merged/cloud-cost-cost-categories/createbusinessmapping`
- **Update Business Mapping**: `https://apidocs.harness.io/openapi-merged/cloud-cost-cost-categories/updatebusinessmapping`

## API Endpoints

### GET `/api/cost-categories`
Fetches existing cost categories from Harness.

**Query Parameters:**
- `searchKey` (optional): Filter by name
- `sortType` (optional): Sort field (default: "NAME")
- `sortOrder` (optional): Sort direction (default: "ASCENDING")
- `limit` (optional): Number of results (default: 0)
- `offset` (optional): Pagination offset (default: 0)

### POST `/api/cost-categories`
Supports multiple actions based on the `action` parameter:

#### Action: "create"
Creates a single business mapping.

**Request Body:**
```json
{
  "action": "create",
  "businessMappingData": {
    "accountId": "your-account-id",
    "name": "Category Name",
    "costTargets": [...]
  }
}
```

#### Action: "upload"
Uploads multiple business mappings (batch operation).

**Request Body:**
```json
{
  "action": "upload",
  "businessMappingData": {
    "businessMappings": [
      {
        "accountId": "your-account-id",
        "name": "Category 1",
        "costTargets": [...]
      },
      {
        "accountId": "your-account-id", 
        "name": "Category 2",
        "costTargets": [...]
      }
    ]
  }
}
```

**Response:**
```json
{
  "success": true,
  "totalProcessed": 2,
  "successful": 2,
  "failed": 0,
  "results": [...],
  "errors": []
}
```

#### Default Action (no action specified)
Performs search/filter operations (legacy behavior).

### PUT `/api/cost-categories`
Updates an existing business mapping.

**Request Body:**
```json
{
  "uuid": "existing-mapping-uuid",
  "accountId": "your-account-id",
  "name": "Updated Category Name",
  "costTargets": [...]
}
```

## Upload Flow

### 1. Account ID Replacement
The upload process automatically replaces all `accountId` fields in the JSON data with the account ID from the user's settings:

- **Original**: `"accountId": "nMAehCfqRM-9VjvRcSkmVw"`
- **Replaced**: `"accountId": "user-settings-account-id"`

### 2. Smart Upload Logic
For each business mapping in the upload:

1. **Check if exists**: Search for existing mapping by name
2. **Update or Create**: 
   - If exists: Update using PUT with existing UUID
   - If new: Create using POST
3. **Track results**: Record success/failure for each operation

### 3. Batch Processing
The upload handles multiple business mappings in a single request:
- Processes each mapping individually
- Continues processing even if some fail
- Returns comprehensive results with success/error counts

## UI Integration

### Upload Page (`src/routes/upload/+page.svelte`)

The "Upload To Harness" tab provides:

1. **Account ID Preview**: Shows before/after account ID replacement
2. **Statistics**: Displays number of `accountId` fields to be updated
3. **Preparation Step**: Validates data and creates modified version
4. **Upload Process**: Calls the API and shows progress
5. **Results Display**: Shows success/failure counts and error details

### Usage Flow

1. **Upload JSON file** in the "Analyze" tab
2. **Configure Account ID** in Settings page
3. **Switch to "Upload To Harness" tab**
4. **Click "Prepare for Upload"** to validate and preview changes
5. **Click "Upload To Harness"** to execute the upload
6. **View results** with success/failure summary

## Error Handling

### API Level
- Validates credentials (Account ID and API Key)
- Handles Harness API errors gracefully
- Returns detailed error information
- Continues batch processing on individual failures

### UI Level
- Shows clear error messages
- Displays upload progress
- Provides detailed failure information
- Allows retry operations

## Security

- **Session-based credentials**: Account ID and API Key stored in server session
- **No credential exposure**: Credentials never sent to client
- **API key protection**: All Harness API calls use secure headers
- **Input validation**: Request data validated before processing

## Testing

Use the provided test script (`test-harness-upload.js`) to verify functionality:

```bash
node test-harness-upload.js
```

Or run in browser console after loading the page.

## Configuration

Ensure your Harness credentials are configured in the Settings page:
- **Account ID**: Your Harness account identifier
- **API Key**: Valid Harness API key with cost management permissions

## Limitations

- Requires valid Harness credentials
- API rate limits apply (as per Harness documentation)
- Large uploads may take time to process
- Network connectivity required for all operations

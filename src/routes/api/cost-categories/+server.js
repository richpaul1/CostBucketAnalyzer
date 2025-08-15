// src/routes/api/cost-categories/+server.js
import { json } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
/*************  ✨ Windsurf Command 🌟  *************/
export async function GET({ url, locals }) {
    try {
        // Get credentials from session
        const { accountId, apiKey } = locals.session.credentials || {};
        if (!accountId || !apiKey) {
            return json({ error: 'Credentials not set. Please configure in Settings.' }, { status: 401 });
        }

        // Get query parameters from the request URL
        const searchKey = url.searchParams.get('searchKey') || '';
        const sortType = url.searchParams.get('sortType') || 'NAME';
        const sortOrder = url.searchParams.get('sortOrder') || 'ASCENDING';
        const limit = parseInt(url.searchParams.get('limit') || '0', 10);
        const offset = parseInt(url.searchParams.get('offset') || '0', 10);

        // Build the Harness CCM API URL
        const apiUrl = new URL('https://app.harness.io/ccm/api/business-mapping');
        apiUrl.searchParams.set('accountIdentifier', accountId);
        if (searchKey) apiUrl.searchParams.set('searchKey', searchKey);
        apiUrl.searchParams.set('sortType', sortType);
        apiUrl.searchParams.set('sortOrder', sortOrder);
        apiUrl.searchParams.set('limit', limit.toString());
        apiUrl.searchParams.set('offset', offset.toString());

        // Make the API call
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'x-api-key': apiKey
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            return json({ error: errorData.message || 'Failed to fetch cost categories' }, { status: response.status });
        }

        const data = await response.json();
        console.log('Cost categories fetched:', JSON.stringify(data, null, 2)); // Debug log
        return json(data);
    } catch (error) {
        console.error('Error fetching cost categories:', error);
        return json({ error: 'Internal server error: ' + error.message }, { status: 500 });
    }
}

export async function POST({ request, locals }) {
    try {
        // Get credentials from session
        const { accountId, apiKey } = locals.session.credentials || {};
        if (!accountId || !apiKey) {
            return json({ error: 'Credentials not set. Please configure in Settings.' }, { status: 401 });
        }

        // Get the request body
        const body = await request.json();
        const { searchKey, sortType, sortOrder, limit, offset } = body;

        // Build the Harness CCM API URL
        const apiUrl = new URL('https://app.harness.io/ccm/api/business-mapping');
        apiUrl.searchParams.set('accountIdentifier', accountId);
        if (searchKey) apiUrl.searchParams.set('searchKey', searchKey);
        apiUrl.searchParams.set('sortType', sortType);
        apiUrl.searchParams.set('sortOrder', sortOrder);
        apiUrl.searchParams.set('limit', limit.toString());
        apiUrl.searchParams.set('offset', offset.toString());

        // Make the API call
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.json();
            return json({ error: errorData.message || 'Failed to fetch cost categories' }, { status: response.status });
        }

        const data = await response.json();
        console.log('Cost categories fetched:', JSON.stringify(data, null, 2)); // Debug log
        return json(data);
    } catch (error) {
        console.error('Error fetching cost categories:', error);
        return json({ error: 'Internal server error: ' + error.message }, { status: 500 });
    }
}

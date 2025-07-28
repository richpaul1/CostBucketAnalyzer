// src/routes/api/cost-categories/+server.js
import { json } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function GET({ url, locals }) {
    try {
        // Get credentials from session
        const { accountId, apiKey } = locals.session.credentials || {};
        if (!accountId || !apiKey) {
            return json({ error: 'Credentials not set. Please configure in Settings.' }, { status: 401 });
        }

        const dashboard = url.searchParams.get('id') ;
        
        if (!dashboard) {
            return json({ error: 'No dashboard id provided' }, { status: 400 });
        }
        const apiUrl = new URL("https://app.harness.io/dashboard/dashboards/"+dashboard+"/elements?accountId="+accountId);
        console.log('API URL:', apiUrl);  

        // Make the API call
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'x-api-key': apiKey
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            return json({ error: errorData.message || 'Failed to fetch dashboard filters' }, { status: response.status });
        }

        const data = await response.json();
        console.log('Dashboard Fetched:', JSON.stringify(data, null, 2)); // Debug log
        return json(data);
    } catch (error) {
        console.error('Error fetching dashboard filters:', error);
        return json({ error: 'Internal server error: ' + error.message }, { status: 500 });
    }
}
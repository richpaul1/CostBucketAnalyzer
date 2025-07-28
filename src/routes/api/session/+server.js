// src/routes/api/session/+server.js
import { json } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
    try {
        const { accountId, apiKey } = await request.json();
        if (!accountId || !apiKey) {
            return json({ error: 'Account ID and API Key are required' }, { status: 400 });
        }
        locals.session.credentials = { accountId, apiKey };
        console.log('Session updated in POST:', locals.session);
        return json({ success: true });
    } catch (error) {
        console.error('POST error:', error);
        return json({ error: 'Failed to save credentials' }, { status: 500 });
    }
}

/** @type {import('./$types').RequestHandler} */
export async function GET({ locals }) {
    try {
        const credentials = locals.session.credentials || { accountId: '', apiKey: '' };
        console.log('Session retrieved in GET:', locals.session);
        return json(credentials);
    } catch (error) {
        console.error('GET error:', error);
        return json({ error: 'Failed to retrieve credentials' }, { status: 500 });
    }
}
// src/hooks.server.js
import { v4 as uuidv4 } from 'uuid';

// In-memory store for sessions (replace with database/Redis in production)
const sessions = new Map();

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
    let sessionId = event.cookies.get('sessionId');
    if (!sessionId) {
        sessionId = uuidv4();
        event.cookies.set('sessionId', sessionId, {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7 // 1 week
        });
        console.log('hooks.server.js: New session created', sessionId);
    }

    // Load session from Map or initialize empty
    let session = sessions.get(sessionId) || {};
    event.locals.session = session;
    console.log('hooks.server.js: Session loaded for', sessionId, session);

    // Process the request
    const response = await resolve(event);

    // Save updated session back to Map
    sessions.set(sessionId, event.locals.session);
    console.log('hooks.server.js: Session saved for', sessionId, event.locals.session);

    return response;
}
// src/services/api.js

const CHAT_API_BASE = import.meta.env.VITE_API_BASE || 'https://travelapi-34zi.onrender.com';
const CHAT_ENDPOINT = `${CHAT_API_BASE.replace(/\/$/, '')}/travel`;

console.log('API Base:', CHAT_API_BASE); // Debugging API URL

/**
 * Filter out 'plan' role from the history structure so we don't send
 * large rich objects back to the AI.
 */
export const historyForServer = (localMsgs, extra) => {
    const base = localMsgs.filter((m) => m.role !== 'plan');
    return extra ? [...base, extra] : base;
};

/**
 * Main function to call the Node.js travel bot
 */
export async function callTravelBot(history) {
    console.log('--- callTravelBot Initiating ---');
    console.log('Sending to:', CHAT_ENDPOINT);
    console.log('Payload:', history);

    try {
        const res = await fetch(CHAT_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: history }),
        });

        console.log('Response Status:', res.status);
        console.log('Response Headers:', [...res.headers.entries()]);

        if (!res.ok) {
            console.error('Fetch not OK:', await res.text());
            throw new Error(`Network error: ${res.status}`);
        }

        const data = await res.json();
        console.log('Parsed JSON Success!', data);
        return data;
    } catch (err) {
        console.error('--- callTravelBot CRITICAL FAILURE ---', err);
        throw err;
    }
}

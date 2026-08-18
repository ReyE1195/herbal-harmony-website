// ============================================
//   Herbal Harmony with Holistic Healing
//   Netlify Function — get-reviews.js
// ============================================

const { connectLambda, getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'GET, OPTIONS' }, body: '' };
    }
    if (event.httpMethod !== 'GET') return { statusCode: 405, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Method not allowed' }) };

    try {
        connectLambda(event);
        const store = getStore('hh-reviews');

        const { blobs } = await store.list();

        const reviews = await Promise.all(
            blobs.map(async (b) => {
                try {
                    return await store.get(b.key, { type: 'json' });
                } catch (e) {
                    console.error('Skipping unreadable review:', b.key, e);
                    return null;
                }
            })
        );

        let cleaned = reviews
            .filter(Boolean)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // newest first

        // Optional: /.netlify/functions/get-reviews?product=Honeycomb%20with%20Bees%20Candle
        const productFilter = event.queryStringParameters && event.queryStringParameters.product;
        if (productFilter) {
            const normalized = productFilter.trim().toLowerCase();
            cleaned = cleaned.filter(r => (r.product || '').trim().toLowerCase() === normalized);
        }

        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
            body: JSON.stringify({ success: true, count: cleaned.length, reviews: cleaned })
        };

    } catch (err) {
        console.error('Get reviews error:', err);
        return { statusCode: 500, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Something went wrong retrieving reviews.' }) };
    }
};
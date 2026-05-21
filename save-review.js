// ============================================
//   Herbal Harmony with Holistic Healing
//   Netlify Function — save-review.js
// ============================================

const { connectLambda, getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }, body: '' };
    }
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };

    try {
        connectLambda(event);
        const { name, product, rating, body, createdAt } = JSON.parse(event.body);
        if (!rating) return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'A star rating is required.' }) };

        const review = { name: name || 'Anonymous', product: product || 'General', rating, body: body || '', createdAt: createdAt || new Date().toISOString(), id: 'review-' + Date.now() };
        const store = getStore('hh-reviews');
        await store.setJSON(review.id, review);

        return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ success: true, message: 'Review submitted! Thank you for your kind words. 🌿' }) };

    } catch (err) {
        console.error('Save review error:', err);
        return { statusCode: 500, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Something went wrong saving your review.' }) };
    }
};
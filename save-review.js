// ============================================
//   Herbal Harmony with Holistic Healing
//   Netlify Function — save-review.js
// ============================================

import { getStore } from '@netlify/blobs';

export default async (req, context) => {
    if (req.method === 'OPTIONS') {
        return new Response('', { status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' } });
    }
    if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });

    try {
        const { name, product, rating, body, createdAt } = await req.json();
        if (!rating) return new Response(JSON.stringify({ error: 'A star rating is required.' }), { status: 400, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } });

        const review = { name: name || 'Anonymous', product: product || 'General', rating, body: body || '', createdAt: createdAt || new Date().toISOString(), id: 'review-' + Date.now() };
        const store = getStore('hh-reviews');
        await store.setJSON(review.id, review);

        return new Response(JSON.stringify({ success: true, message: 'Review submitted! Thank you for your kind words. 🌿' }), { status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } });
    } catch (err) {
        console.error('Save review error:', err);
        return new Response(JSON.stringify({ error: 'Something went wrong saving your review.' }), { status: 500, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } });
    }
};

export const config = { path: '/netlify/functions/save-review' };
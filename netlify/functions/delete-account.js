// ============================================
//   Herbal Harmony with Holistic Healing
//   Netlify Function — delete-account.js
//   Permanently removes the logged-in user's record
// ============================================

const jwt = require('jsonwebtoken');
const { connectLambda, getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }, body: '' };
    }
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };

    try {
        connectLambda(event);

        // ── Verify the login token (same pattern as update-profile.js) ──
        // This is what guarantees a customer can ONLY delete their own account:
        // the email being deleted comes from inside their signed token, never
        // from the request body — so it can't be tampered with.
        const authHeader = event.headers.authorization || '';
        const token = authHeader.replace('Bearer ', '');
        if (!token) return { statusCode: 401, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Not authenticated.' }) };

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const store = getStore('hh-users');

        // Confirm the account actually exists before we try to remove it.
        const user = await store.get(decoded.email, { type: 'json' });
        if (!user) return { statusCode: 404, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'User not found.' }) };

        // ── Permanently delete the record from Netlify Blobs ──
        // This is irreversible: email, password hash, address, orders, wishlist,
        // avatar — the whole record is gone for good.
        await store.delete(decoded.email);

        return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ success: true, message: 'Your account has been permanently deleted. 🌿' }) };

    } catch (err) {
        console.error('Delete account error:', err);
        return { statusCode: 500, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Something went wrong. Please try again.' }) };
    }
};
// ============================================
//   Herbal Harmony with Holistic Healing
//   Netlify Function — get-profile.js
//   Returns the logged-in user's current account
//   data (name, email, phone, address, wishlist,
//   avatar) so the account page can load fresh
//   from the server on any device — not just from
//   this browser's localStorage.
// ============================================

const jwt = require('jsonwebtoken');
const { connectLambda, getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS' }, body: '' };
    }

    try {
        connectLambda(event);
        const authHeader = event.headers.authorization || '';
        const token = authHeader.replace('Bearer ', '');
        if (!token) return { statusCode: 401, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Not authenticated.' }) };

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const store = getStore('hh-users');
        const user = await store.get(decoded.email, { type: 'json' });
        if (!user) return { statusCode: 404, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'User not found.' }) };

        // Return only safe, display-relevant fields — never the password hash.
        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                success: true,
                user: {
                    firstName: user.firstName,
                    lastName: user.lastName || '',
                    email: user.email,
                    phone: user.phone || '',
                    emailVerified: user.emailVerified || false,
                    address: user.address || {},
                    wishlist: user.wishlist || [],
                    avatar: user.avatar || ''
                }
            })
        };

    } catch (err) {
        console.error('Get profile error:', err);
        return { statusCode: 500, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Something went wrong. Please try again.' }) };
    }
};
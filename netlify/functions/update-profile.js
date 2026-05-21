// ============================================
//   Herbal Harmony with Holistic Healing
//   Netlify Function — update-profile.js
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
        const authHeader = event.headers.authorization || '';
        const token = authHeader.replace('Bearer ', '');
        if (!token) return { statusCode: 401, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Not authenticated.' }) };

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const store = getStore('hh-users');
        const user = await store.get(decoded.email, { type: 'json' });
        if (!user) return { statusCode: 404, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'User not found.' }) };

        const updates = JSON.parse(event.body);
        if (updates.firstName) user.firstName = updates.firstName;
        if (updates.lastName !== undefined) user.lastName = updates.lastName;
        if (updates.phone !== undefined) user.phone = updates.phone;
        if (updates.address) user.address = updates.address;
        if (updates.wishlist) user.wishlist = updates.wishlist;

        await store.setJSON(decoded.email, user);
        return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ success: true, message: 'Profile updated! 🌿', user: { firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone, emailVerified: user.emailVerified, address: user.address || {}, wishlist: user.wishlist || [] } }) };

    } catch (err) {
        console.error('Update profile error:', err);
        return { statusCode: 500, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Something went wrong. Please try again.' }) };
    }
};

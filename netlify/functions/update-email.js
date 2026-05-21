// ============================================
//   Herbal Harmony with Holistic Healing
//   Netlify Function — update-email.js
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
        const { newEmail } = JSON.parse(event.body);
        if (!newEmail || !newEmail.includes('@')) return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'A valid email address is required.' }) };

        const store = getStore('hh-users');
        const existing = await store.get(newEmail.toLowerCase());
        if (existing) return { statusCode: 409, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'That email address is already in use.' }) };

        const user = await store.get(decoded.email, { type: 'json' });
        if (!user) return { statusCode: 404, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'User not found.' }) };

        user.email = newEmail.toLowerCase();
        user.emailVerified = false;
        await store.setJSON(newEmail.toLowerCase(), user);
        await store.delete(decoded.email);

        const newToken = jwt.sign({ email: user.email, firstName: user.firstName }, process.env.JWT_SECRET, { expiresIn: '7d' });
        return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ success: true, message: 'Email updated successfully! 🌿', token: newToken }) };

    } catch (err) {
        console.error('Update email error:', err);
        return { statusCode: 500, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Something went wrong. Please try again.' }) };
    }
};

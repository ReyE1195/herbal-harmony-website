// ============================================
//   Herbal Harmony with Holistic Healing
//   Netlify Function — update-password.js
// ============================================

const bcrypt = require('bcryptjs');
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
        const { currentPassword, newPassword } = JSON.parse(event.body);
        if (!currentPassword || !newPassword || newPassword.length < 8) return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Valid current and new password (8+ chars) required.' }) };

        const store = getStore('hh-users');
        const user = await store.get(decoded.email, { type: 'json' });
        if (!user) return { statusCode: 404, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'User not found.' }) };

        const match = await bcrypt.compare(currentPassword, user.password);
        if (!match) return { statusCode: 401, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Current password is incorrect.' }) };

        user.password = await bcrypt.hash(newPassword, 12);
        await store.setJSON(decoded.email, user);
        return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ success: true, message: 'Password updated successfully! 🌿' }) };

    } catch (err) {
        console.error('Update password error:', err);
        return { statusCode: 500, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Something went wrong. Please try again.' }) };
    }
};
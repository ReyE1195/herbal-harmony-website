// ============================================
//   Herbal Harmony with Holistic Healing
//   Netlify Function — login.js
// ============================================

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { connectLambda, getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }, body: '' };
    }
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };

    try {
        connectLambda(event);
        const { email, password } = JSON.parse(event.body);
        if (!email || !password) return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Email and password are required.' }) };

        const store = getStore('hh-users');
        const user = await store.get(email.toLowerCase(), { type: 'json' });
        if (!user) return { statusCode: 401, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'No account found with that email address.' }) };

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) return { statusCode: 401, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Incorrect password. Please try again.' }) };

        const token = jwt.sign({ email: user.email, firstName: user.firstName }, process.env.JWT_SECRET, { expiresIn: '7d' });
        return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ success: true, message: 'Welcome back! 🌿', token, user: { firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone, emailVerified: user.emailVerified, address: user.address || {}, orders: user.orders || [], wishlist: user.wishlist || [] } }) };

    } catch (err) {
        console.error('Login error:', err);
        return { statusCode: 500, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Something went wrong. Please try again.' }) };
    }
};

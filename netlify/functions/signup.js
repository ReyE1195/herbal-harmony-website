// ============================================
//   Herbal Harmony with Holistic Healing
//   Netlify Function — signup.js
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
        const { firstName, lastName, email, phone, password } = JSON.parse(event.body);
        if (!firstName || !email || !password) return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'First name, email and password are required.' }) };
        if (password.length < 8) return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Password must be at least 8 characters.' }) };

        const store = getStore('hh-users');
        const existing = await store.get(email.toLowerCase());
        if (existing) return { statusCode: 409, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'An account with this email already exists.' }) };

        const hashedPassword = await bcrypt.hash(password, 12);
        const user = { firstName, lastName: lastName || '', email: email.toLowerCase(), phone: phone || '', password: hashedPassword, emailVerified: false, createdAt: new Date().toISOString(), orders: [], wishlist: [], address: {} };
        await store.setJSON(email.toLowerCase(), user);

        const token = jwt.sign({ email: user.email, firstName: user.firstName }, process.env.JWT_SECRET, { expiresIn: '7d' });
        return { statusCode: 201, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ success: true, message: 'Account created successfully! 🌿', token, user: { firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone, emailVerified: user.emailVerified } }) };

    } catch (err) {
        console.error('Signup error:', err);
        return { statusCode: 500, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Something went wrong. Please try again.' }) };
    }
};

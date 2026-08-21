// ============================================
//   Herbal Harmony with Holistic Healing
//   Netlify Function — reset-password.js
//   Step 2 of the password-reset flow.
//
//   Verifies the one-time token, then saves the new
//   (bcrypt-hashed) password and CLEARS the token so the
//   same link can never be used twice.
// ============================================

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { connectLambda, getStore } = require('@netlify/blobs');

const sha256 = (val) => crypto.createHash('sha256').update(val).digest('hex');

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }, body: '' };
    }
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };

    // One vague message for every "bad token" case, so we never reveal which
    // emails exist or exactly why a token failed.
    const invalid = { statusCode: 400, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'This reset link is invalid or has expired. Please request a new one.' }) };

    try {
        connectLambda(event);
        const { email, token, password } = JSON.parse(event.body);
        if (!email || !token || !password) return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Missing required fields.' }) };
        if (password.length < 8) return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Password must be at least 8 characters.' }) };

        const store = getStore('hh-users');
        const key = email.toLowerCase().trim();
        const user = await store.get(key, { type: 'json' });

        // No user, or no pending reset on this account → invalid.
        if (!user || !user.resetTokenHash || !user.resetTokenExpiry) return invalid;

        // Expired?
        if (Date.now() > user.resetTokenExpiry) return invalid;

        // Timing-safe compare of the supplied token's hash against the stored
        // hash (both are 64-char hex strings, so equal length).
        const a = Buffer.from(sha256(token));
        const b = Buffer.from(user.resetTokenHash);
        if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return invalid;

        // All good — set the new password and REMOVE the token fields so the
        // link becomes one-time-use.
        user.password = await bcrypt.hash(password, 12);
        delete user.resetTokenHash;
        delete user.resetTokenExpiry;
        await store.setJSON(key, user);

        return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ success: true, message: 'Your password has been reset. You can now log in. 🌿' }) };

    } catch (err) {
        console.error('reset-password error:', err);
        return { statusCode: 500, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Something went wrong. Please try again.' }) };
    }
};
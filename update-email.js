// ============================================
//   Herbal Harmony with Holistic Healing
//   Netlify Function — update-email.js
// ============================================

import jwt from 'jsonwebtoken';
import { getStore } from '@netlify/blobs';

export default async (req, context) => {
    if (req.method === 'OPTIONS') {
        return new Response('', { status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS' } });
    }
    if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });

    try {
        const authHeader = req.headers.get('authorization') || '';
        const token = authHeader.replace('Bearer ', '');
        if (!token) return new Response(JSON.stringify({ error: 'Not authenticated.' }), { status: 401, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { newEmail } = await req.json();

        if (!newEmail || !newEmail.includes('@')) {
            return new Response(JSON.stringify({ error: 'A valid email address is required.' }), { status: 400, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } });
        }

        const store = getStore('hh-users');
        const existing = await store.get(newEmail.toLowerCase());
        if (existing) return new Response(JSON.stringify({ error: 'That email address is already in use.' }), { status: 409, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } });

        const user = await store.get(decoded.email, { type: 'json' });
        if (!user) return new Response(JSON.stringify({ error: 'User not found.' }), { status: 404, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } });

        user.email = newEmail.toLowerCase();
        user.emailVerified = false;
        await store.setJSON(newEmail.toLowerCase(), user);
        await store.delete(decoded.email);

        const newToken = jwt.sign({ email: user.email, firstName: user.firstName }, process.env.JWT_SECRET, { expiresIn: '7d' });

        return new Response(JSON.stringify({ success: true, message: 'Email updated successfully! 🌿', token: newToken }), { status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } });
    } catch (err) {
        console.error('Update email error:', err);
        return new Response(JSON.stringify({ error: 'Something went wrong. Please try again.' }), { status: 500, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } });
    }
};

export const config = { path: '/netlify/functions/update-email' };
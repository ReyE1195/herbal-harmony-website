// ============================================
//   Herbal Harmony with Holistic Healing
//   Netlify Function — update-password.js
// ============================================

import bcrypt from 'bcryptjs';
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
        const { currentPassword, newPassword } = await req.json();

        if (!currentPassword || !newPassword || newPassword.length < 8) {
            return new Response(JSON.stringify({ error: 'Valid current and new password (8+ chars) required.' }), { status: 400, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } });
        }

        const store = getStore('hh-users');
        const user = await store.get(decoded.email, { type: 'json' });
        if (!user) return new Response(JSON.stringify({ error: 'User not found.' }), { status: 404, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } });

        const match = await bcrypt.compare(currentPassword, user.password);
        if (!match) return new Response(JSON.stringify({ error: 'Current password is incorrect.' }), { status: 401, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } });

        user.password = await bcrypt.hash(newPassword, 12);
        await store.setJSON(decoded.email, user);

        return new Response(JSON.stringify({ success: true, message: 'Password updated successfully! 🌿' }), { status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } });
    } catch (err) {
        console.error('Update password error:', err);
        return new Response(JSON.stringify({ error: 'Something went wrong. Please try again.' }), { status: 500, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } });
    }
};

export const config = { path: '/netlify/functions/update-password' };
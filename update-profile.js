// ============================================
//   Herbal Harmony with Holistic Healing
//   Netlify Function — update-profile.mjs
//   Updates customer profile, address, wishlist
// ============================================

import jwt from 'jsonwebtoken';
import { getStore } from '@netlify/blobs';

export default async (req, context) => {
    if (req.method === 'OPTIONS') {
        return new Response('', {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            }
        });
    }

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    try {
        const authHeader = req.headers.get('authorization') || '';
        const token = authHeader.replace('Bearer ', '');
        if (!token) {
            return new Response(JSON.stringify({ error: 'Not authenticated.' }), {
                status: 401, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const store = getStore('hh-users');
        const user = await store.get(decoded.email, { type: 'json' });

        if (!user) {
            return new Response(JSON.stringify({ error: 'User not found.' }), {
                status: 404, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
            });
        }

        const updates = await req.json();
        if (updates.firstName) user.firstName = updates.firstName;
        if (updates.lastName !== undefined) user.lastName = updates.lastName;
        if (updates.phone !== undefined) user.phone = updates.phone;
        if (updates.address) user.address = updates.address;
        if (updates.wishlist) user.wishlist = updates.wishlist;

        await store.setJSON(decoded.email, user);

        return new Response(JSON.stringify({
            success: true,
            message: 'Profile updated! 🌿',
            user: {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                emailVerified: user.emailVerified,
                address: user.address || {},
                wishlist: user.wishlist || []
            }
        }), { status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } });

    } catch (err) {
        console.error('Update profile error:', err);
        return new Response(JSON.stringify({ error: 'Something went wrong. Please try again.' }), {
            status: 500, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
        });
    }
};

export const config = { path: '/netlify/functions/update-profile' };
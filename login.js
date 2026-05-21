// ============================================
//   Herbal Harmony with Holistic Healing
//   Netlify Function — login.js
//   Authenticates a customer and returns a JWT
// ============================================

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getStore } from '@netlify/blobs';

export default async (req, context) => {
    if (req.method === 'OPTIONS') {
        return new Response('', {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            }
        });
    }

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return new Response(JSON.stringify({ error: 'Email and password are required.' }), {
                status: 400, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
            });
        }

        const store = getStore('hh-users');
        const user = await store.get(email.toLowerCase(), { type: 'json' });

        if (!user) {
            return new Response(JSON.stringify({ error: 'No account found with that email address.' }), {
                status: 401, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
            });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return new Response(JSON.stringify({ error: 'Incorrect password. Please try again.' }), {
                status: 401, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
            });
        }

        const token = jwt.sign(
            { email: user.email, firstName: user.firstName },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        return new Response(JSON.stringify({
            success: true,
            message: 'Welcome back! 🌿',
            token,
            user: {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                emailVerified: user.emailVerified,
                address: user.address || {},
                orders: user.orders || [],
                wishlist: user.wishlist || []
            }
        }), { status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } });

    } catch (err) {
        console.error('Login error:', err);
        return new Response(JSON.stringify({ error: 'Something went wrong. Please try again.' }), {
            status: 500, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
        });
    }
};

export const config = { path: '/netlify/functions/login' };
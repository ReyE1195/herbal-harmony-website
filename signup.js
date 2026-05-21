// ============================================
//   Herbal Harmony with Holistic Healing
//   Netlify Function — signup.js
//   Creates a new customer account
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
        const { firstName, lastName, email, phone, password } = await req.json();

        if (!firstName || !email || !password) {
            return new Response(JSON.stringify({ error: 'First name, email and password are required.' }), {
                status: 400, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
            });
        }

        if (password.length < 8) {
            return new Response(JSON.stringify({ error: 'Password must be at least 8 characters.' }), {
                status: 400, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
            });
        }

        const store = getStore('hh-users');

        const existing = await store.get(email.toLowerCase());
        if (existing) {
            return new Response(JSON.stringify({ error: 'An account with this email already exists.' }), {
                status: 409, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = {
            firstName,
            lastName: lastName || '',
            email: email.toLowerCase(),
            phone: phone || '',
            password: hashedPassword,
            emailVerified: false,
            createdAt: new Date().toISOString(),
            orders: [],
            wishlist: [],
            address: {}
        };

        await store.setJSON(email.toLowerCase(), user);

        const token = jwt.sign(
            { email: user.email, firstName: user.firstName },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        return new Response(JSON.stringify({
            success: true,
            message: 'Account created successfully! 🌿',
            token,
            user: {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                emailVerified: user.emailVerified
            }
        }), { status: 201, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } });

    } catch (err) {
        console.error('Signup error:', err);
        return new Response(JSON.stringify({ error: 'Something went wrong. Please try again.' }), {
            status: 500, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
        });
    }
};

export const config = { path: '/netlify/functions/signup' };
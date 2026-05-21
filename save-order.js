// ============================================
//   Herbal Harmony with Holistic Healing
//   Netlify Function — save-order.js
// ============================================

import jwt from 'jsonwebtoken';
import { getStore } from '@netlify/blobs';

export default async (req, context) => {
    if (req.method === 'OPTIONS') {
        return new Response('', { status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS' } });
    }
    if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });

    try {
        const { cart, email, total, paymentIntentId, address } = await req.json();
        const orderNumber = 'HH' + Date.now().toString().slice(-6);
        const order = { orderNumber, items: cart, total, email, address, paymentIntentId, status: 'Processing', createdAt: new Date().toISOString() };

        const authHeader = req.headers.get('authorization') || '';
        const token = authHeader.replace('Bearer ', '');

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const store = getStore('hh-users');
                const user = await store.get(decoded.email, { type: 'json' });
                if (user) {
                    user.orders = user.orders || [];
                    user.orders.unshift(order);
                    await store.setJSON(decoded.email, user);
                }
            } catch(e) {}
        }

        const ordersStore = getStore('hh-orders');
        await ordersStore.setJSON(orderNumber, order);

        return new Response(JSON.stringify({ success: true, orderNumber, message: `Thank you for your order! Your order #${orderNumber} is confirmed. 🌿` }), { status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } });
    } catch (err) {
        console.error('Save order error:', err);
        return new Response(JSON.stringify({ error: 'Something went wrong saving your order.' }), { status: 500, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } });
    }
};

export const config = { path: '/netlify/functions/save-order' };
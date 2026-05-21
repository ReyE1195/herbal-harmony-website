// ============================================
//   Herbal Harmony with Holistic Healing
//   Netlify Function — save-order.js
// ============================================

const jwt = require('jsonwebtoken');
const { connectLambda, getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }, body: '' };
    }
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };

    try {
        connectLambda(event);
        const { cart, email, total, paymentIntentId, address } = JSON.parse(event.body);
        const orderNumber = 'HH' + Date.now().toString().slice(-6);
        const order = { orderNumber, items: cart, total, email, address, paymentIntentId, status: 'Processing', createdAt: new Date().toISOString() };

        const authHeader = event.headers.authorization || '';
        const token = authHeader.replace('Bearer ', '');
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const store = getStore('hh-users');
                const user = await store.get(decoded.email, { type: 'json' });
                if (user) { user.orders = user.orders || []; user.orders.unshift(order); await store.setJSON(decoded.email, user); }
            } catch(e) {}
        }

        const ordersStore = getStore('hh-orders');
        await ordersStore.setJSON(orderNumber, order);
        return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ success: true, orderNumber, message: `Thank you for your order! Your order #${orderNumber} is confirmed. 🌿` }) };

    } catch (err) {
        console.error('Save order error:', err);
        return { statusCode: 500, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Something went wrong saving your order.' }) };
    }
};
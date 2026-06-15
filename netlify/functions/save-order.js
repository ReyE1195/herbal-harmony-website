// ============================================
//   Herbal Harmony with Holistic Healing
//   Netlify Function — save-order.js
// ============================================

const jwt = require('jsonwebtoken');
const { connectLambda, getStore } = require('@netlify/blobs');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const FREE_GIFT_LIMIT = 2;        // only the first 2 paid orders get the free gift
const GIFT_COUNT_KEY  = 'freeGiftClaimed';

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }, body: '' };
    }
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };

    try {
        connectLambda(event);
        const { cart, email, total, paymentIntentId, address, freeGift } = JSON.parse(event.body);
        const orderNumber = 'HH' + Date.now().toString().slice(-6);

        // ── Free gift cap ────────────────────────────────────────────
        // This is the authoritative gate. Even though checkout hides the
        // gift once it's gone, we re-check the shared count here so two
        // people can't both grab the "last" one between page-load and pay.
        let giftAwarded = false;
        if (freeGift === true) {
            try {
                const meta = getStore('hh-meta');
                const claimed = parseInt(await meta.get(GIFT_COUNT_KEY) || '0', 10) || 0;
                if (claimed < FREE_GIFT_LIMIT) {
                    await meta.set(GIFT_COUNT_KEY, String(claimed + 1));
                    giftAwarded = true;
                }
            } catch (e) {
                console.error('Gift counter error:', e);
            }
        }

        // ── Record the sales tax for filing (Stripe Tax) ─────────────
        // The PaymentIntent carries the tax Calculation id in its metadata.
        // Turning that calculation into a Transaction is what makes the tax
        // appear in your Stripe Tax reports at filing time. If anything here
        //  fails, we log it but still save the order — the customer was charged
        // correctly either way.
        let taxTransactionId = null;
        if (paymentIntentId) {
            try {
                const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
                const calcId = pi.metadata && pi.metadata.taxCalculationId;
                if (calcId) {
                    const taxTxn = await stripe.tax.transactions.createFromCalculation({
                        calculation: calcId,
                        reference: orderNumber
                    });
                    taxTransactionId = taxTxn.id;
                }
            } catch (e) {
                console.error('Tax transaction error:', e);
            }
        }

        const order = {
            orderNumber,
            items: cart,
            total,
            email,
            address,
            paymentIntentId,
            taxTransactionId,
            freeGift: giftAwarded ? 'Honey Lip Balm (free gift)' : null,
            status: 'Processing',
            createdAt: new Date().toISOString()
        };

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
        return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ success: true, orderNumber, giftAwarded, message: `Thank you for your order! Your order #${orderNumber} is confirmed. 🌿` }) };

    } catch (err) {
        console.error('Save order error:', err);
        return { statusCode: 500, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Something went wrong saving your order.' }) };
    }
};
// ============================================
//   Herbal Harmony with Holistic Healing
//   Netlify Function — create-payment-intent.js
//   Creates a Stripe PaymentIntent to charge card
// ============================================

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: ''
        };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const { cart, email, firstName, lastName, address, promoCode } = JSON.parse(event.body);

        // Valid promo codes and their discounts
        const VALID_CODES = { 'WELCOME10': 0.10 };

        if (!cart || !cart.length) {
            return {
                statusCode: 400,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Cart is empty.' })
            };
        }

        // Calculate total in cents
        let subtotal = cart.reduce((sum, item) => {
            const price = parseFloat(item.price.replace('$', ''));
            return sum + (price * item.qty);
        }, 0);

        // Apply lip balm bundle discount
        const lipBalms = cart.filter(item => item.name.toLowerCase().includes('lip balm'));
        const totalLipBalms = lipBalms.reduce((sum, item) => sum + item.qty, 0);
        if (totalLipBalms >= 2) {
            const pairs = Math.floor(totalLipBalms / 2);
            subtotal -= pairs;
        }

        // Apply promo code discount
        if (promoCode && VALID_CODES[promoCode.toUpperCase()]) {
            const discount = VALID_CODES[promoCode.toUpperCase()];
            subtotal = subtotal * (1 - discount);
        }

        const amountInCents = Math.round(subtotal * 100);

        // Build order description
        const orderDesc = cart.map(item => `${item.name} x${item.qty}`).join(', ');

        // Create PaymentIntent with Stripe + automatic tax
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: 'usd',
            description: `Herbal Harmony Order: ${orderDesc}`,
            receipt_email: email,
            automatic_tax: { enabled: true },
            shipping: address ? {
                name: `${firstName} ${lastName}`,
                address: {
                    line1: address.street,
                    city: address.city,
                    state: address.state,
                    postal_code: address.zip,
                    country: 'US'
                }
            } : undefined,
            metadata: {
                customerName: `${firstName} ${lastName}`,
                customerEmail: email,
                orderItems: orderDesc,
                shippingAddress: address ? `${address.street}, ${address.city}, ${address.state} ${address.zip}` : '',
                promoCode: promoCode || 'none'
            }
        });

        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                success: true,
                clientSecret: paymentIntent.client_secret,
                amount: amountInCents,
                taxAmount: paymentIntent.automatic_tax ? (paymentIntent.amount - amountInCents) : 0
            })
        };

    } catch (err) {
        console.error('Payment intent error:', err);
        return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: err.message || 'Payment processing failed.' })
        };
    }
};
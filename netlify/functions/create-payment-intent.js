// ============================================
//   Herbal Harmony with Holistic Healing
//   Netlify Function — create-payment-intent.js
//   Creates a Stripe PaymentIntent to charge a card.
//
//   SECURITY: every price is looked up HERE, on the server,
//   from the catalog below. The price the browser sends is
//   ignored entirely — so no one can edit the request and pay
//   less than the real total.
// ============================================

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// --- Trusted price list, in DOLLARS --------------------------------
// Edit prices HERE (and in index.js) whenever they change. Names are
// matched loosely (see normalizeName), so bullets (•), inch-marks ("),
// spacing, and encoding quirks won't break the lookup.
const PRICE_CATALOG_RAW = {
    'Pillar Candles': 10.00,
    'Pillar Candles 2': 10.00,
    'Pillar Candles 4': 18.00,
    'Pillar Candles 6': 28.00,
    'Skep Candles': 6.00,
    'Skep Candles Single': 6.00,
    'Skep Candles Bundle': 5.00,
    'Cold/Flu Foot Soak': 15.00,
    'De-Stress Foot Soak': 15.00,
    'Breathe Better Balm': 10.00,
    'Breathe Better Balm 2oz': 10.00,
    'Breathe Better Balm 1oz': 6.00,
    'Little Lungs Balm': 6.00,
    'Little Lungs Balm 0.5oz': 6.00,
    'Little Lungs Balm 1oz': 10.00,
    'Boo Boo Balm': 6.00,
    'Starter Wrap Set': 20.00,
    'XL Beeswax Wrap': 20.00,
    'Lip Balm Vanilla': 3.00,
    'Lip Balm Eucalyptus & Mint': 3.00,
    'Lip Balm Unscented': 3.00,
    'DIY Candle Kit': 15.00
};

// Normalize a name for matching: lowercase, keep only letters and digits.
// Makes the lookup immune to bullets, inch-marks, stray spaces, and any
// character-encoding differences between files.
function normalizeName(raw) {
    return String(raw || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Build the normalized lookup once at startup.
const PRICE_CATALOG = {};
for (const [name, price] of Object.entries(PRICE_CATALOG_RAW)) {
    PRICE_CATALOG[normalizeName(name)] = price;
}

// Valid promo codes and their discounts
const VALID_CODES = { 'WELCOME10': 0.10 };

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

        if (!cart || !cart.length) {
            return {
                statusCode: 400,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Cart is empty.' })
            };
        }

        // --- Price the cart from the SERVER's catalog, never the browser ---
        let subtotal = 0;
        let lipBalmQty = 0;

        for (const item of cart) {
            const name = (item && item.name ? String(item.name) : '').trim();
            const unitPrice = PRICE_CATALOG[normalizeName(name)];

            // Unknown name = tampered request or a stale cart. Refuse rather
            // than guess at a price.
            if (unitPrice === undefined) {
                return {
                    statusCode: 400,
                    headers: { 'Access-Control-Allow-Origin': '*' },
                    body: JSON.stringify({ error: `Sorry, "${name || 'an item'}" isn't available right now. Please refresh your cart and try again.` })
                };
            }

            // Sanitize quantity: a whole number, at least 1. Blocks negative-qty
            // tricks that could drive the total down.
            let qty = Math.floor(Number(item.qty));
            if (!Number.isFinite(qty) || qty < 1) qty = 1;

            subtotal += unitPrice * qty;
            if (name.toLowerCase().includes('lip balm')) lipBalmQty += qty;
        }

        // --- Lip balm bundle: any 2 lip balms → $1 off per pair ($5 a pair) ---
        if (lipBalmQty >= 2) {
            const pairs = Math.floor(lipBalmQty / 2);
            subtotal -= pairs; // $1 per pair
        }

        // --- Promo code ---
        let appliedPromo = 'none';
        if (promoCode && VALID_CODES[promoCode.toUpperCase()]) {
            subtotal = subtotal * (1 - VALID_CODES[promoCode.toUpperCase()]);
            appliedPromo = promoCode.toUpperCase();
        }

        const amountInCents = Math.round(subtotal * 100);

        // Stripe's minimum charge is $0.50.
        if (amountInCents < 50) {
            return {
                statusCode: 400,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Order total is below the $0.50 minimum.' })
            };
        }

        // Build a readable order description from sanitized quantities
        const orderDesc = cart.map(item => {
            let q = Math.floor(Number(item.qty));
            if (!Number.isFinite(q) || q < 1) q = 1;
            return `${item.name} x${q}`;
        }).join(', ');

        // Create the PaymentIntent.
        //
        // NOTE: automatic sales tax is intentionally OFF for now. Turning it on
        // requires Stripe Tax to be configured in the dashboard (registered
        // states + origin address) — that's its own step. Leaving it off keeps
        // order totals correct and lets a real order go through.
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: 'usd',
            // Let Stripe offer every method enabled in the Dashboard (cards + wallets
            // today; redirect methods later). This replaces the old card-only default.
            automatic_payment_methods: { enabled: true },
            description: `Herbal Harmony Order: ${orderDesc}`,
            receipt_email: email,
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
                promoCode: appliedPromo
            }
        });

        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                success: true,
                clientSecret: paymentIntent.client_secret,
                amount: amountInCents,
                taxAmount: 0
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
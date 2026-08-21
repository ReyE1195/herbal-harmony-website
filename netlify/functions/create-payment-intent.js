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
    // ── Candles ─────────────────────────────────────────────
    'Large Round Pillar': 40.00,
    'Square Collection (Set)': 30.00,
    'Pillar Candle': 20.00,
    'Honeycomb with Bees Candle': 15.00,
    'Round Pillar Candle': 15.00,
    'Element Stone Pillar Candle': 12.00,
    'Bubble Hexagon Pillar Candle': 12.00,
    'Cylinder Pillar Candle': 8.00,
    'Hexagon Pillar Candle': 8.00,
    'Bubble Pillar Candle': 12.00,
    'Bee w/Flowers Candle': 20.00,
    'Molded Queen Bee Candle': 15.00,
    'Molded Multi Bees Candle': 15.00,
    'Votive Candles': 10.00,               // sold as a 4-pack only
    'Skep w/Bees Beehive Candles': 6.00,
    'Tea Light - Square': 1.50,
    'Tea Light - Circle': 1.50,
    'Tea Light Mix & Match Bundle': 7.00,  // 3 Square + 3 Circle, sold as one item
    'Tea Light - Square 6-Pack Bundle': 7.00,  // 6 Square, sold as one item
    'Tea Light - Circle 6-Pack Bundle': 7.00,  // 6 Circle, sold as one item
    'Travel Candle Jar': 20.00,
    'DIY Candle Kit': 15.00,
    // ── Soaks ───────────────────────────────────────────────
    'Cold/Flu Foot or Bath Soak': 12.00,
    'De-Stress Foot or Bath Soak': 12.00,
    // ── Balms ───────────────────────────────────────────────
    'Breathe Better Balm': 15.00,
    'Little Lungs Balm': 10.00,
    'Booboo Balm': 8.00,
    // ── Lip Balms ───────────────────────────────────────────
    'Lip Balm Vanilla': 3.00,
    'Lip Balm Eucalyptus & Mint': 3.00,
    'Lip Balm Unscented': 3.00,
    'Lip Balm Honey': 3.00,
    // ── Lotion Bars ─────────────────────────────────────────
    'Unscented Moisturizing Lotion Bar - Rectangle': 5.00,
    'Unscented Moisturizing Lotion Bar - Oval': 5.00,
    // ── Wellness ────────────────────────────────────────────
    'Restless Leg Relief Oil': 20.00,
    'Headache Stick': 8.00,
    'Face Mask': 5.00,
    'Filtered Beeswax Pellets': 25.00,
    // ── Wraps ───────────────────────────────────────────────
    'XL Beeswax Wrap': 25.00,
    'Beeswax Starter Wrap Set (S, M, L)': 20.00,
    'Lunch Box Beeswax Wrap Set (2 Med & 1 Sm)': 20.00,
    'Large Beeswax Wrap': 12.00,
    'Medium Beeswax Wrap': 8.00,
    'Small Beeswax Wrap': 6.00
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

// --- Flat-rate shipping, in CENTS -----------------------------------
// Interim flat $5.00 fee until live USPS rates (EasyPost) are wired in.
// When that lands, replace this one constant with the per-order rate
// lookup — the rest of this function reads from it and needs no change.
const SHIPPING_FLAT_RATE = 500;

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
        const { cart, email, firstName, lastName, address, promoCode, calculateOnly } = JSON.parse(event.body);

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
        let teaLightQty = 0;
        let diyKitQty = 0;
        let headacheStickQty = 0;

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
            const lower = name.toLowerCase();
            if (lower.includes('lip balm')) lipBalmQty += qty;
            // Loose tea lights count toward the 6-for-$7 group deal. The
            // Mix & Match Bundle is EXCLUDED — it's already a flat $7.00,
            // so letting it count too would double-discount.
            if (lower.includes('tea light') && !lower.includes('bundle')) teaLightQty += qty;
            if (normalizeName(name) === normalizeName('DIY Candle Kit')) diyKitQty += qty;
            if (normalizeName(name) === normalizeName('Headache Stick')) headacheStickQty += qty;
        }

        // --- Bundle deals (must mirror what the product cards advertise) ---

        // Lip balms: any 2 for $5.00 → $1 off per pair (2 x $3 = $6 → $5)
        if (lipBalmQty >= 2) {
            const pairs = Math.floor(lipBalmQty / 2);
            subtotal -= pairs; // $1 per pair
        }

        // Tea lights: any 6 for $7.00 — mix & match, squares and circles
        // combine toward the deal. (6 x $1.50 = $9.00 → $7.00, $2 off per
        // group of 6.) Singles are always available at $1.50 each.
        if (teaLightQty >= 6) {
            const groups = Math.floor(teaLightQty / 6);
            subtotal -= groups * 2;
        }

        // DIY Candle Kit: 2 for $25.00 (2 x $15 = $30 → $25, $5 off per pair)
        if (diyKitQty >= 2) {
            const pairs = Math.floor(diyKitQty / 2);
            subtotal -= pairs * 5;
        }

        // Headache Stick: 2 for $15.00 (2 x $8 = $16 → $15, $1 off per pair)
        if (headacheStickQty >= 2) {
            const pairs = Math.floor(headacheStickQty / 2);
            subtotal -= pairs;
        }

        // --- Promo code ---
        let appliedPromo = 'none';
        if (promoCode && VALID_CODES[promoCode.toUpperCase()]) {
            subtotal = subtotal * (1 - VALID_CODES[promoCode.toUpperCase()]);
            appliedPromo = promoCode.toUpperCase();
        }

        const amountInCents = Math.round(subtotal * 100);

        // --- Sales tax (Stripe Tax) -------------------------------------
        // WA sales tax is destination-based, so it depends on the shipping
        // address. We tax the discounted subtotal (the real sale price).
        // Everything in the catalog is a physical good -> General-Tangible
        // Goods (txcd_99999999). The calculation id is linked to the
        // PaymentIntent below so save-order can record it for filing.
        let taxAmount = 0;
        let taxCalculationId = null;
        const zip5 = String(address && address.zip ? address.zip : '').replace(/\D/g, '').slice(0, 5);
        if (address && address.state && zip5.length === 5) {
            const calculation = await stripe.tax.calculations.create({
                currency: 'usd',
                line_items: [{
                    amount: amountInCents,            // discounted, taxable subtotal
                    reference: 'order-subtotal',
                    tax_code: 'txcd_99999999'         // General - Tangible Goods
                }],
                // Let Stripe tax shipping correctly by jurisdiction (shipping is
                // taxable in some states, not others). The shipping amount is added
                // on top (exclusive); its tax is folded into tax_amount_exclusive.
                shipping_cost: { amount: SHIPPING_FLAT_RATE },
                customer_details: {
                    address: {
                        line1: address.street || '',
                        city: address.city || '',
                        state: address.state,
                        postal_code: zip5,
                        country: 'US'
                    },
                    address_source: 'shipping'
                }
            });
            taxAmount = calculation.tax_amount_exclusive;
            taxCalculationId = calculation.id;
        }

        const totalInCents = amountInCents + SHIPPING_FLAT_RATE + taxAmount;

        // "Calculate-only" mode: the checkout page calls this as the customer
        // fills in their address to show live tax and keep the Payment Element's
        // amount in sync. No charge is created in this mode.
        if (calculateOnly) {
            return {
                statusCode: 200,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({
                    success: true,
                    subtotal: amountInCents,
                    shipping: SHIPPING_FLAT_RATE,
                    taxAmount: taxAmount,
                    total: totalInCents
                })
            };
        }

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

        // Create the PaymentIntent. We charge subtotal + tax and link the tax
        // calculation (via metadata) so save-order can record the tax transaction.
        const paymentIntent = await stripe.paymentIntents.create({
            amount: totalInCents,
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
                shippingFee: (SHIPPING_FLAT_RATE / 100).toFixed(2),
                promoCode: appliedPromo,
                taxCalculationId: taxCalculationId || ''
            }
        });

        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                success: true,
                clientSecret: paymentIntent.client_secret,
                amount: totalInCents,
                subtotal: amountInCents,
                shipping: SHIPPING_FLAT_RATE,
                taxAmount: taxAmount
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
// ============================================
//   Herbal Harmony with Holistic Healing
//   Netlify Function — get-stripe-key.js
//   Safely returns the Stripe publishable key
// ============================================

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET, OPTIONS'
            },
            body: ''
        };
    }

    return {
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
        })
    };
};

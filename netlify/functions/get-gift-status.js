// ============================================
//   Herbal Harmony with Holistic Healing
//   Netlify Function — get-gift-status.js
//   Reports how many free Honey Lip Balms have
//   been claimed (shared across ALL customers),
//   so checkout knows whether to still offer it.
// ============================================

const { connectLambda, getStore } = require('@netlify/blobs');

const FREE_GIFT_LIMIT = 2;        // only the first 2 paid orders get the gift
const GIFT_COUNT_KEY  = 'freeGiftClaimed';

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

    try {
        connectLambda(event);
        const meta = getStore('hh-meta');
        const claimed = parseInt(await meta.get(GIFT_COUNT_KEY) || '0', 10) || 0;

        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
            body: JSON.stringify({
                claimed,
                limit: FREE_GIFT_LIMIT,
                available: claimed < FREE_GIFT_LIMIT
            })
        };

    } catch (err) {
        console.error('Gift status error:', err);
        // If we can't read the count, play it safe and say the gift is unavailable,
        // so we never promise a gift we might not be able to fulfill.
        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
            body: JSON.stringify({ claimed: FREE_GIFT_LIMIT, limit: FREE_GIFT_LIMIT, available: false, error: true })
        };
    }
};
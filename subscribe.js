// ============================================
//   Herbal Harmony with Holistic Healing
//   Netlify Function — subscribe.js
//   Adds a subscriber to MailerLite group
// ============================================

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: ''
        };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const { email } = JSON.parse(event.body);

        if (!email || !email.includes('@')) {
            return {
                statusCode: 400,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'A valid email address is required.' })
            };
        }

        const GROUP_ID = '187480144327214983';

        // Add subscriber to MailerLite group
        const response = await fetch(`https://connect.mailerlite.com/api/subscribers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${process.env.MAILERLITE_API_KEY}`
            },
            body: JSON.stringify({
                email: email.toLowerCase(),
                groups: [GROUP_ID]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('MailerLite error:', data);
            return {
                statusCode: 400,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: data.message || 'Failed to subscribe. Please try again.' })
            };
        }

        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                success: true,
                message: "You're in! Welcome to our herbal community. 🌿"
            })
        };

    } catch (err) {
        console.error('Subscribe error:', err);
        return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Something went wrong. Please try again.' })
        };
    }
};
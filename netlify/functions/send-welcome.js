// ============================================
//   Herbal Harmony with Holistic Healing
//   Netlify Function — send-welcome.js
//   Sends a short welcome email via MailerSend
//   when a new customer creates an account.
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
        const { email, firstName } = JSON.parse(event.body);

        if (!email || !email.includes('@')) {
            return {
                statusCode: 400,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'A valid email address is required.' })
            };
        }

        // Use the first name if we have one; otherwise a warm, generic greeting.
        const name = (firstName || '').trim();
        const greeting = name ? `Hi ${name},` : 'Hi there,';

        const subject = 'Welcome to Herbal Harmony 🌿';

        const text =
            `${greeting}\n\n` +
            `Welcome to Herbal Harmony with Holistic Healing! Your account is all set up.\n\n` +
            `We're so glad to have you in our community. You can now save your favorites, ` +
            `check out faster, and keep track of your orders.\n\n` +
            `With warmth,\n` +
            `The Herbal Harmony Team`;

        const html =
            `<div style="font-family: Georgia, 'Times New Roman', serif; color: #3B575A; max-width: 480px; margin: 0 auto; line-height: 1.6;">` +
            `<p>${greeting}</p>` +
            `<p>Welcome to <strong>Herbal Harmony with Holistic Healing</strong>! Your account is all set up.</p>` +
            `<p>We're so glad to have you in our community. You can now save your favorites, check out faster, and keep track of your orders.</p>` +
            `<p style="margin-top: 24px;">With warmth,<br><em>The Herbal Harmony Team</em> 🌿</p>` +
            `</div>`;

        // Send through MailerSend's email API.
        // The 'from' address is your verified domain address, so replies land
        // in your inbox via the Squarespace forwarding you already have set up.
        const response = await fetch('https://api.mailersend.com/v1/email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${process.env.MAILERSEND_API_KEY}`
            },
            body: JSON.stringify({
                from: {
                    email: 'connect@herbalharmonywithholistichealing.com',
                    name: 'Herbal Harmony with Holistic Healing'
                },
                to: [
                    { email: email.toLowerCase(), name: name || undefined }
                ],
                subject: subject,
                text: text,
                html: html
            })
        });

        // MailerSend returns 202 Accepted on a successful queue.
        if (!response.ok) {
            // Log it for debugging, but DO NOT fail the caller — a welcome email
            // hiccup must never block or undo a successful account creation.
            let detail = '';
            try { detail = await response.text(); } catch (e) {}
            console.error('MailerSend welcome email error:', response.status, detail);
            return {
                statusCode: 200,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ success: false, message: 'Account created; welcome email could not be sent.' })
            };
        }

        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ success: true, message: 'Welcome email sent. 🌿' })
        };

    } catch (err) {
        // Same principle: never let an email error bubble up as a hard failure.
        console.error('send-welcome error:', err);
        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ success: false, message: 'Account created; welcome email could not be sent.' })
        };
    }
};
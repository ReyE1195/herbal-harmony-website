// ============================================
//   Herbal Harmony with Holistic Healing
//   Netlify Function — request-reset.js
//   Step 1 of the password-reset flow.
//
//   Generates a secure, one-time, expiring reset token,
//   stores only its HASH on the user record, and emails
//   the reset link via MailerSend.
//
//   SECURITY: this always returns the SAME friendly reply
//   whether or not the email is registered — so the form
//   can't be used to discover which emails have accounts.
// ============================================

const crypto = require('crypto');
const { connectLambda, getStore } = require('@netlify/blobs');

// Verified MailerSend sender — same address your welcome email uses.
const FROM_EMAIL = 'connect@herbalharmonywithholistichealing.com';
const FROM_NAME  = 'Herbal Harmony with Holistic Healing';

// Reset links are valid for one hour.
const TOKEN_TTL_MS = 60 * 60 * 1000;

const sha256 = (val) => crypto.createHash('sha256').update(val).digest('hex');

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }, body: '' };
    }
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };

    // The single reply we send no matter what happens — never reveals whether
    // the email exists.
    const genericOk = {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: true, message: "If an account exists for that email, we've sent a reset link. Please check your inbox (and your spam folder)." })
    };

    try {
        connectLambda(event);
        const { email } = JSON.parse(event.body);
        if (!email) return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Email is required.' }) };

        const store = getStore('hh-users');
        const key = email.toLowerCase().trim();
        const user = await store.get(key, { type: 'json' });

        // No account? Return the generic OK and do nothing (no enumeration).
        if (!user) {
            console.log('Reset requested for an email with no account — no action taken.');
            return genericOk;
        }

        // Genuinely random token. The RAW token goes in the email link; only
        // its HASH is saved, so the stored record alone can't reset a password.
        const rawToken = crypto.randomBytes(32).toString('hex');
        user.resetTokenHash = sha256(rawToken);
        user.resetTokenExpiry = Date.now() + TOKEN_TTL_MS;
        await store.setJSON(key, user);

        // Build the link. SITE_URL is your production domain; if it isn't set, we
        // fall back to the request host (same pattern as signup.js).
        // NOTE: this MUST match the actual filename of your reset page.
        const base = process.env.SITE_URL || `https://${event.headers.host || ''}`;
        const link = `${base}/reset-account-password.html?token=${rawToken}&email=${encodeURIComponent(key)}`;

        const subject = 'Reset your Herbal Harmony password 🌿';
        const text = `Hi ${user.firstName || 'there'},\n\nWe received a request to reset your password. Open the link below to choose a new one. This link expires in one hour and can only be used once.\n\n${link}\n\nIf you didn't request this, you can safely ignore this email — your password won't change.\n\n— Herbal Harmony with Holistic Healing`;
        const html = `
            <div style="font-family: Arial, Helvetica, sans-serif; color:#3B575A; max-width:520px; margin:0 auto;">
                <h2 style="color:#3d5a3d;">Reset your password</h2>
                <p>Hi ${user.firstName || 'there'},</p>
                <p>We received a request to reset your password. Tap the button below to choose a new one. This link <strong>expires in one hour</strong> and can only be used once.</p>
                <p style="text-align:center; margin:28px 0;">
                    <a href="${link}" style="background:#528552; color:#ffffff; text-decoration:none; padding:12px 28px; border-radius:999px; font-weight:bold; display:inline-block;">Choose a new password</a>
                </p>
                <p style="font-size:13px; color:#9F9989;">If the button doesn't work, copy and paste this link into your browser:<br><span style="word-break:break-all;">${link}</span></p>
                <p style="font-size:13px; color:#9F9989;">If you didn't request this, you can safely ignore this email — your password won't change.</p>
                <p style="color:#3d5a3d;">— Herbal Harmony with Holistic Healing 🌿</p>
            </div>`;

        // Send via MailerSend — same API and token your send-welcome.js uses.
        try {
            const resp = await fetch('https://api.mailersend.com/v1/email', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.MAILERSEND_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: { email: FROM_EMAIL, name: FROM_NAME },
                    to: [{ email: user.email, name: user.firstName || '' }],
                    subject,
                    text,
                    html
                })
            });
            if (!resp.ok) {
                const detail = await resp.text();
                console.error('MailerSend reset email failed:', resp.status, detail);
            }
        } catch (mailErr) {
            // Log only — we still return the generic OK, so the form behaves
            // identically whether or not the email actually went out.
            console.error('Reset email send error:', mailErr);
        }

        return genericOk;

    } catch (err) {
        console.error('request-reset error:', err);
        // Even on an unexpected error, stay generic so nothing leaks.
        return genericOk;
    }
};
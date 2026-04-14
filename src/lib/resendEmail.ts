import { env } from '../config/env.js';

export type SendEmailInput = {
    to: string;
    subject: string;
    text: string;
    html?: string;
};

export async function sendEmail(input: SendEmailInput) {
    if (typeof fetch !== 'function') {
        return { ok: false as const, error: 'Email service is not available (global fetch is missing in this Node runtime)' };
    }

    if (!env.resend.apiKey) {
        return { ok: false as const, error: 'Email service is not configured (missing RESEND_API_KEY)' };
    }

    if (!env.resend.from) {
        return { ok: false as const, error: 'Email service is not configured (missing RESEND_FROM)' };
    }

    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${env.resend.apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: env.resend.from,
            to: [input.to],
            subject: input.subject,
            text: input.text,
            html: input.html,
        }),
    });

    if (!res.ok) {
        const body = await res.text().catch(() => '');
        return { ok: false as const, error: `Resend API error (${res.status}): ${body || res.statusText}` };
    }

    return { ok: true as const };
}

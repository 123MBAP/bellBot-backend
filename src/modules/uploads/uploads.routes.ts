import { Router } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { requireAdmin } from '../../middleware/auth.js';
import { env } from '../../config/env.js';

export const uploadsRouter = Router();

const signatureRequestSchema = z.object({
    folder: z.string().min(1).optional(),
});

function signCloudinary(paramsToSign: Record<string, string | number>, apiSecret: string) {
    const entries = Object.entries(paramsToSign)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .sort(([a], [b]) => a.localeCompare(b));

    const toSign = entries.map(([k, v]) => `${k}=${v}`).join('&');
    return crypto.createHash('sha1').update(`${toSign}${apiSecret}`).digest('hex');
}

uploadsRouter.post('/cloudinary-signature', requireAdmin, (req, res) => {
    const parsed = signatureRequestSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ ok: false, error: 'Invalid request body' });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = parsed.data.folder ?? env.cloudinary.folder;

    const signature = signCloudinary({ folder, timestamp }, env.cloudinary.apiSecret);

    return res.json({
        ok: true,
        cloudName: env.cloudinary.cloudName,
        apiKey: env.cloudinary.apiKey,
        timestamp,
        folder,
        signature,
    });
});

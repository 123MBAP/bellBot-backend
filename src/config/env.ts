import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env');

dotenv.config({ path: envPath });

function requireEnv(name: string): string {
    const value = process.env[name];
    const trimmed = value?.trim();
    if (!trimmed) throw new Error(`Missing required env var: ${name}`);
    return trimmed;
}

function parseCorsOrigins(raw: string | undefined): string[] {
    if (!raw) return [];
    return raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
}

export const env = {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: Number(process.env.PORT ?? 4000),
    databaseUrl: requireEnv('DATABASE_URL'),
    jwtSecret: requireEnv('JWT_SECRET'),
    corsOrigins: parseCorsOrigins(process.env.CORS_ORIGIN),
    googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
    resend: {
        apiKey: (process.env.RESEND_API_KEY ?? '').trim(),
        from: (process.env.RESEND_FROM ?? '').trim(),
    },
    cloudinary: {
        apiKey: requireEnv('CLOUDINARY_KEY'),
        apiSecret: requireEnv('CLOUDINARY_SECRET'),
        cloudName: requireEnv('CLOUDINARY_NAME'),
        folder: process.env.CLOUDINARY_FOLDER ?? 'mbi-products',
    },
};

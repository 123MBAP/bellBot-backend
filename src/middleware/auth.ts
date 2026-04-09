import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

export type AuthPayload = {
    sub: string;
    email: string;
    role: 'ADMIN' | 'CUSTOMER' | string;
    iat?: number;
    exp?: number;
};

function getBearerToken(req: Request): string | null {
    const header = req.headers.authorization;
    if (!header) return null;
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) return null;
    return token;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
    const token = getBearerToken(req);
    if (!token) return res.status(401).json({ ok: false, error: 'Missing Authorization header' });

    try {
        const decoded = jwt.verify(token, env.jwtSecret) as AuthPayload;
        (req as any).auth = decoded;
        return next();
    } catch {
        return res.status(401).json({ ok: false, error: 'Invalid or expired token' });
    }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
    requireAuth(req, res, () => {
        const payload = (req as any).auth as AuthPayload | undefined;
        if (!payload || payload.role !== 'ADMIN') {
            return res.status(403).json({ ok: false, error: 'Admin access required' });
        }
        return next();
    });
}

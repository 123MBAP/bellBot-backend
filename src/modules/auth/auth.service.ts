import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { UsersRepository } from '../users/users.repository.js';
import { OAuth2Client } from 'google-auth-library';

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().trim().min(1),
    phone: z.string().trim().min(1),
});

export const googleAuthSchema = z.object({
    idToken: z.string().min(1),
    phone: z.string().trim().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;

export class AuthService {
    constructor(private readonly usersRepo: UsersRepository) { }

    private getGoogleClient() {
        // Instantiate lazily so missing GOOGLE_CLIENT_ID doesn't break server startup.
        return new OAuth2Client(env.googleClientId || undefined);
    }

    async login(input: LoginInput) {
        const parsed = loginSchema.parse(input);

        const user = await this.usersRepo.findByEmail(parsed.email.toLowerCase());
        if (!user) {
            return { ok: false as const, error: 'Invalid email or password' };
        }

        const valid = await bcrypt.compare(parsed.password, user.passwordHash);
        if (!valid) {
            return { ok: false as const, error: 'Invalid email or password' };
        }

        return this.generateAuthResponse(user);
    }

    async register(input: RegisterInput) {
        const parsed = registerSchema.parse(input);

        const existing = await this.usersRepo.findByEmail(parsed.email.toLowerCase());
        if (existing) {
            return { ok: false as const, error: 'Email already in use' };
        }

        const passwordHash = await bcrypt.hash(parsed.password, 10);
        const user = await this.usersRepo.create({
            email: parsed.email.toLowerCase(),
            passwordHash,
            name: parsed.name,
            phone: parsed.phone,
        });

        return this.generateAuthResponse(user);
    }

    async google(input: GoogleAuthInput) {
        const parsed = googleAuthSchema.parse(input);

        if (!env.googleClientId) {
            return { ok: false as const, error: 'Google auth is not configured on the server (missing GOOGLE_CLIENT_ID)' };
        }

        const client = this.getGoogleClient();
        const ticket = await client.verifyIdToken({
            idToken: parsed.idToken,
            audience: env.googleClientId,
        });

        const payload = ticket.getPayload();
        const email = payload?.email?.toLowerCase();
        if (!email) {
            return { ok: false as const, error: 'Google token did not include an email address' };
        }

        const existing = await this.usersRepo.findByEmail(email);
        if (existing) {
            return this.generateAuthResponse(existing);
        }

        // User does not exist — auto-register with CUSTOMER role.
        // Phone is not provided by Google, so we store empty string.
        const displayName = (payload?.name || payload?.given_name || email.split('@')[0] || 'Customer').trim();
        const passwordHash = await bcrypt.hash(crypto.randomUUID(), 10);

        const user = await this.usersRepo.create({
            email,
            passwordHash,
            name: displayName,
            phone: parsed.phone?.trim() || '',
        });

        return this.generateAuthResponse(user);
    }

    private generateAuthResponse(user: any) {
        const token = jwt.sign(
            { sub: user.id, role: user.role, email: user.email },
            env.jwtSecret,
            { expiresIn: '7d' }
        );

        return {
            ok: true as const,
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                name: user.name,
                phone: user.phone
            },
        };
    }
}

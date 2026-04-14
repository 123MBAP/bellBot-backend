import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { UsersRepository } from '../users/users.repository.js';
import { OAuth2Client } from 'google-auth-library';
import { sendEmail } from '../../lib/resendEmail.js';
import { passwordResetCodeEmail } from '../../lib/emailTemplates.js';

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

export const forgotPasswordSchema = z.object({
    email: z.string().email(),
});

export const resetPasswordSchema = z.object({
    email: z.string().email(),
    code: z.string().trim().min(4),
    newPassword: z.string().min(8),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export class AuthService {
    constructor(private readonly usersRepo: UsersRepository) { }

    private hashResetCode(userId: string, code: string) {
        return crypto
            .createHmac('sha256', env.jwtSecret)
            .update(`${userId}:${code}`)
            .digest('hex');
    }

    private verifyResetCode(userId: string, code: string, expectedHash: string) {
        const actual = this.hashResetCode(userId, code);
        const a = Buffer.from(actual, 'hex');
        const b = Buffer.from(expectedHash, 'hex');
        if (a.length !== b.length) return false;
        return crypto.timingSafeEqual(a, b);
    }

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

    async forgotPassword(input: ForgotPasswordInput) {
        const parsed = forgotPasswordSchema.parse(input);
        const email = parsed.email.toLowerCase();

        const user = await this.usersRepo.findByEmail(email);

        // Do not reveal whether the user exists.
        if (!user) {
            return { ok: true as const };
        }

        const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
        const codeHash = this.hashResetCode(user.id, code);
        const sentAt = new Date();
        const expiresAt = new Date(sentAt.getTime() + 15 * 60 * 1000);

        // Store first; if sending fails, clear so the user isn't stuck.
        await this.usersRepo.setPasswordResetCode(user.id, { codeHash, expiresAt, sentAt });

        const message = passwordResetCodeEmail({ code, expiresMinutes: 15 });

        const emailResult = await sendEmail({
            to: user.email,
            subject: message.subject,
            text: message.text,
            html: message.html,
        });

        if (!emailResult.ok) {
            await this.usersRepo.clearPasswordResetCode(user.id);
            return { ok: false as const, error: emailResult.error };
        }

        return { ok: true as const };
    }

    async resetPassword(input: ResetPasswordInput) {
        const parsed = resetPasswordSchema.parse(input);
        const email = parsed.email.toLowerCase();

        const user = await this.usersRepo.findByEmail(email);
        if (!user) {
            return { ok: false as const, error: 'Invalid code or email' };
        }

        const codeHash = (user as any).passwordResetCodeHash as string | null | undefined;
        const expiresAt = (user as any).passwordResetCodeExpiresAt as Date | null | undefined;
        if (!codeHash || !expiresAt) {
            return { ok: false as const, error: 'Invalid code or email' };
        }

        if (expiresAt.getTime() < Date.now()) {
            await this.usersRepo.clearPasswordResetCode(user.id);
            return { ok: false as const, error: 'Code expired. Please request a new one.' };
        }

        const valid = this.verifyResetCode(user.id, parsed.code, codeHash);
        if (!valid) {
            return { ok: false as const, error: 'Invalid code or email' };
        }

        const passwordHash = await bcrypt.hash(parsed.newPassword, 10);
        await this.usersRepo.updatePasswordHash(user.id, passwordHash);
        await this.usersRepo.clearPasswordResetCode(user.id);

        return { ok: true as const };
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

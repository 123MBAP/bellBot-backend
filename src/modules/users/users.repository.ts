import { prisma } from '../../db/prisma.js';
import { UserRole } from '@prisma/client';

export type CreateUserInput = {
    email: string;
    passwordHash: string;
    name: string;
    phone: string;
    role?: UserRole;
};

export class UsersRepository {
    async findByEmail(email: string) {
        return prisma.user.findUnique({ where: { email } });
    }

    async setPasswordResetCode(userId: string, input: { codeHash: string; expiresAt: Date; sentAt: Date }) {
        return prisma.user.update({
            where: { id: userId },
            data: {
                passwordResetCodeHash: input.codeHash,
                passwordResetCodeExpiresAt: input.expiresAt,
                passwordResetCodeSentAt: input.sentAt,
            },
        });
    }

    async clearPasswordResetCode(userId: string) {
        return prisma.user.update({
            where: { id: userId },
            data: {
                passwordResetCodeHash: null,
                passwordResetCodeExpiresAt: null,
                passwordResetCodeSentAt: null,
            },
        });
    }

    async updatePasswordHash(userId: string, passwordHash: string) {
        return prisma.user.update({
            where: { id: userId },
            data: { passwordHash },
        });
    }

    async listCustomers() {
        return prisma.user.findMany({
            where: { role: UserRole.CUSTOMER },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                role: true,
                createdAt: true,
            },
        });
    }

    async create(input: CreateUserInput) {
        return prisma.user.create({
            data: {
                email: input.email,
                passwordHash: input.passwordHash,
                name: input.name,
                phone: input.phone,
                role: input.role ?? UserRole.CUSTOMER,
            },
        });
    }

    async upsertAdmin(email: string, passwordHash: string, profile?: { name?: string; phone?: string }) {
        return prisma.user.upsert({
            where: { email },
            update: {
                passwordHash,
                role: UserRole.ADMIN,
                name: profile?.name ?? 'Admin',
                phone: profile?.phone ?? '',
            },
            create: {
                email,
                passwordHash,
                role: UserRole.ADMIN,
                name: profile?.name ?? 'Admin',
                phone: profile?.phone ?? '',
            },
        });
    }
}

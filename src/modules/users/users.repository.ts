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

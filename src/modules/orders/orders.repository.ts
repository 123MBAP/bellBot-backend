import { prisma } from '../../db/prisma.js';

export type CreateOrderInput = {
    userId: string;
    items: any[];
    totalsByCurrency: Record<string, number>;
};

export class OrdersRepository {
    async getById(orderId: string) {
        return prisma.order.findUnique({
            where: { id: orderId },
        });
    }

    async getByIdForUser(orderId: string, userId: string) {
        return prisma.order.findFirst({
            where: { id: orderId, userId },
        });
    }

    async create(input: CreateOrderInput) {
        return prisma.order.create({
            data: {
                userId: input.userId,
                items: input.items,
                totalsByCurrency: input.totalsByCurrency,
            },
        });
    }

    async listByUserId(userId: string) {
        return prisma.order.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async listAllWithUser() {
        return prisma.order.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        phone: true,
                        role: true,
                    },
                },
            },
        });
    }

    async updateById(orderId: string, data: any) {
        return prisma.order.update({
            where: { id: orderId },
            data,
        });
    }

    async updateByIdForUser(orderId: string, userId: string, data: any) {
        const result = await prisma.order.updateMany({
            where: { id: orderId, userId },
            data,
        });
        if (result.count === 0) {
            return null;
        }
        return prisma.order.findFirst({
            where: { id: orderId, userId },
        });
    }
}

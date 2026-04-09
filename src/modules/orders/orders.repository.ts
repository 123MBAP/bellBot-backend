import { prisma } from '../../db/prisma.js';

export type CreateOrderInput = {
    userId: string;
    items: any[];
    totalsByCurrency: Record<string, number>;
};

export class OrdersRepository {
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
}

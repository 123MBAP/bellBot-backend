import { z } from 'zod';
import { OrdersRepository } from './orders.repository.js';

const orderItemSchema = z.object({
    productId: z.string().min(1),
    name: z.string().min(1),
    size: z.string().min(1),
    quantity: z.number().int().min(1),
    price: z.number().int().min(0),
    currency: z.string().min(1),
});

const createOrderSchema = z.object({
    items: z.array(orderItemSchema).min(1),
    totalsByCurrency: z.record(z.number().int().min(0)),
});

export class OrdersService {
    constructor(private readonly repo: OrdersRepository) { }

    async createForUser(userId: string, input: unknown) {
        const parsed = createOrderSchema.parse(input);
        return this.repo.create({
            userId,
            items: parsed.items,
            totalsByCurrency: parsed.totalsByCurrency,
        });
    }

    async listForUser(userId: string) {
        return this.repo.listByUserId(userId);
    }
}

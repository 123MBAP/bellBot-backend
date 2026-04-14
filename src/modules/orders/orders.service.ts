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

const orderStatusSchema = z.enum([
    'ORDERED',
    'RECEIVED',
    'UNDER_REVIEW',
    'PACKAGING',
    'PROCESSING',
    'SHIPPED',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
]);

const adminUpdateOrderSchema = z.object({
    status: orderStatusSchema.optional(),
    packagingEtaMinutes: z.number().int().min(0).max(60 * 24 * 30).optional(),
    deliveryEtaMinutes: z.number().int().min(0).max(60 * 24 * 30).optional(),
    transportMethod: z.string().trim().min(1).max(64).optional(),
    transportPlateNumber: z.string().trim().min(1).max(64).optional(),
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

    async listAll() {
        return this.repo.listAllWithUser();
    }

    async adminUpdate(orderId: string, input: unknown) {
        const parsed = adminUpdateOrderSchema.parse(input);
        const existing = await this.repo.getById(orderId);
        if (!existing) {
            throw new Error('Order not found');
        }

        const existingAny = existing as any;

        const now = new Date();
        const nextData: any = {};

        if (typeof parsed.packagingEtaMinutes === 'number') {
            nextData.packagingEtaMinutes = parsed.packagingEtaMinutes;
        }
        if (typeof parsed.deliveryEtaMinutes === 'number') {
            nextData.deliveryEtaMinutes = parsed.deliveryEtaMinutes;
        }
        if (typeof parsed.transportMethod === 'string') {
            nextData.transportMethod = parsed.transportMethod;
        }
        if (typeof parsed.transportPlateNumber === 'string') {
            nextData.transportPlateNumber = parsed.transportPlateNumber;
        }

        if (parsed.status) {
            const s = parsed.status;
            nextData.status = s;

            if (s === 'RECEIVED' && !existingAny.receivedAt) nextData.receivedAt = now;
            if (s === 'UNDER_REVIEW' && !existingAny.underReviewAt) nextData.underReviewAt = now;
            if ((s === 'PACKAGING' || s === 'PROCESSING') && !existingAny.packagingAt) nextData.packagingAt = now;
            if ((s === 'OUT_FOR_DELIVERY' || s === 'SHIPPED') && !existingAny.outForDeliveryAt) nextData.outForDeliveryAt = now;
            if (s === 'DELIVERED' && !existingAny.deliveredAt) nextData.deliveredAt = now;

            if (s === 'OUT_FOR_DELIVERY') {
                const method = (parsed.transportMethod ?? existingAny.transportMethod ?? '').trim();
                const plate = (parsed.transportPlateNumber ?? existingAny.transportPlateNumber ?? '').trim();
                if (!method) throw new Error('transportMethod is required when setting OUT_FOR_DELIVERY');
                if (!plate) throw new Error('transportPlateNumber is required when setting OUT_FOR_DELIVERY');
                nextData.transportMethod = method;
                nextData.transportPlateNumber = plate;
            }
        }

        return this.repo.updateById(orderId, nextData);
    }

    async markDelivered(userId: string, orderId: string) {
        const existing = await this.repo.getByIdForUser(orderId, userId);
        if (!existing) {
            throw new Error('Order not found');
        }

        const current = String((existing as any).status || '').toUpperCase();
        if (current === 'DELIVERED') return existing;

        if (current !== 'OUT_FOR_DELIVERY' && current !== 'SHIPPED') {
            throw new Error('Order is not out for delivery yet');
        }

        const updated = await this.repo.updateByIdForUser(orderId, userId, {
            status: 'DELIVERED',
            deliveredAt: (existing as any).deliveredAt ?? new Date(),
        });

        if (!updated) {
            throw new Error('Order not found');
        }
        return updated;
    }
}

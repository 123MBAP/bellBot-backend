import { Request, Response } from 'express';
import { OrdersService } from './orders.service.js';

export class OrdersController {
    constructor(private readonly service: OrdersService) { }

    createMyOrder = async (req: Request, res: Response) => {
        try {
            const auth = (req as any).auth as { sub?: string } | undefined;
            const userId = auth?.sub;
            if (!userId) {
                return res.status(401).json({ ok: false, error: 'Unauthorized' });
            }

            const order = await this.service.createForUser(userId, req.body);
            return res.status(201).json({ ok: true, order });
        } catch (err: any) {
            return res.status(400).json({ ok: false, error: err?.message || 'Failed to create order' });
        }
    };

    listMyOrders = async (req: Request, res: Response) => {
        try {
            const auth = (req as any).auth as { sub?: string } | undefined;
            const userId = auth?.sub;
            if (!userId) {
                return res.status(401).json({ ok: false, error: 'Unauthorized' });
            }

            const orders = await this.service.listForUser(userId);
            return res.json({ ok: true, orders });
        } catch (err: any) {
            return res.status(500).json({ ok: false, error: err?.message || 'Failed to load orders' });
        }
    };
}

import { Request, Response } from 'express';
import { UsersService } from './users.service.js';

export class UsersController {
    constructor(private readonly service: UsersService) { }

    listCustomers = async (_req: Request, res: Response) => {
        try {
            const customers = await this.service.listCustomers();
            return res.json({ ok: true, customers });
        } catch (err: any) {
            return res.status(500).json({ ok: false, error: err?.message || 'Failed to load customers' });
        }
    };
}

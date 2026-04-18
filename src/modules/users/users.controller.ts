import { Request, Response } from 'express';
import { UsersService } from './users.service.js';

export class UsersController {
    constructor(private readonly service: UsersService) { }

    getMe = async (req: Request, res: Response) => {
        try {
            const auth = (req as any).auth as { sub?: string } | undefined;
            const userId = auth?.sub;
            if (!userId) {
                return res.status(401).json({ ok: false, error: 'Unauthorized' });
            }

            const user = await this.service.getById(userId);
            if (!user) {
                return res.status(404).json({ ok: false, error: 'User not found' });
            }
            return res.json({ ok: true, user });
        } catch (err: any) {
            return res.status(500).json({ ok: false, error: err?.message || 'Failed to load profile' });
        }
    };

    updateMe = async (req: Request, res: Response) => {
        try {
            const auth = (req as any).auth as { sub?: string } | undefined;
            const userId = auth?.sub;
            if (!userId) {
                return res.status(401).json({ ok: false, error: 'Unauthorized' });
            }

            const user = await this.service.updateProfile(userId, req.body);
            return res.json({ ok: true, user });
        } catch (err: any) {
            return res.status(400).json({ ok: false, error: err?.message || 'Failed to update profile' });
        }
    };

    listCustomers = async (_req: Request, res: Response) => {
        try {
            const customers = await this.service.listCustomers();
            return res.json({ ok: true, customers });
        } catch (err: any) {
            return res.status(500).json({ ok: false, error: err?.message || 'Failed to load customers' });
        }
    };
}

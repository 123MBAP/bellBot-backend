import { Request, Response } from 'express';
import { CategoriesService } from './categories.service.js';

export class CategoriesController {
    constructor(private readonly service: CategoriesService) { }

    list = async (_req: Request, res: Response) => {
        try {
            const categories = await this.service.listAll();
            res.json({ ok: true, categories });
        } catch (err: any) {
            res.status(500).json({ ok: false, error: err?.message || 'Failed to load categories' });
        }
    };

    create = async (req: Request, res: Response) => {
        try {
            const category = await this.service.create(req.body);
            res.status(201).json({ ok: true, category });
        } catch (err: any) {
            res.status(400).json({ ok: false, error: err?.message || 'Failed to create category' });
        }
    };
}

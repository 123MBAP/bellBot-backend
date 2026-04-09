import { Request, Response } from 'express';
import { ProductsService } from './products.service.js';

export class ProductsController {
    constructor(private readonly service: ProductsService) { }

    list = async (_req: Request, res: Response) => {
        try {
            const products = await this.service.listAll();
            res.json({ ok: true, products });
        } catch (err: any) {
            res.status(500).json({ ok: false, error: err?.message || 'Failed to load products' });
        }
    };

    get = async (req: Request, res: Response) => {
        try {
            const product = await this.service.getById(req.params.id);
            if (!product) {
                return res.status(404).json({ ok: false, error: 'Product not found' });
            }
            return res.json({ ok: true, product });
        } catch (err: any) {
            return res.status(500).json({ ok: false, error: err?.message || 'Failed to load product' });
        }
    };

    create = async (req: Request, res: Response) => {
        try {
            const product = await this.service.create(req.body);
            res.status(201).json({ ok: true, product });
        } catch (err: any) {
            res.status(400).json({ ok: false, error: err?.message || 'Failed to create product' });
        }
    };

    update = async (req: Request, res: Response) => {
        try {
            const product = await this.service.update(req.params.id, req.body);
            res.json({ ok: true, product });
        } catch (err: any) {
            res.status(400).json({ ok: false, error: err?.message || 'Failed to update product' });
        }
    };

    delete = async (req: Request, res: Response) => {
        try {
            await this.service.delete(req.params.id);
            res.json({ ok: true });
        } catch (err: any) {
            res.status(400).json({ ok: false, error: err?.message || 'Failed to delete product' });
        }
    };
}

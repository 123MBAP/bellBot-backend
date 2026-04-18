import { Request, Response } from 'express';
import { ShowroomService } from './showroom.service.js';

export class ShowroomController {
    constructor(private readonly service: ShowroomService) { }

    listPublic = async (_req: Request, res: Response) => {
        try {
            const videos = await this.service.listPublic();
            res.json({ ok: true, videos });
        } catch (err: any) {
            res.status(500).json({ ok: false, error: err?.message || 'Failed to load showroom videos' });
        }
    };

    listAdmin = async (_req: Request, res: Response) => {
        try {
            const videos = await this.service.listAdmin();
            res.json({ ok: true, videos });
        } catch (err: any) {
            res.status(500).json({ ok: false, error: err?.message || 'Failed to load showroom videos' });
        }
    };

    create = async (req: Request, res: Response) => {
        try {
            const video = await this.service.create(req.body);
            res.status(201).json({ ok: true, video });
        } catch (err: any) {
            res.status(400).json({ ok: false, error: err?.message || 'Failed to create showroom video' });
        }
    };

    update = async (req: Request, res: Response) => {
        try {
            const video = await this.service.update(req.params.id, req.body);
            res.json({ ok: true, video });
        } catch (err: any) {
            res.status(400).json({ ok: false, error: err?.message || 'Failed to update showroom video' });
        }
    };

    delete = async (req: Request, res: Response) => {
        try {
            await this.service.delete(req.params.id);
            res.json({ ok: true });
        } catch (err: any) {
            res.status(400).json({ ok: false, error: err?.message || 'Failed to delete showroom video' });
        }
    };
}

import { Request, Response } from 'express';
import { UiConfigService } from './uiConfig.service.js';

export class UiConfigController {
    constructor(private readonly service: UiConfigService) { }

    getPublic = async (_req: Request, res: Response) => {
        try {
            const config = await this.service.getPublicConfig();
            return res.json({ ok: true, config });
        } catch (err: any) {
            const msg = err?.message || 'Failed to load UI config';
            return res.status(500).json({ ok: false, error: msg });
        }
    };

    update = async (req: Request, res: Response) => {
        try {
            const config = await this.service.updateConfig(req.body);
            return res.json({ ok: true, config });
        } catch (err: any) {
            const msg = err?.message || 'Failed to update UI config';
            return res.status(400).json({ ok: false, error: msg });
        }
    };
}

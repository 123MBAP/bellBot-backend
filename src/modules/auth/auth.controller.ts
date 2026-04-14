import { Request, Response } from 'express';
import { AuthService } from './auth.service.js';

export class AuthController {
    constructor(private readonly authService: AuthService) { }

    login = async (req: Request, res: Response) => {
        const result = await this.authService.login(req.body);
        if (!result.ok) {
            return res.status(401).json({ ok: false, error: result.error });
        }
        return res.json(result);
    };

    register = async (req: Request, res: Response) => {
        const result = await this.authService.register(req.body);
        if (!result.ok) {
            return res.status(400).json({ ok: false, error: result.error });
        }
        return res.status(201).json(result);
    };

    google = async (req: Request, res: Response) => {
        try {
            const result = await this.authService.google(req.body);
            if (!result.ok) {
                return res.status(400).json({ ok: false, error: result.error, code: (result as any).code });
            }
            return res.json(result);
        } catch (err: any) {
            return res.status(400).json({ ok: false, error: err?.message || 'Google auth failed' });
        }
    };

    forgotPassword = async (req: Request, res: Response) => {
        try {
            const result = await this.authService.forgotPassword(req.body);
            if (!result.ok) {
                return res.status(500).json({ ok: false, error: result.error });
            }
            return res.json({ ok: true });
        } catch (err: any) {
            return res.status(400).json({ ok: false, error: err?.message || 'Invalid request' });
        }
    };

    resetPassword = async (req: Request, res: Response) => {
        try {
            const result = await this.authService.resetPassword(req.body);
            if (!result.ok) {
                return res.status(400).json({ ok: false, error: result.error });
            }
            return res.json({ ok: true });
        } catch (err: any) {
            return res.status(400).json({ ok: false, error: err?.message || 'Invalid request' });
        }
    };
}

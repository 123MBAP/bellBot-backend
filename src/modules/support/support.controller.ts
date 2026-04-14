import { Request, Response } from 'express';
import { SupportService } from './support.service.js';

export class SupportController {
    constructor(private readonly service: SupportService) { }

    createMyMessage = async (req: Request, res: Response) => {
        try {
            const auth = (req as any).auth as { sub?: string } | undefined;
            const userId = auth?.sub;
            if (!userId) {
                return res.status(401).json({ ok: false, error: 'Unauthorized' });
            }

            const message = await this.service.createMessageForUser(userId, req.body);
            return res.status(201).json({ ok: true, message });
        } catch (err: any) {
            return res.status(400).json({ ok: false, error: err?.message || 'Failed to send message' });
        }
    };

    listMyMessages = async (req: Request, res: Response) => {
        try {
            const auth = (req as any).auth as { sub?: string } | undefined;
            const userId = auth?.sub;
            if (!userId) {
                return res.status(401).json({ ok: false, error: 'Unauthorized' });
            }

            const messages = await this.service.listMyMessages(userId);
            return res.json({ ok: true, messages });
        } catch (err: any) {
            return res.status(500).json({ ok: false, error: err?.message || 'Failed to load messages' });
        }
    };

    listAllMessages = async (_req: Request, res: Response) => {
        try {
            const messages = await this.service.listAllForAdmin();
            return res.json({ ok: true, messages });
        } catch (err: any) {
            return res.status(500).json({ ok: false, error: err?.message || 'Failed to load messages' });
        }
    };

    listConversations = async (_req: Request, res: Response) => {
        try {
            const conversations = await this.service.listConversationSummariesForAdmin();
            return res.json({ ok: true, conversations });
        } catch (err: any) {
            return res.status(500).json({ ok: false, error: err?.message || 'Failed to load conversations' });
        }
    };

    listConversationMessages = async (req: Request, res: Response) => {
        try {
            const userId = req.params.userId;
            const messages = await this.service.listMyMessages(userId);
            return res.json({ ok: true, messages });
        } catch (err: any) {
            return res.status(500).json({ ok: false, error: err?.message || 'Failed to load conversation messages' });
        }
    };

    createAdminMessage = async (req: Request, res: Response) => {
        try {
            const auth = (req as any).auth as { sub?: string } | undefined;
            const adminId = auth?.sub;
            if (!adminId) {
                return res.status(401).json({ ok: false, error: 'Unauthorized' });
            }

            const userId = req.params.userId;
            const message = await this.service.createMessageFromAdmin(adminId, userId, req.body);
            return res.status(201).json({ ok: true, message });
        } catch (err: any) {
            return res.status(400).json({ ok: false, error: err?.message || 'Failed to send message' });
        }
    };

    markConversationRead = async (req: Request, res: Response) => {
        try {
            const userId = req.params.userId;
            const result = await this.service.markConversationReadForAdmin(userId);
            return res.json({ ok: true, updated: result.count });
        } catch (err: any) {
            return res.status(400).json({ ok: false, error: err?.message || 'Failed to mark conversation read' });
        }
    };

    markRead = async (req: Request, res: Response) => {
        try {
            const messageId = req.params.id;
            const message = await this.service.markRead(messageId);
            return res.json({ ok: true, message });
        } catch (err: any) {
            return res.status(400).json({ ok: false, error: err?.message || 'Failed to mark as read' });
        }
    };
}

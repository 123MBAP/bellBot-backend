import { Router } from 'express';
import { requireAdmin, requireAuth } from '../../middleware/auth.js';
import { SupportRepository } from './support.repository.js';
import { SupportService } from './support.service.js';
import { SupportController } from './support.controller.js';

export const supportRouter = Router();

const repo = new SupportRepository();
const service = new SupportService(repo);
const controller = new SupportController(service);

// Customer endpoints
supportRouter.get('/messages/me', requireAuth, controller.listMyMessages);
supportRouter.post('/messages', requireAuth, controller.createMyMessage);

// Admin endpoints
supportRouter.get('/messages', requireAdmin, controller.listAllMessages);
supportRouter.patch('/messages/:id/read', requireAdmin, controller.markRead);

// Admin inbox endpoints (WhatsApp/Messenger-style)
supportRouter.get('/conversations', requireAdmin, controller.listConversations);
supportRouter.get('/conversations/:userId/messages', requireAdmin, controller.listConversationMessages);
supportRouter.post('/conversations/:userId/messages', requireAdmin, controller.createAdminMessage);
supportRouter.patch('/conversations/:userId/read', requireAdmin, controller.markConversationRead);

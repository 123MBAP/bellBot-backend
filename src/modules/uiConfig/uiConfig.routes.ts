import { Router } from 'express';
import { requireAdmin } from '../../middleware/auth.js';
import { UiConfigRepository } from './uiConfig.repository.js';
import { UiConfigService } from './uiConfig.service.js';
import { UiConfigController } from './uiConfig.controller.js';

export const uiConfigRouter = Router();

const repo = new UiConfigRepository();
const service = new UiConfigService(repo);
const controller = new UiConfigController(service);

uiConfigRouter.get('/', controller.getPublic);
uiConfigRouter.patch('/', requireAdmin, controller.update);

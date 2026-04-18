import { Router } from 'express';
import { requireAdmin } from '../../middleware/auth.js';
import { AdvertsRepository } from './adverts.repository.js';
import { AdvertsService } from './adverts.service.js';
import { AdvertsController } from './adverts.controller.js';

export const advertsRouter = Router();

const repo = new AdvertsRepository();
const service = new AdvertsService(repo);
const controller = new AdvertsController(service);

advertsRouter.get('/', controller.listPublic);
advertsRouter.get('/:id/media', controller.media);
advertsRouter.get('/admin', requireAdmin, controller.listAdmin);
advertsRouter.post('/', requireAdmin, controller.create);
advertsRouter.patch('/:id', requireAdmin, controller.update);
advertsRouter.delete('/:id', requireAdmin, controller.delete);

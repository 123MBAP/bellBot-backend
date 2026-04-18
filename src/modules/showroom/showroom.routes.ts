import { Router } from 'express';
import { requireAdmin } from '../../middleware/auth.js';
import { ShowroomRepository } from './showroom.repository.js';
import { ShowroomService } from './showroom.service.js';
import { ShowroomController } from './showroom.controller.js';

export const showroomRouter = Router();

const repo = new ShowroomRepository();
const service = new ShowroomService(repo);
const controller = new ShowroomController(service);

showroomRouter.get('/', controller.listPublic);
showroomRouter.get('/admin', requireAdmin, controller.listAdmin);
showroomRouter.post('/', requireAdmin, controller.create);
showroomRouter.patch('/:id', requireAdmin, controller.update);
showroomRouter.delete('/:id', requireAdmin, controller.delete);

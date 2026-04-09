import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { OrdersRepository } from './orders.repository.js';
import { OrdersService } from './orders.service.js';
import { OrdersController } from './orders.controller.js';

export const ordersRouter = Router();

const repo = new OrdersRepository();
const service = new OrdersService(repo);
const controller = new OrdersController(service);

ordersRouter.get('/my', requireAuth, controller.listMyOrders);
ordersRouter.post('/', requireAuth, controller.createMyOrder);

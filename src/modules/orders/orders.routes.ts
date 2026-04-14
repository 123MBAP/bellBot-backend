import { Router } from 'express';
import { requireAdmin, requireAuth } from '../../middleware/auth.js';
import { OrdersRepository } from './orders.repository.js';
import { OrdersService } from './orders.service.js';
import { OrdersController } from './orders.controller.js';

export const ordersRouter = Router();

const repo = new OrdersRepository();
const service = new OrdersService(repo);
const controller = new OrdersController(service);

ordersRouter.get('/my', requireAuth, controller.listMyOrders);
ordersRouter.post('/', requireAuth, controller.createMyOrder);

// Admin order management
ordersRouter.get('/', requireAdmin, controller.listAllOrders);
ordersRouter.patch('/:id/admin', requireAdmin, controller.adminUpdateOrder);

// Customer marking delivery completion
ordersRouter.patch('/:id/delivered', requireAuth, controller.markDelivered);

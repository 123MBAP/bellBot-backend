import { Router } from 'express';
import { requireAdmin, requireAuth } from '../../middleware/auth.js';
import { UsersRepository } from './users.repository.js';
import { UsersService } from './users.service.js';
import { UsersController } from './users.controller.js';

export const usersRouter = Router();

const repo = new UsersRepository();
const service = new UsersService(repo);
const controller = new UsersController(service);

// Profile
usersRouter.get('/me', requireAuth, controller.getMe);
usersRouter.patch('/me', requireAuth, controller.updateMe);

usersRouter.get('/customers', requireAdmin, controller.listCustomers);

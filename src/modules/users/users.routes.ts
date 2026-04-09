import { Router } from 'express';
import { requireAdmin } from '../../middleware/auth.js';
import { UsersRepository } from './users.repository.js';
import { UsersService } from './users.service.js';
import { UsersController } from './users.controller.js';

export const usersRouter = Router();

const repo = new UsersRepository();
const service = new UsersService(repo);
const controller = new UsersController(service);

usersRouter.get('/customers', requireAdmin, controller.listCustomers);

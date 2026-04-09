import { Router } from 'express';
import { requireAdmin } from '../../middleware/auth.js';
import { ProductsRepository } from './products.repository.js';
import { ProductsService } from './products.service.js';
import { ProductsController } from './products.controller.js';

export const productsRouter = Router();

const repo = new ProductsRepository();
const service = new ProductsService(repo);
const controller = new ProductsController(service);

productsRouter.get('/', controller.list);
productsRouter.get('/:id', controller.get);
productsRouter.post('/', requireAdmin, controller.create);
productsRouter.patch('/:id', requireAdmin, controller.update);
productsRouter.delete('/:id', requireAdmin, controller.delete);

import { Router } from 'express';
import { requireAdmin } from '../../middleware/auth.js';
import { CategoriesRepository } from './categories.repository.js';
import { CategoriesService } from './categories.service.js';
import { CategoriesController } from './categories.controller.js';

export const categoriesRouter = Router();

const repo = new CategoriesRepository();
const service = new CategoriesService(repo);
const controller = new CategoriesController(service);

categoriesRouter.get('/', controller.list);
categoriesRouter.post('/', requireAdmin, controller.create);

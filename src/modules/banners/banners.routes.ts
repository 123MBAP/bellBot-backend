import { Router } from 'express';
import { AdvertsRepository } from '../adverts/adverts.repository.js';
import { AdvertsService } from '../adverts/adverts.service.js';
import { AdvertsController } from '../adverts/adverts.controller.js';

export const bannersRouter = Router();

// This is a neutral alias for serving homepage banner images.
// Some ad blockers match on URL substrings like "ad"/"ads"/"advert".
// Serving the bytes from our own domain under /api/banners reduces false-positive blocking.
const repo = new AdvertsRepository();
const service = new AdvertsService(repo);
const controller = new AdvertsController(service);

bannersRouter.get('/:id/media', controller.media);

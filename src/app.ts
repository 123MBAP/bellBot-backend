import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { productsRouter } from './modules/products/products.routes.js';
import { categoriesRouter } from './modules/categories/categories.routes.js';
import { uploadsRouter } from './modules/uploads/uploads.routes.js';
import { usersRouter } from './modules/users/users.routes.js';
import { ordersRouter } from './modules/orders/orders.routes.js';
import { supportRouter } from './modules/support/support.routes.js';
import { advertsRouter } from './modules/adverts/adverts.routes.js';
import { showroomRouter } from './modules/showroom/showroom.routes.js';
import { bannersRouter } from './modules/banners/banners.routes.js';
import { uiConfigRouter } from './modules/uiConfig/uiConfig.routes.js';

export function createApp() {
    const app = express();

    app.use(
        cors({
            origin: env.corsOrigins.length > 0 ? env.corsOrigins : true,
            credentials: true,
        })
    );
    app.use(express.json());

    app.get('/health', (_req, res) => {
        res.json({ ok: true });
    });

    app.use('/api/auth', authRouter);
    app.use('/api/products', productsRouter);
    app.use('/api/categories', categoriesRouter);
    app.use('/api/uploads', uploadsRouter);
    app.use('/api/users', usersRouter);
    app.use('/api/orders', ordersRouter);
    app.use('/api/support', supportRouter);
    app.use('/api/adverts', advertsRouter);
    app.use('/api/banners', bannersRouter);
    app.use('/api/showroom', showroomRouter);
    app.use('/api/ui-config', uiConfigRouter);

    return app;
}

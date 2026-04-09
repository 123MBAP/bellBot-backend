import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { productsRouter } from './modules/products/products.routes.js';
import { categoriesRouter } from './modules/categories/categories.routes.js';
import { uploadsRouter } from './modules/uploads/uploads.routes.js';
import { usersRouter } from './modules/users/users.routes.js';
import { ordersRouter } from './modules/orders/orders.routes.js';

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

    return app;
}

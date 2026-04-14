import { Router } from 'express';
import { UsersRepository } from '../users/users.repository.js';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';

export const authRouter = Router();

const usersRepo = new UsersRepository();
const authService = new AuthService(usersRepo);
const authController = new AuthController(authService);

authRouter.post('/login', authController.login);
authRouter.post('/register', authController.register);
authRouter.post('/google', authController.google);
authRouter.post('/forgot-password', authController.forgotPassword);
authRouter.post('/reset-password', authController.resetPassword);

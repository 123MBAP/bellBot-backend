import express from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  adminResetPassword
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // All routes require authentication
router.use(authorize('admin')); // All routes require admin role

router.route('/')
  .get(getUsers)
  .post(createUser);

router.route('/:id')
  .get(getUserById)
  .put(updateUser)
  .delete(deleteUser);

router.put('/:id/reset-password', adminResetPassword);

export default router;

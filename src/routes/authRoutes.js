import express from 'express';
import { 
  login, 
  logout, 
  changePassword,
  forgotPassword,
  getPasswordResetRequests,
  processPasswordResetRequest
} from '../controllers/authController.js';
import { protect, authorize } from '../middleware/auth.js';
import { loginLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/login', loginLimiter, login);
router.post('/logout', protect, logout);
router.post('/change-password', protect, changePassword);
router.post('/forgot-password', forgotPassword);
router.get('/forgot-password-requests', protect, authorize('admin'), getPasswordResetRequests);
router.put('/forgot-password-requests/:id', protect, authorize('admin'), processPasswordResetRequest);

export default router;

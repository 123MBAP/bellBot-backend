import express from 'express';
import {
  getDevices,
  getDeviceById,
  createDevice,
  updateDevice,
  deleteDevice,
  assignDevice,
  unassignDevice,
  ringDevice,
  checkDeviceStatus,
  updateDeviceTime,
  toggleDeviceSilence
} from '../controllers/deviceController.js';
import { protect, authorize } from '../middleware/auth.js';
import { mqttLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.use(protect); // All routes require authentication

// Routes accessible to all authenticated users (with role-based filtering in controller)
router.route('/')
  .get(getDevices) // Controller filters by school for non-admin
  .post(authorize('admin'), createDevice);

router.route('/:id')
  .get(getDeviceById) // Controller checks access for non-admin
  .put(authorize('admin'), updateDevice)
  .delete(authorize('admin'), deleteDevice);

router.post('/:id/assign', authorize('admin'), assignDevice);
router.delete('/:id/assign/:userId', authorize('admin'), unassignDevice);

router.post('/:id/ring', mqttLimiter, ringDevice);
router.post('/:id/status', checkDeviceStatus);
router.post('/:id/update-time', authorize('admin'), updateDeviceTime);
router.put('/:id/silence', authorize('admin', 'manager'), toggleDeviceSilence);

export default router;

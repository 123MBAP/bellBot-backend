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
  toggleDeviceSilence,
  publishTimetable,
  syncDeviceTime,
  checkDeviceTime,
  checkDeviceTimetable,
  controlDeviceSilence
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

// MQTT device control routes
// Ringer role can access: ring, silence, status check
router.post('/:id/ring', mqttLimiter, authorize('admin', 'manager', 'ringer'), ringDevice);
router.post('/:id/silence', mqttLimiter, authorize('admin', 'manager', 'ringer'), controlDeviceSilence);
router.get('/:id/status', authorize('admin', 'manager', 'ringer'), checkDeviceStatus);

// Admin/Manager only routes
router.post('/:id/publish-timetable', mqttLimiter, authorize('admin', 'manager'), publishTimetable);
router.post('/:id/sync-time', mqttLimiter, authorize('admin', 'manager'), syncDeviceTime);
router.get('/:id/check-time', authorize('admin', 'manager'), checkDeviceTime);
router.get('/:id/check-timetable', authorize('admin', 'manager'), checkDeviceTimetable);

// Legacy routes
router.post('/:id/status', checkDeviceStatus);
router.post('/:id/update-time', authorize('admin'), updateDeviceTime);
router.put('/:id/silence', authorize('admin', 'manager'), toggleDeviceSilence);

export default router;

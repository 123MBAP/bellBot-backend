import express from 'express';
import {
  getSchoolTimetable,
  updateDaySchedule,
  getPresetTimetables,
  createPresetTimetable,
  updatePresetTimetable,
  deletePresetTimetable,
  createSpecialDayTimetable,
  deleteSpecialDayTimetable
} from '../controllers/timetableController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // All routes require authentication

// School timetable routes
router.get('/school/:schoolId', getSchoolTimetable);
router.put('/school/:schoolId/day/:day', authorize('admin', 'manager'), updateDaySchedule);

// Preset timetable routes
router.route('/presets')
  .get(getPresetTimetables)
  .post(authorize('admin', 'manager'), createPresetTimetable);

router.route('/presets/:id')
  .put(authorize('admin', 'manager'), updatePresetTimetable)
  .delete(authorize('admin', 'manager'), deletePresetTimetable);

// Special day routes
router.post('/special-day', authorize('admin', 'manager'), createSpecialDayTimetable);
router.delete('/special-day/:date', authorize('admin', 'manager'), deleteSpecialDayTimetable);

export default router;

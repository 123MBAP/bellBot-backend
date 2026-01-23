import express from 'express';
import {
  getSchools,
  getSchoolById,
  createSchool,
  updateSchool,
  deleteSchool,
  getMySchool
} from '../controllers/schoolController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // All routes require authentication

// My school route (for managers and ringers) - must be before /:id route
router.get('/my/school', getMySchool);

// Admin-only routes
router.use(authorize('admin')); // All remaining routes require admin role

router.route('/')
  .get(getSchools)
  .post(createSchool);

router.route('/:id')
  .get(getSchoolById)
  .put(updateSchool)
  .delete(deleteSchool);

export default router;

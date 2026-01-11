import express from 'express';
import {
  getSchools,
  getSchoolById,
  createSchool,
  updateSchool,
  deleteSchool
} from '../controllers/schoolController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // All routes require authentication
router.use(authorize('admin')); // All routes require admin role

router.route('/')
  .get(getSchools)
  .post(createSchool);

router.route('/:id')
  .get(getSchoolById)
  .put(updateSchool)
  .delete(deleteSchool);

export default router;

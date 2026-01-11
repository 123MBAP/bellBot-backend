import School from '../models/School.js';
import Device from '../models/Device.js';
import User from '../models/User.js';
import Timetable from '../models/Timetable.js';

// @desc    Get all schools
// @route   GET /api/schools
// @access  Private/Admin
export const getSchools = async (req, res) => {
  try {
    const schools = await School.find()
      .populate('deviceCount')
      .populate('userCount');

    res.json(schools);
  } catch (error) {
    console.error('Get schools error:', error);
    res.status(500).json({ message: 'Server error fetching schools' });
  }
};

// @desc    Get school by ID
// @route   GET /api/schools/:id
// @access  Private/Admin
export const getSchoolById = async (req, res) => {
  try {
    const school = await School.findById(req.params.id)
      .populate('deviceCount')
      .populate('userCount');

    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }

    // Get devices for this school
    const devices = await Device.find({ schoolId: school._id });
    
    // Get users for this school
    const users = await User.find({ schoolId: school._id }).select('-password');

    res.json({
      ...school.toJSON(),
      devices,
      users
    });
  } catch (error) {
    console.error('Get school by ID error:', error);
    res.status(500).json({ message: 'Server error fetching school' });
  }
};

// @desc    Create school
// @route   POST /api/schools
// @access  Private/Admin
export const createSchool = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'School name is required' });
    }

    const school = await School.create({ name });

    // Create default timetable for the school
    await Timetable.create({
      schoolId: school._id,
      updatedBy: req.user._id
    });

    res.status(201).json(school);
  } catch (error) {
    console.error('Create school error:', error);
    res.status(500).json({ message: 'Server error creating school' });
  }
};

// @desc    Update school
// @route   PUT /api/schools/:id
// @access  Private/Admin
export const updateSchool = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'School name is required' });
    }

    const school = await School.findById(req.params.id);

    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }

    school.name = name;
    await school.save();

    res.json(school);
  } catch (error) {
    console.error('Update school error:', error);
    res.status(500).json({ message: 'Server error updating school' });
  }
};

// @desc    Delete school
// @route   DELETE /api/schools/:id
// @access  Private/Admin
export const deleteSchool = async (req, res) => {
  try {
    const school = await School.findById(req.params.id);

    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }

    // Check if school has devices or users
    const deviceCount = await Device.countDocuments({ schoolId: school._id });
    const userCount = await User.countDocuments({ schoolId: school._id });

    if (deviceCount > 0 || userCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete school with existing devices or users' 
      });
    }

    // Delete timetable
    await Timetable.deleteMany({ schoolId: school._id });

    await school.deleteOne();

    res.json({ message: 'School deleted successfully' });
  } catch (error) {
    console.error('Delete school error:', error);
    res.status(500).json({ message: 'Server error deleting school' });
  }
};

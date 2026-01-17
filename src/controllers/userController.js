import User from '../models/User.js';
import School from '../models/School.js';

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .populate('schoolId', 'name')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('schoolId', 'name');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ message: 'Server error fetching user' });
  }
};

// @desc    Create user
// @route   POST /api/users
// @access  Private/Admin
export const createUser = async (req, res) => {
  try {
    const { email, password, name, role, schoolId } = req.body;

    // Validate required fields
    if (!email || !password || !name || !role) {
      return res.status(400).json({ 
        message: 'Email, password, name, and role are required' 
      });
    }

    // Validate role
    if (!['admin', 'manager', 'ringer'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Validate school requirement for non-admin roles
    if (role !== 'admin' && !schoolId) {
      return res.status(400).json({ 
        message: 'School ID is required for manager and ringer roles' 
      });
    }

    // Verify school exists if schoolId is provided
    if (schoolId) {
      const school = await School.findById(schoolId);
      if (!school) {
        return res.status(404).json({ message: 'School not found' });
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const user = await User.create({
      email,
      password,
      name,
      role,
      schoolId: role === 'admin' ? null : schoolId
    });

    const populatedUser = await User.findById(user._id)
      .populate('schoolId', 'name');

    res.status(201).json(populatedUser);
  } catch (error) {
    console.error('Create user error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    
    res.status(500).json({ message: 'Server error creating user' });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = async (req, res) => {
  try {
    const { email, name, role, schoolId } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Validate role if provided
    if (role && !['admin', 'manager', 'ringer'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Validate school requirement for non-admin roles
    const newRole = role || user.role;
    if (newRole !== 'admin' && !schoolId && !user.schoolId) {
      return res.status(400).json({ 
        message: 'School ID is required for manager and ringer roles' 
      });
    }

    // Verify school exists if schoolId is being updated
    if (schoolId && schoolId !== user.schoolId?.toString()) {
      const school = await School.findById(schoolId);
      if (!school) {
        return res.status(404).json({ message: 'School not found' });
      }
      user.schoolId = schoolId;
    }

    // Update fields
    if (email) user.email = email;
    if (name) user.name = name;
    if (role) {
      user.role = role;
      // Clear schoolId if changing to admin
      if (role === 'admin') {
        user.schoolId = null;
      }
    }

    await user.save();

    const populatedUser = await User.findById(user._id)
      .populate('schoolId', 'name');

    res.json(populatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    
    res.status(500).json({ message: 'Server error updating user' });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    await user.deleteOne();

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error deleting user' });
  }
};

// @desc    Admin reset user password
// @route   PUT /api/users/:id/reset-password
// @access  Private/Admin
export const adminResetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ message: 'New password is required' });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update password (will be hashed by pre-save middleware)
    user.password = newPassword;
    await user.save();

    res.json({ 
      message: 'Password reset successfully',
      newPassword
    });
  } catch (error) {
    console.error('Admin reset password error:', error);
    res.status(500).json({ message: 'Server error resetting password' });
  }
};

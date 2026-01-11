import User from '../models/User.js';
import PasswordResetRequest from '../models/PasswordResetRequest.js';
import { generateToken } from '../middleware/auth.js';

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find user and populate school
    const user = await User.findOne({ email }).select('+password').populate('schoolId', 'name');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id);

    // Remove password from response and rename schoolId to school
    const userResponse = user.toJSON();
    if (userResponse.schoolId) {
      userResponse.school = userResponse.schoolId;
      delete userResponse.schoolId;
    }

    res.json({
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Change password
// @route   POST /api/auth/change-password
// @access  Private
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please provide current and new password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    // Verify current password
    const isPasswordCorrect = await user.comparePassword(currentPassword);

    if (!isPasswordCorrect) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Check if new password is same as old
    if (currentPassword === newPassword) {
      return res.status(400).json({ message: 'New password must be different from current password' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error changing password' });
  }
};

// @desc    Create forgot password request
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email, reason } = req.body;

    if (!email || !reason) {
      return res.status(400).json({ message: 'Please provide email and reason' });
    }

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal that user doesn't exist
      return res.json({ message: 'Password reset request submitted for review' });
    }

    // Create password reset request
    const resetRequest = await PasswordResetRequest.create({
      userId: user._id,
      userEmail: user.email,
      userName: user.name,
      reason,
      status: 'pending'
    });

    res.json({ 
      message: 'Password reset request submitted for review',
      requestId: resetRequest._id
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error processing request' });
  }
};

// @desc    Get all password reset requests
// @route   GET /api/auth/forgot-password-requests
// @access  Private/Admin
export const getPasswordResetRequests = async (req, res) => {
  try {
    const requests = await PasswordResetRequest.find()
      .populate('userId', 'name email')
      .populate('processedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Get password reset requests error:', error);
    res.status(500).json({ message: 'Server error fetching requests' });
  }
};

// @desc    Process password reset request (approve/reject)
// @route   PUT /api/auth/forgot-password-requests/:id
// @access  Private/Admin
export const processPasswordResetRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, newPassword, rejectionReason } = req.body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action. Must be approve or reject' });
    }

    const request = await PasswordResetRequest.findById(id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request has already been processed' });
    }

    if (action === 'approve') {
      if (!newPassword) {
        return res.status(400).json({ message: 'New password required for approval' });
      }

      // Update user password
      const user = await User.findById(request.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      user.password = newPassword;
      await user.save();

      // Update request
      request.status = 'approved';
      request.processedDate = new Date();
      request.processedBy = req.user._id;
      request.newPassword = newPassword; // Store for admin reference
      await request.save();

      res.json({ 
        message: 'Password reset approved',
        newPassword,
        request
      });
    } else {
      // Reject
      request.status = 'rejected';
      request.processedDate = new Date();
      request.processedBy = req.user._id;
      request.rejectionReason = rejectionReason || 'Rejected by administrator';
      await request.save();

      res.json({ 
        message: 'Password reset rejected',
        request
      });
    }
  } catch (error) {
    console.error('Process password reset error:', error);
    res.status(500).json({ message: 'Server error processing request' });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res) => {
  // With JWT, logout is handled on client side by removing token
  res.json({ message: 'Logged out successfully' });
};

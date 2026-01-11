import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);

    // Get user from token
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

// Role-based authorization
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `User role '${req.user.role}' is not authorized to access this route` 
      });
    }

    next();
  };
};

// Check if user belongs to the school they're trying to access
export const checkSchoolAccess = async (req, res, next) => {
  try {
    const { user } = req;

    // Admin can access all schools
    if (user.role === 'admin') {
      return next();
    }

    // Get schoolId from request params or body
    const schoolId = req.params.schoolId || req.body.schoolId;

    if (!schoolId) {
      return res.status(400).json({ message: 'School ID required' });
    }

    // Check if user's school matches the requested school
    if (user.schoolId.toString() !== schoolId.toString()) {
      return res.status(403).json({ 
        message: 'Not authorized to access this school' 
      });
    }

    next();
  } catch (error) {
    console.error('School access check error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Generate JWT token
export const generateToken = (id) => {
  return jwt.sign({ id }, config.jwt.secret, {
    expiresIn: config.jwt.expire
  });
};

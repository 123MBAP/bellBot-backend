import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'ringer'],
    required: true
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    default: null,
    // Admin has no school, manager and ringer must have one
    validate: {
      validator: function(value) {
        if (this.role === 'admin') return value === null;
        return value !== null;
      },
      message: 'Manager and ringer roles must have a school'
    }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output and rename schoolId to school
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  
  // Rename schoolId to school for consistency with frontend
  if (obj.schoolId !== undefined) {
    obj.school = obj.schoolId;
    delete obj.schoolId;
  }
  
  return obj;
};

const User = mongoose.model('User', userSchema);

export default User;

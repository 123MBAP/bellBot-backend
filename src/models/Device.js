import mongoose from 'mongoose';

const deviceSchema = new mongoose.Schema({
  serial: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true
  },
  location: {
    type: String,
    trim: true,
    default: ''
  },
  model: {
    type: String,
    trim: true,
    default: 'Standard Bell'
  },
  status: {
    type: String,
    enum: ['online', 'offline'],
    default: 'offline'
  },
  silenced: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Virtual field for serialNumber (alias for serial)
deviceSchema.virtual('serialNumber').get(function() {
  return this.serial;
});

// Transform schoolId to school in JSON output
deviceSchema.methods.toJSON = function() {
  const obj = this.toObject({ virtuals: true });
  
  // Rename schoolId to school for consistency with frontend
  if (obj.schoolId !== undefined) {
    obj.school = obj.schoolId;
    delete obj.schoolId;
  }
  
  return obj;
};

const Device = mongoose.model('Device', deviceSchema);

export default Device;

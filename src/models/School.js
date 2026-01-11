import mongoose from 'mongoose';

const schoolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for device count
schoolSchema.virtual('deviceCount', {
  ref: 'Device',
  localField: '_id',
  foreignField: 'schoolId',
  count: true
});

// Virtual for user count
schoolSchema.virtual('userCount', {
  ref: 'User',
  localField: '_id',
  foreignField: 'schoolId',
  count: true
});

const School = mongoose.model('School', schoolSchema);

export default School;

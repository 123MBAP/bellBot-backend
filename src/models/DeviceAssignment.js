import mongoose from 'mongoose';

const deviceAssignmentSchema = new mongoose.Schema({
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  }
}, {
  timestamps: true
});

// Ensure unique device-user combination
deviceAssignmentSchema.index({ deviceId: 1, userId: 1 }, { unique: true });

const DeviceAssignment = mongoose.model('DeviceAssignment', deviceAssignmentSchema);

export default DeviceAssignment;

import mongoose from 'mongoose';

const passwordResetRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  userEmail: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  requestDate: {
    type: Date,
    default: Date.now
  },
  processedDate: {
    type: Date
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  newPassword: {
    type: String // Temporary plain text password for admin to send to user
  },
  rejectionReason: {
    type: String
  }
}, {
  timestamps: true
});

const PasswordResetRequest = mongoose.model('PasswordResetRequest', passwordResetRequestSchema);

export default PasswordResetRequest;

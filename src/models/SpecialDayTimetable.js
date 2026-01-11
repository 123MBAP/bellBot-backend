import mongoose from 'mongoose';

const timeEntrySchema = new mongoose.Schema({
  time: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:MM format
  },
  duration: {
    type: Number,
    required: true,
    min: 1,
    max: 60
  },
  label: {
    type: String,
    default: ''
  }
}, { _id: false });

const specialDayTimetableSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  times: {
    type: [timeEntrySchema],
    default: []
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Ensure unique school-date combination
specialDayTimetableSchema.index({ schoolId: 1, date: 1 }, { unique: true });

const SpecialDayTimetable = mongoose.model('SpecialDayTimetable', specialDayTimetableSchema);

export default SpecialDayTimetable;

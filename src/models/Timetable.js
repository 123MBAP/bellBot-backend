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

const dayScheduleSchema = new mongoose.Schema({
  presetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PresetTimetable',
    default: null
  },
  customTimes: {
    type: [timeEntrySchema],
    default: []
  }
}, { _id: false });

const timetableSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    unique: true,
    index: true
  },
  weeklySchedule: {
    Monday: { type: dayScheduleSchema, default: () => ({}) },
    Tuesday: { type: dayScheduleSchema, default: () => ({}) },
    Wednesday: { type: dayScheduleSchema, default: () => ({}) },
    Thursday: { type: dayScheduleSchema, default: () => ({}) },
    Friday: { type: dayScheduleSchema, default: () => ({}) },
    Saturday: { type: dayScheduleSchema, default: () => ({}) },
    Sunday: { type: dayScheduleSchema, default: () => ({}) }
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

const Timetable = mongoose.model('Timetable', timetableSchema);

export default Timetable;

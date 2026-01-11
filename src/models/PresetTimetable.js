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

const presetTimetableSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  times: {
    type: [timeEntrySchema],
    default: []
  }
}, {
  timestamps: true
});

const PresetTimetable = mongoose.model('PresetTimetable', presetTimetableSchema);

export default PresetTimetable;

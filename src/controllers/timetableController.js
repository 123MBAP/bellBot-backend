import Timetable from '../models/Timetable.js';
import PresetTimetable from '../models/PresetTimetable.js';
import SpecialDayTimetable from '../models/SpecialDayTimetable.js';
import Device from '../models/Device.js';
import { mqttService } from '../services/mqttService.js';

// @desc    Get timetable for school
// @route   GET /api/timetables/school/:schoolId
// @access  Private
export const getSchoolTimetable = async (req, res) => {
  try {
    const { schoolId } = req.params;

    // Check access for non-admin users
    if (req.user.role !== 'admin' && 
        req.user.schoolId.toString() !== schoolId) {
      return res.status(403).json({ message: 'Not authorized to access this timetable' });
    }

    let timetable = await Timetable.findOne({ schoolId })
      .populate('updatedBy', 'name email');

    // Create default timetable if none exists
    if (!timetable) {
      timetable = await Timetable.create({
        schoolId,
        updatedBy: req.user._id
      });
    }

    res.json(timetable);
  } catch (error) {
    console.error('Get school timetable error:', error);
    res.status(500).json({ message: 'Server error fetching timetable' });
  }
};

// @desc    Update day in timetable
// @route   PUT /api/timetables/school/:schoolId/day/:day
// @access  Private (Admin/Manager)
export const updateDaySchedule = async (req, res) => {
  try {
    const { schoolId, day } = req.params;
    const { presetId, customTimes } = req.body;

    // Validate day
    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    if (!validDays.includes(day)) {
      return res.status(400).json({ message: 'Invalid day' });
    }

    // Check access
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Not authorized to update timetables' });
    }

    if (req.user.role === 'manager' && 
        req.user.schoolId.toString() !== schoolId) {
      return res.status(403).json({ message: 'Not authorized to update this timetable' });
    }

    // Get or create timetable
    let timetable = await Timetable.findOne({ schoolId });
    if (!timetable) {
      timetable = await Timetable.create({ schoolId, updatedBy: req.user._id });
    }

    // Update day schedule
    timetable.weeklySchedule[day] = {
      presetId: presetId || null,
      customTimes: customTimes || []
    };
    timetable.updatedBy = req.user._id;
    await timetable.save();

    // Publish schedule to devices via MQTT
    await publishScheduleToDevices(schoolId);

    res.json(timetable);
  } catch (error) {
    console.error('Update day schedule error:', error);
    res.status(500).json({ message: 'Server error updating schedule' });
  }
};

// @desc    Get preset timetables
// @route   GET /api/timetables/presets
// @access  Private
export const getPresetTimetables = async (req, res) => {
  try {
    let query = {};

    // Filter by school for non-admin users
    if (req.user.role !== 'admin') {
      query.schoolId = req.user.schoolId;
    }

    const presets = await PresetTimetable.find(query)
      .populate('schoolId', 'name')
      .sort({ createdAt: -1 });

    res.json(presets);
  } catch (error) {
    console.error('Get preset timetables error:', error);
    res.status(500).json({ message: 'Server error fetching presets' });
  }
};

// @desc    Create preset timetable
// @route   POST /api/timetables/presets
// @access  Private (Admin/Manager)
export const createPresetTimetable = async (req, res) => {
  try {
    const { schoolId, name, description, times } = req.body;

    if (!schoolId || !name) {
      return res.status(400).json({ message: 'School ID and name are required' });
    }

    // Check access
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Not authorized to create presets' });
    }

    if (req.user.role === 'manager' && 
        req.user.schoolId.toString() !== schoolId) {
      return res.status(403).json({ message: 'Not authorized to create presets for this school' });
    }

    const preset = await PresetTimetable.create({
      schoolId,
      name,
      description: description || '',
      times: times || []
    });

    const populatedPreset = await PresetTimetable.findById(preset._id)
      .populate('schoolId', 'name');

    res.status(201).json(populatedPreset);
  } catch (error) {
    console.error('Create preset timetable error:', error);
    res.status(500).json({ message: 'Server error creating preset' });
  }
};

// @desc    Update preset timetable
// @route   PUT /api/timetables/presets/:id
// @access  Private (Admin/Manager)
export const updatePresetTimetable = async (req, res) => {
  try {
    const { name, description, times } = req.body;

    const preset = await PresetTimetable.findById(req.params.id);

    if (!preset) {
      return res.status(404).json({ message: 'Preset not found' });
    }

    // Check access
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Not authorized to update presets' });
    }

    if (req.user.role === 'manager' && 
        req.user.schoolId.toString() !== preset.schoolId.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this preset' });
    }

    if (name) preset.name = name;
    if (description !== undefined) preset.description = description;
    if (times) preset.times = times;

    await preset.save();

    const populatedPreset = await PresetTimetable.findById(preset._id)
      .populate('schoolId', 'name');

    // Publish updated schedules to devices if preset is in use
    await publishScheduleToDevices(preset.schoolId);

    res.json(populatedPreset);
  } catch (error) {
    console.error('Update preset timetable error:', error);
    res.status(500).json({ message: 'Server error updating preset' });
  }
};

// @desc    Delete preset timetable
// @route   DELETE /api/timetables/presets/:id
// @access  Private (Admin/Manager)
export const deletePresetTimetable = async (req, res) => {
  try {
    const preset = await PresetTimetable.findById(req.params.id);

    if (!preset) {
      return res.status(404).json({ message: 'Preset not found' });
    }

    // Check access
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Not authorized to delete presets' });
    }

    if (req.user.role === 'manager' && 
        req.user.schoolId.toString() !== preset.schoolId.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this preset' });
    }

    // Check if preset is in use
    const timetable = await Timetable.findOne({ schoolId: preset.schoolId });
    if (timetable) {
      const daysUsingPreset = Object.keys(timetable.weeklySchedule).filter(day => 
        timetable.weeklySchedule[day].presetId?.toString() === preset._id.toString()
      );

      if (daysUsingPreset.length > 0) {
        return res.status(400).json({ 
          message: `Cannot delete preset. It is currently used by: ${daysUsingPreset.join(', ')}`
        });
      }
    }

    await preset.deleteOne();

    res.json({ message: 'Preset deleted successfully' });
  } catch (error) {
    console.error('Delete preset timetable error:', error);
    res.status(500).json({ message: 'Server error deleting preset' });
  }
};

// @desc    Create special day timetable
// @route   POST /api/timetables/special-day
// @access  Private (Admin/Manager)
export const createSpecialDayTimetable = async (req, res) => {
  try {
    const { schoolId, date, times } = req.body;

    if (!schoolId || !date || !times) {
      return res.status(400).json({ message: 'School ID, date, and times are required' });
    }

    // Check access
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Not authorized to create special day timetables' });
    }

    if (req.user.role === 'manager' && 
        req.user.schoolId.toString() !== schoolId) {
      return res.status(403).json({ message: 'Not authorized to create special days for this school' });
    }

    const specialDay = await SpecialDayTimetable.create({
      schoolId,
      date: new Date(date),
      times,
      createdBy: req.user._id
    });

    const populatedSpecialDay = await SpecialDayTimetable.findById(specialDay._id)
      .populate('schoolId', 'name')
      .populate('createdBy', 'name email');

    // Publish schedule to devices via MQTT
    await publishScheduleToDevices(schoolId);

    res.status(201).json(populatedSpecialDay);
  } catch (error) {
    console.error('Create special day timetable error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Special day already exists for this date' });
    }
    
    res.status(500).json({ message: 'Server error creating special day' });
  }
};

// @desc    Delete special day timetable
// @route   DELETE /api/timetables/special-day/:date
// @access  Private (Admin/Manager)
export const deleteSpecialDayTimetable = async (req, res) => {
  try {
    const { date } = req.params;
    const { schoolId } = req.query;

    if (!schoolId) {
      return res.status(400).json({ message: 'School ID is required' });
    }

    // Check access
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Not authorized to delete special day timetables' });
    }

    if (req.user.role === 'manager' && 
        req.user.schoolId.toString() !== schoolId) {
      return res.status(403).json({ message: 'Not authorized to delete special days for this school' });
    }

    const specialDay = await SpecialDayTimetable.findOneAndDelete({
      schoolId,
      date: new Date(date)
    });

    if (!specialDay) {
      return res.status(404).json({ message: 'Special day not found' });
    }

    // Publish updated schedule to devices
    await publishScheduleToDevices(schoolId);

    res.json({ message: 'Special day deleted successfully' });
  } catch (error) {
    console.error('Delete special day timetable error:', error);
    res.status(500).json({ message: 'Server error deleting special day' });
  }
};

// Helper function to publish schedule to all devices in a school
async function publishScheduleToDevices(schoolId) {
  try {
    const devices = await Device.find({ schoolId });
    const timetable = await Timetable.findOne({ schoolId });

    if (!timetable) return;

    // Publish schedule to each device
    for (const device of devices) {
      mqttService.publishSchedule(device.serial, timetable.weeklySchedule);
    }
  } catch (error) {
    console.error('Error publishing schedule to devices:', error);
  }
}

import Device from '../models/Device.js';
import DeviceAssignment from '../models/DeviceAssignment.js';
import School from '../models/School.js';
import { mqttService } from '../services/mqttService.js';

// @desc    Get all devices (filtered by user role)
// @route   GET /api/devices
// @access  Private
export const getDevices = async (req, res) => {
  try {
    let query = {};

    // Filter by school for non-admin users
    if (req.user.role !== 'admin') {
      query.schoolId = req.user.schoolId;
    }

    const devices = await Device.find(query)
      .populate('schoolId', 'name')
      .sort({ createdAt: -1 });

    res.json(devices);
  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({ message: 'Server error fetching devices' });
  }
};

// @desc    Get device by ID
// @route   GET /api/devices/:id
// @access  Private
export const getDeviceById = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id)
      .populate('schoolId', 'name');

    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    // Check access for non-admin users
    if (req.user.role !== 'admin' && 
        device.schoolId._id.toString() !== req.user.schoolId.toString()) {
      return res.status(403).json({ message: 'Not authorized to access this device' });
    }

    // Get assigned users
    const assignments = await DeviceAssignment.find({ deviceId: device._id })
      .populate('userId', 'name email role');

    res.json({
      ...device.toJSON(),
      assignedUsers: assignments.map(a => a.userId)
    });
  } catch (error) {
    console.error('Get device by ID error:', error);
    res.status(500).json({ message: 'Server error fetching device' });
  }
};

// @desc    Create device
// @route   POST /api/devices
// @access  Private/Admin
export const createDevice = async (req, res) => {
  try {
    const { serial, schoolId, location, model } = req.body;

    if (!serial || !schoolId) {
      return res.status(400).json({ message: 'Serial and school ID are required' });
    }

    // Verify school exists
    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }

    const device = await Device.create({
      serial,
      schoolId,
      location: location || '',
      model: model || 'Standard Bell'
    });

    const populatedDevice = await Device.findById(device._id)
      .populate('schoolId', 'name');

    res.status(201).json(populatedDevice);
  } catch (error) {
    console.error('Create device error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Device serial already exists' });
    }
    
    res.status(500).json({ message: 'Server error creating device' });
  }
};

// @desc    Update device
// @route   PUT /api/devices/:id
// @access  Private/Admin
export const updateDevice = async (req, res) => {
  try {
    const { serial, schoolId, location, model } = req.body;

    const device = await Device.findById(req.params.id);

    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    // Verify school exists if schoolId is being updated
    if (schoolId && schoolId !== device.schoolId.toString()) {
      const school = await School.findById(schoolId);
      if (!school) {
        return res.status(404).json({ message: 'School not found' });
      }
      device.schoolId = schoolId;
    }

    if (serial) device.serial = serial;
    if (location !== undefined) device.location = location;
    if (model) device.model = model;

    await device.save();

    const populatedDevice = await Device.findById(device._id)
      .populate('schoolId', 'name');

    res.json(populatedDevice);
  } catch (error) {
    console.error('Update device error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Device serial already exists' });
    }
    
    res.status(500).json({ message: 'Server error updating device' });
  }
};

// @desc    Delete device
// @route   DELETE /api/devices/:id
// @access  Private/Admin
export const deleteDevice = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);

    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    // Delete all assignments
    await DeviceAssignment.deleteMany({ deviceId: device._id });

    await device.deleteOne();

    res.json({ message: 'Device deleted successfully' });
  } catch (error) {
    console.error('Delete device error:', error);
    res.status(500).json({ message: 'Server error deleting device' });
  }
};

// @desc    Assign device to user
// @route   POST /api/devices/:id/assign
// @access  Private/Admin
export const assignDevice = async (req, res) => {
  try {
    const { userId } = req.body;
    const deviceId = req.params.id;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const device = await Device.findById(deviceId);
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    // Check if assignment already exists
    const existingAssignment = await DeviceAssignment.findOne({ deviceId, userId });
    if (existingAssignment) {
      return res.status(400).json({ message: 'User already assigned to this device' });
    }

    const assignment = await DeviceAssignment.create({ deviceId, userId });
    const populatedAssignment = await DeviceAssignment.findById(assignment._id)
      .populate('userId', 'name email role');

    res.status(201).json(populatedAssignment);
  } catch (error) {
    console.error('Assign device error:', error);
    res.status(500).json({ message: 'Server error assigning device' });
  }
};

// @desc    Unassign device from user
// @route   DELETE /api/devices/:id/assign/:userId
// @access  Private/Admin
export const unassignDevice = async (req, res) => {
  try {
    const { id: deviceId, userId } = req.params;

    const assignment = await DeviceAssignment.findOneAndDelete({ deviceId, userId });

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    res.json({ message: 'Device unassigned successfully' });
  } catch (error) {
    console.error('Unassign device error:', error);
    res.status(500).json({ message: 'Server error unassigning device' });
  }
};

// @desc    Update device time
// @route   POST /api/devices/:id/update-time
// @access  Private/Admin
export const updateDeviceTime = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);

    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    // Publish time update via MQTT
    mqttService.publishTimeUpdate(device.serial);

    res.json({ 
      message: 'Time update sent',
      device: device.serial
    });
  } catch (error) {
    console.error('Update device time error:', error);
    res.status(500).json({ message: 'Server error updating device time' });
  }
};

// @desc    Toggle device silence
// @route   PUT /api/devices/:id/silence
// @access  Private (Admin/Manager)
export const toggleDeviceSilence = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);

    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    // Check access
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Not authorized to silence devices' });
    }

    if (req.user.role === 'manager' && 
        device.schoolId.toString() !== req.user.schoolId.toString()) {
      return res.status(403).json({ message: 'Not authorized to silence this device' });
    }

    device.silenced = !device.silenced;
    await device.save();

    res.json({ 
      message: `Device ${device.silenced ? 'silenced' : 'unsilenced'}`,
      device
    });
  } catch (error) {
    console.error('Toggle device silence error:', error);
    res.status(500).json({ message: 'Server error toggling device silence' });
  }
};

// @desc    Publish timetable to device via MQTT
// @route   POST /api/devices/:id/publish-timetable
// @access  Private (Admin/Manager)
export const publishTimetable = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id).populate('schoolId', 'name');

    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    // Check access
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (req.user.role === 'manager' && 
        device.schoolId._id.toString() !== req.user.schoolId.toString()) {
      return res.status(403).json({ message: 'Not authorized to manage this device' });
    }

    // Import dependencies
    const Timetable = (await import('../models/Timetable.js')).default;
    const { transformTimetableForDevice, validateDeviceTimetable } = await import('../utils/timetableTransformer.js');

    // Get school timetable
    const timetable = await Timetable.findOne({ schoolId: device.schoolId._id });
    
    if (!timetable) {
      return res.status(404).json({ message: 'No timetable found for this school' });
    }

    // Transform to device format
    const deviceTimetable = await transformTimetableForDevice(timetable, device.schoolId);

    // Validate
    const validation = validateDeviceTimetable(deviceTimetable);
    if (!validation.valid) {
      return res.status(400).json({ 
        message: 'Invalid timetable format',
        errors: validation.errors
      });
    }

    // Publish via MQTT
    const success = mqttService.publishTimetableToDevice(device.serial, deviceTimetable);

    if (!success) {
      return res.status(500).json({ message: 'Failed to publish timetable - MQTT not connected' });
    }

    res.json({ 
      message: 'Timetable published successfully',
      device: device.serial,
      payloadSize: validation.size
    });
  } catch (error) {
    console.error('Publish timetable error:', error);
    res.status(500).json({ message: 'Server error publishing timetable' });
  }
};

// @desc    Sync device time
// @route   POST /api/devices/:id/sync-time
// @access  Private (Admin/Manager)
export const syncDeviceTime = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);

    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    // Check access
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (req.user.role === 'manager' && 
        device.schoolId.toString() !== req.user.schoolId.toString()) {
      return res.status(403).json({ message: 'Not authorized to manage this device' });
    }

    // Publish time update via MQTT
    const success = mqttService.publishTimeUpdate(device.serial);

    if (!success) {
      return res.status(500).json({ message: 'Failed to sync time - MQTT not connected' });
    }

    res.json({ 
      message: 'Time sync command sent',
      device: device.serial
    });
  } catch (error) {
    console.error('Sync device time error:', error);
    res.status(500).json({ message: 'Server error syncing device time' });
  }
};

// @desc    Check device time
// @route   GET /api/devices/:id/check-time
// @access  Private (Admin/Manager)
export const checkDeviceTime = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);

    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    // Check access
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (req.user.role === 'manager' && 
        device.schoolId.toString() !== req.user.schoolId.toString()) {
      return res.status(403).json({ message: 'Not authorized to manage this device' });
    }

    // Request device time via MQTT with callback
    const timePromise = new Promise((resolve) => {
      mqttService.publishTimeRequest(device.serial, (response) => {
        resolve(response);
      });
    });

    const response = await timePromise;

    if (response.error || response.timeout) {
      return res.status(408).json({ 
        message: 'Device did not respond',
        timeout: true
      });
    }

    res.json({ 
      message: 'Device time retrieved',
      device: device.serial,
      time: response.time
    });
  } catch (error) {
    console.error('Check device time error:', error);
    res.status(500).json({ message: 'Server error checking device time' });
  }
};

// @desc    Check current timetable on device
// @route   GET /api/devices/:id/check-timetable
// @access  Private (Admin/Manager)
export const checkDeviceTimetable = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);

    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    // Check access
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (req.user.role === 'manager' && 
        device.schoolId.toString() !== req.user.schoolId.toString()) {
      return res.status(403).json({ message: 'Not authorized to manage this device' });
    }

    // Request current timetable via MQTT with callback
    const timetablePromise = new Promise((resolve) => {
      mqttService.publishTimetableRequest(device.serial, (response) => {
        resolve(response);
      });
    });

    const response = await timetablePromise;

    if (response.error || response.timeout) {
      return res.status(408).json({ 
        message: 'Device did not respond',
        timeout: true
      });
    }

    res.json({ 
      message: 'Device timetable retrieved',
      device: device.serial,
      timetableId: response.id,
      updatedAt: response.updatedAt
    });
  } catch (error) {
    console.error('Check device timetable error:', error);
    res.status(500).json({ message: 'Server error checking device timetable' });
  }
};

// @desc    Control device silence mode
// @route   POST /api/devices/:id/silence
// @access  Private (Admin/Manager/Ringer)
export const controlDeviceSilence = async (req, res) => {
  try {
    const { enable } = req.body; // true to enable silence, false to disable
    const device = await Device.findById(req.params.id);

    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    // Check access
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && req.user.role !== 'ringer') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if ((req.user.role === 'manager' || req.user.role === 'ringer') && 
        device.schoolId.toString() !== req.user.schoolId.toString()) {
      return res.status(403).json({ message: 'Not authorized to manage this device' });
    }

    // Publish silence command via MQTT
    const success = enable 
      ? mqttService.publishSilentOn(device.serial)
      : mqttService.publishSilentOff(device.serial);

    if (!success) {
      return res.status(500).json({ message: 'Failed to control silence - MQTT not connected' });
    }

    // Update local state (will be confirmed by device status check)
    device.isSilenced = enable;
    await device.save();

    res.json({ 
      message: `Device ${enable ? 'silenced' : 'unsilenced'}`,
      device: device.serial,
      silenced: enable
    });
  } catch (error) {
    console.error('Control device silence error:', error);
    res.status(500).json({ message: 'Server error controlling device silence' });
  }
};

// @desc    Ring device manually
// @route   POST /api/devices/:id/ring
// @access  Private (Admin/Manager)
export const ringDevice = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);

    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    // Check access
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && req.user.role !== 'ringer') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if ((req.user.role === 'manager' || req.user.role === 'ringer') && 
        device.schoolId.toString() !== req.user.schoolId.toString()) {
      return res.status(403).json({ message: 'Not authorized to manage this device' });
    }

    // Publish ring command via MQTT
    const success = mqttService.publishRing(device.serial);

    if (!success) {
      return res.status(500).json({ message: 'Failed to ring device - MQTT not connected' });
    }

    res.json({ 
      message: 'Ring command sent',
      device: device.serial
    });
  } catch (error) {
    console.error('Ring device error:', error);
    res.status(500).json({ message: 'Server error ringing device' });
  }
};

// @desc    Check comprehensive device status
// @route   GET /api/devices/:id/status
// @access  Private (Admin/Manager/Ringer)
export const checkDeviceStatus = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);

    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    // Check access
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && req.user.role !== 'ringer') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if ((req.user.role === 'manager' || req.user.role === 'ringer') && 
        device.schoolId.toString() !== req.user.schoolId.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this device' });
    }

    // Request device status via MQTT with callback
    const statusPromise = new Promise((resolve) => {
      mqttService.publishDeviceStatusRequest(device.serial, (response) => {
        resolve(response);
      });
    });

    const response = await statusPromise;

    if (response.error || response.timeout) {
      // Mark device as offline
      await Device.findByIdAndUpdate(req.params.id, { isOnline: false });
      
      return res.status(408).json({ 
        message: 'Device did not respond',
        timeout: true,
        isOnline: false
      });
    }

    // Wait a moment for MQTT handler to complete DB update
    await new Promise(resolve => setTimeout(resolve, 100));

    // Device responded - fetch updated data
    const updatedDevice = await Device.findById(req.params.id).populate('schoolId', 'name');

    res.json({ 
      message: 'Device status retrieved',
      device: updatedDevice
    });
  } catch (error) {
    console.error('Check device status error:', error);
    res.status(500).json({ message: 'Server error checking device status' });
  }
};

import PresetTimetable from '../models/PresetTimetable.js';

/**
 * Transform database timetable format to device MQTT format
 * 
 * Device expects:
 * {
 *   "id": "SpringTerm2026",
 *   "updatedAt": "2024-06-10T12:00:00.000Z",
 *   "times": {
 *     "0": ["08:00", "10:30"],  // Sunday
 *     "1": ["08:00", "10:30"],  // Monday
 *     ...
 *   }
 * }
 */

const DAY_MAP = {
  Sunday: '0',
  Monday: '1',
  Tuesday: '2',
  Wednesday: '3',
  Thursday: '4',
  Friday: '5',
  Saturday: '6'
};

/**
 * Get preset times by ID
 */
async function getPresetTimes(presetId) {
  if (!presetId) return [];
  
  try {
    const preset = await PresetTimetable.findById(presetId);
    if (!preset) return [];
    
    // Extract just the time values from preset
    return preset.times.map(entry => entry.time);
  } catch (error) {
    console.error('Error fetching preset:', error);
    return [];
  }
}

/**
 * Transform DB timetable to device format
 * @param {Object} timetable - Mongoose timetable document
 * @param {Object} school - School object with name
 * @returns {Object} Device-formatted timetable
 */
export async function transformTimetableForDevice(timetable, school) {
  const deviceTimetable = {
    id: `${school.name.replace(/\s+/g, '_')}_${timetable._id.toString().slice(-6)}`,
    updatedAt: timetable.updatedAt.toISOString(),
    times: {}
  };

  // Process each day
  for (const [dayName, daySchedule] of Object.entries(timetable.weeklySchedule)) {
    const dayIndex = DAY_MAP[dayName];
    let times = [];

    // Combine preset times and custom times
    if (daySchedule.presetId) {
      const presetTimes = await getPresetTimes(daySchedule.presetId);
      times.push(...presetTimes);
    }

    if (daySchedule.customTimes && daySchedule.customTimes.length > 0) {
      const customTimes = daySchedule.customTimes.map(entry => entry.time);
      times.push(...customTimes);
    }

    // Sort times chronologically and remove duplicates
    times = [...new Set(times)].sort();

    // Limit to 30 slots per day as per device specification
    if (times.length > 30) {
      console.warn(`Day ${dayName} has ${times.length} slots, truncating to 30`);
      times = times.slice(0, 30);
    }

    deviceTimetable.times[dayIndex] = times;
  }

  return deviceTimetable;
}

/**
 * Calculate total payload size for validation
 */
export function calculatePayloadSize(deviceTimetable) {
  return JSON.stringify(deviceTimetable).length;
}

/**
 * Validate device timetable payload
 */
export function validateDeviceTimetable(deviceTimetable) {
  const errors = [];

  // Check payload size (device limit is 2048 bytes)
  const size = calculatePayloadSize(deviceTimetable);
  if (size > 2048) {
    errors.push(`Payload size ${size} bytes exceeds device limit of 2048 bytes`);
  }

  // Check all days are present
  for (let i = 0; i <= 6; i++) {
    if (!deviceTimetable.times.hasOwnProperty(i.toString())) {
      errors.push(`Missing day index ${i}`);
    }
  }

  // Check each day has max 30 slots
  for (const [day, times] of Object.entries(deviceTimetable.times)) {
    if (times.length > 30) {
      errors.push(`Day ${day} has ${times.length} slots, max is 30`);
    }

    // Validate time format (HH:MM)
    times.forEach((time, idx) => {
      if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
        errors.push(`Invalid time format "${time}" in day ${day} slot ${idx}`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    size
  };
}

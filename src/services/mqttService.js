import mqtt from 'mqtt';
import { config } from '../config/env.js';
import Device from '../models/Device.js';

// Global timeout for MQTT responses
const MQTT_RESPONSE_TIMEOUT = 15000; // 15 seconds
const KIGALI_TIMEZONE = 'Africa/Kigali'; // GMT+2

class MQTTService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.statusCallbacks = new Map(); // Store callbacks for status responses
    this.timeCheckCallbacks = new Map(); // Store callbacks for time checks
    this.timetableCheckCallbacks = new Map(); // Store callbacks for timetable checks
    this.deviceStatusCallbacks = new Map(); // Store callbacks for device status checks
    this.messageQueue = []; // Queue for incoming messages
    this.processingQueue = false; // Flag to prevent concurrent processing
  }

  // Connect to MQTT broker
  connect() {
    try {
      this.client = mqtt.connect(config.mqtt.brokerUrl, {
        clientId: config.mqtt.clientId,
        clean: true,
        reconnectPeriod: 1000,
      });

      this.client.on('connect', () => {
        console.log('✓ MQTT Connected to broker');
        this.connected = true;
        
        // Subscribe to all device response topics
        const subscriptions = [
          'bellbot/+/status/response',
          'ringer/timeack/+',
          'ringer/timesync/+',
          'ringer/timeres/+',
          'ringer/current/+',
          'ringer/nreq/+',
          'ringer/sync/+',
          'ringer/checkres/+'
        ];
        
        subscriptions.forEach(topic => {
          this.client.subscribe(topic, (err) => {
            if (err) {
              console.error(`Error subscribing to ${topic}:`, err);
            } else {
              console.log(`✓ Subscribed to ${topic}`);
            }
          });
        });
      });

      this.client.on('error', (error) => {
        console.error('MQTT Error:', error);
        this.connected = false;
      });

      this.client.on('close', () => {
        console.log('MQTT Connection closed');
        this.connected = false;
      });

      this.client.on('reconnect', () => {
        console.log('MQTT Reconnecting...');
      });

      this.client.on('message', (topic, message) => {
        // Add message to queue
        this.messageQueue.push({ topic, message });
        this.processQueue();
      });

    } catch (error) {
      console.error('Error connecting to MQTT broker:', error);
    }
  }

  // Process message queue
  async processQueue() {
    if (this.processingQueue || this.messageQueue.length === 0) {
      return;
    }

    this.processingQueue = true;

    while (this.messageQueue.length > 0) {
      const { topic, message } = this.messageQueue.shift();
      try {
        await this.handleMessage(topic, message);
      } catch (error) {
        console.error('Error processing queued message:', error);
      }
    }

    this.processingQueue = false;
  }

  // Handle incoming MQTT messages
  async handleMessage(topic, message) {
    try {
      // Parse topic to get device serial and message type
      const topicParts = topic.split('/');
      const protocol = topicParts[0]; // 'bellbot' or 'ringer'
      
      if (protocol === 'bellbot') {
        await this.handleBellbotMessage(topicParts, message);
      } else if (protocol === 'ringer') {
        await this.handleRingerMessage(topicParts, message);
      }
    } catch (error) {
      console.error('Error handling MQTT message:', error);
    }
  }

  // Handle bellbot protocol messages
  async handleBellbotMessage(topicParts, message) {
    const serial = topicParts[1];
    const messageType = topicParts[2];

    if (messageType === 'status' && topicParts[3] === 'response') {
      const payload = JSON.parse(message.toString());
      console.log(`Status response from ${serial}:`, payload);
      
      // Update device lastSeen
      await this.updateDeviceLastSeen(serial);
      
      // Call any registered callbacks for this device
      const callback = this.statusCallbacks.get(serial);
      if (callback) {
        callback(payload);
        this.statusCallbacks.delete(serial);
      }
    }
  }

  // Handle ringer protocol messages
  async handleRingerMessage(topicParts, message) {
    const messageType = topicParts[1];
    const serial = topicParts[2];
    
    // Update device lastSeen for all messages
    await this.updateDeviceLastSeen(serial);

    switch (messageType) {
      case 'timeack':
        await this.handleTimeAck(serial, message);
        break;
      
      case 'timesync':
        await this.handleTimeSync(serial, message);
        break;
      
      case 'timeres':
        await this.handleTimeResponse(serial, message);
        break;
      
      case 'current':
        await this.handleCurrentTimetable(serial, message);
        break;
      
      case 'nreq':
        await this.handleTimestampRequest(serial);
        break;
      
      case 'sync':
        await this.handleSyncRequest(serial);
        break;
      
      case 'checkres':
        await this.handleDeviceStatusResponse(serial, message);
        break;
      
      default:
        console.log(`Unknown message type: ${messageType} from ${serial}`);
    }
  }

  // Update device lastSeen timestamp
  async updateDeviceLastSeen(serial) {
    try {
      const result = await Device.findOneAndUpdate(
        { serial },
        { lastSeen: new Date() },
        { new: true }
      );
      
      if (!result) {
        console.warn(`⚠️ Device ${serial} not found in database - ignoring message`);
        return false;
      }
      return true;
    } catch (error) {
      console.error(`Error updating lastSeen for ${serial}:`, error);
      return false;
    }
  }

  // Handle time acknowledgment - mark device as time synced
  async handleTimeAck(serial, message) {
    try {
      const payload = JSON.parse(message.toString());
      console.log(`Time ack from ${serial}:`, payload);
      
      const device = await Device.findOneAndUpdate(
        { serial },
        { timeSynced: true },
        { new: true }
      );
      
      if (!device) {
        console.warn(`⚠️ Device ${serial} not found in database - cannot update time sync status`);
        return;
      }
    } catch (error) {
      console.error(`Error handling time ack for ${serial}:`, error);
    }
  }

  // Handle time sync from device - check and respond if needed
  async handleTimeSync(serial, message) {
    try {
      const payload = JSON.parse(message.toString());
      const deviceTime = new Date(payload.time);
      const serverTime = new Date();
      
      console.log(`Time sync from ${serial}:`, payload);
      
      // Check if device exists
      const device = await Device.findOne({ serial });
      if (!device) {
        console.warn(`⚠️ Device ${serial} not found in database - ignoring time sync`);
        return;
      }
      
      // Check if device time is within 1 minute of server time
      const timeDiff = Math.abs(serverTime - deviceTime);
      const oneMinute = 60 * 1000;
      
      if (timeDiff > oneMinute) {
        console.log(`Device ${serial} time drift: ${Math.round(timeDiff / 1000)}s, sending sync`);
        this.publishTimeUpdate(serial);
      } else {
        console.log(`Device ${serial} time OK (drift: ${Math.round(timeDiff / 1000)}s)`);
        await Device.findOneAndUpdate(
          { serial },
          { timeSynced: true }
        );
      }
    } catch (error) {
      console.error(`Error handling time sync for ${serial}:`, error);
    }
  }

  // Handle time response from device
  async handleTimeResponse(serial, message) {
    try {
      const payload = JSON.parse(message.toString());
      console.log(`Time response from ${serial}:`, payload);
      
      const callback = this.timeCheckCallbacks.get(serial);
      if (callback) {
        callback(payload);
        this.timeCheckCallbacks.delete(serial);
      }
    } catch (error) {
      console.error(`Error handling time response for ${serial}:`, error);
    }
  }

  // Handle current timetable response from device
  async handleCurrentTimetable(serial, message) {
    try {
      const payload = JSON.parse(message.toString());
      console.log(`Current timetable from ${serial}:`, payload);
      
      // Update device with current timetable ID
      const device = await Device.findOneAndUpdate(
        { serial },
        { currentTimetableId: payload.id },
        { new: true }
      );
      
      if (!device) {
        console.warn(`⚠️ Device ${serial} not found in database - cannot update timetable ID`);
      }
      
      const callback = this.timetableCheckCallbacks.get(serial);
      if (callback) {
        callback(payload);
        this.timetableCheckCallbacks.delete(serial);
      }
    } catch (error) {
      console.error(`Error handling current timetable for ${serial}:`, error);
    }
  }

  // Handle timestamp request from device
  async handleTimestampRequest(serial) {
    try {
      console.log(`Timestamp request from ${serial}`);
      
      // Find device's school timetable
      const device = await Device.findOne({ serial }).populate('schoolId');
      if (!device || !device.schoolId) {
        console.error(`Device ${serial} not found or no school assigned`);
        return;
      }

      // Import here to avoid circular dependency
      const Timetable = (await import('../models/Timetable.js')).default;
      const timetable = await Timetable.findOne({ schoolId: device.schoolId._id });
      
      if (timetable) {
        this.publishTimestampResponse(serial, timetable.updatedAt);
      }
    } catch (error) {
      console.error(`Error handling timestamp request for ${serial}:`, error);
    }
  }

  // Handle sync request from device - auto-publish timetable
  async handleSyncRequest(serial) {
    try {
      console.log(`Sync request from ${serial} - auto-syncing timetable`);
      
      // Find device and populate school
      const device = await Device.findOne({ serial }).populate('schoolId');
      if (!device) {
        console.error(`Device ${serial} not found in database`);
        return;
      }
      
      if (!device.schoolId) {
        console.error(`Device ${serial} has no school assigned`);
        return;
      }
      
      // Import Timetable model and transformer
      const Timetable = (await import('../models/Timetable.js')).default;
      const { transformTimetableForDevice } = await import('../utils/timetableTransformer.js');
      
      // Get school's timetable
      const timetable = await Timetable.findOne({ schoolId: device.schoolId._id });
      if (!timetable) {
        console.warn(`No timetable found for school ${device.schoolId.name} (${device.schoolId._id})`);
        return;
      }
      
      // Transform to device format
      const deviceTimetable = await transformTimetableForDevice(timetable, device.schoolId);
      
      // Publish to device
      const success = this.publishTimetableToDevice(serial, deviceTimetable);
      if (success) {
        console.log(`✓ Auto-synced timetable to ${serial} (${deviceTimetable.times['1']?.length || 0} Monday slots)`);
        
        // Update device's current timetable ID
        await Device.findOneAndUpdate(
          { serial },
          { currentTimetableId: deviceTimetable.id }
        );
      }
    } catch (error) {
      console.error(`Error handling sync request for ${serial}:`, error);
    }
  }

  // Handle comprehensive device status response
  async handleDeviceStatusResponse(serial, message) {
    try {
      const payload = JSON.parse(message.toString());
      console.log(`Device status response from ${serial}:`, payload);
      
      // Update device status and wait for completion
      const device = await Device.findOneAndUpdate(
        { serial },
        {
          isOnline: true,
          isSilenced: payload.silence,
          currentTimetableId: payload.id,
          lastStatusCheck: new Date()
        },
        { new: true }
      );
      
      if (!device) {
        console.warn(`⚠️ Device ${serial} not found in database - cannot update status`);
        const callback = this.deviceStatusCallbacks.get(serial);
        if (callback) {
          callback({ error: 'Device not found in database' });
          this.deviceStatusCallbacks.delete(serial);
        }
        return;
      }
      
      console.log(`✓ Device ${serial} status updated in DB: online=${device.isOnline}, silenced=${device.isSilenced}, timetable=${device.currentTimetableId}`);
      
      // Call callback after DB update is complete
      const callback = this.deviceStatusCallbacks.get(serial);
      if (callback) {
        callback(payload);
        this.deviceStatusCallbacks.delete(serial);
      }
    } catch (error) {
      console.error(`Error handling device status response for ${serial}:`, error);
      const callback = this.deviceStatusCallbacks.get(serial);
      if (callback) {
        callback({ error: 'Database update failed' });
        this.deviceStatusCallbacks.delete(serial);
      }
    }
  }

  // Publish timetable to device (ringer protocol)
  publishTimetableToDevice(serial, deviceTimetable) {
    if (!this.connected || !this.client) {
      console.error('MQTT not connected');
      return false;
    }

    try {
      const topic = `ringer/timetable/${serial}`;
      const payload = JSON.stringify(deviceTimetable);

      this.client.publish(topic, payload, { qos: 1, retain: false }, (err) => {
        if (err) {
          console.error(`Error publishing timetable to ${serial}:`, err);
        } else {
          console.log(`✓ Timetable published to ${serial}`);
        }
      });

      return true;
    } catch (error) {
      console.error('Error publishing timetable:', error);
      return false;
    }
  }

  // Publish timestamp response to device
  publishTimestampResponse(serial, updatedAt) {
    if (!this.connected || !this.client) {
      console.error('MQTT not connected');
      return false;
    }

    try {
      const topic = `ringer/nres/${serial}`;
      const payload = JSON.stringify({
        updatedAt: updatedAt.toISOString()
      });

      this.client.publish(topic, payload, { qos: 1 }, (err) => {
        if (err) {
          console.error(`Error publishing timestamp to ${serial}:`, err);
        } else {
          console.log(`✓ Timestamp published to ${serial}`);
        }
      });

      return true;
    } catch (error) {
      console.error('Error publishing timestamp:', error);
      return false;
    }
  }

  // Publish schedule to device
  publishSchedule(serial, weeklySchedule) {
    if (!this.connected || !this.client) {
      console.error('MQTT not connected');
      return false;
    }

    try {
      const topic = `bellbot/${serial}/schedule`;
      const payload = JSON.stringify({
        weeklySchedule,
        effectiveDate: new Date().toISOString()
      });

      this.client.publish(topic, payload, { qos: 1, retain: true }, (err) => {
        if (err) {
          console.error(`Error publishing schedule to ${serial}:`, err);
        } else {
          console.log(`✓ Schedule published to ${serial}`);
        }
      });

      return true;
    } catch (error) {
      console.error('Error publishing schedule:', error);
      return false;
    }
  }

  // Publish manual ring command (ringer protocol)
  publishRing(serial, duration = 5) {
    if (!this.connected || !this.client) {
      console.error('MQTT not connected');
      return false;
    }

    try {
      const topic = `ringer/ring/${serial}`;
      const payload = JSON.stringify({});

      this.client.publish(topic, payload, { qos: 1 }, (err) => {
        if (err) {
          console.error(`Error publishing ring command to ${serial}:`, err);
        } else {
          console.log(`✓ Ring command published to ${serial}`);
        }
      });

      return true;
    } catch (error) {
      console.error('Error publishing ring command:', error);
      return false;
    }
  }

  // Publish time update (ringer protocol with GMT+2 Kigali time)
  publishTimeUpdate(serial) {
    if (!this.connected || !this.client) {
      console.error('MQTT not connected');
      return false;
    }

    try {
      const topic = `ringer/time/${serial}`;
      
      // Get current time in GMT+2 (Kigali)
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: KIGALI_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      
      const parts = formatter.formatToParts(new Date());
      const dateParts = {};
      parts.forEach(({ type, value }) => {
        dateParts[type] = value;
      });
      
      const kigaliTimeString = `${dateParts.year}-${dateParts.month}-${dateParts.day}T${dateParts.hour}:${dateParts.minute}:${dateParts.second}`;
      
      const payload = JSON.stringify({
        time: kigaliTimeString // Format: 2026-01-22T14:30:00
      });

      this.client.publish(topic, payload, { qos: 1 }, (err) => {
        if (err) {
          console.error(`Error publishing time update to ${serial}:`, err);
        } else {
          console.log(`✓ Time update published to ${serial}: ${kigaliTimeString}`);
        }
      });

      return true;
    } catch (error) {
      console.error('Error publishing time update:', error);
      return false;
    }
  }

  // Request device time
  publishTimeRequest(serial, callback = null) {
    if (!this.connected || !this.client) {
      console.error('MQTT not connected');
      return false;
    }

    try {
      const topic = `ringer/timereq/${serial}`;
      const payload = JSON.stringify({});

      // Register callback if provided
      if (callback) {
        this.timeCheckCallbacks.set(serial, callback);
        
        // Set timeout to clear callback
        setTimeout(() => {
          if (this.timeCheckCallbacks.has(serial)) {
            this.timeCheckCallbacks.delete(serial);
            callback({ error: 'No response from device', timeout: true });
          }
        }, MQTT_RESPONSE_TIMEOUT);
      }

      this.client.publish(topic, payload, { qos: 1 }, (err) => {
        if (err) {
          console.error(`Error publishing time request to ${serial}:`, err);
        } else {
          console.log(`✓ Time request published to ${serial}`);
        }
      });

      return true;
    } catch (error) {
      console.error('Error publishing time request:', error);
      return false;
    }
  }

  // Request current timetable
  publishTimetableRequest(serial, callback = null) {
    if (!this.connected || !this.client) {
      console.error('MQTT not connected');
      return false;
    }

    try {
      const topic = `ringer/creq/${serial}`;
      const payload = JSON.stringify({});

      // Register callback if provided
      if (callback) {
        this.timetableCheckCallbacks.set(serial, callback);
        
        // Set timeout to clear callback
        setTimeout(() => {
          if (this.timetableCheckCallbacks.has(serial)) {
            this.timetableCheckCallbacks.delete(serial);
            callback({ error: 'No response from device', timeout: true });
          }
        }, MQTT_RESPONSE_TIMEOUT);
      }

      this.client.publish(topic, payload, { qos: 1 }, (err) => {
        if (err) {
          console.error(`Error publishing timetable request to ${serial}:`, err);
        } else {
          console.log(`✓ Timetable request published to ${serial}`);
        }
      });

      return true;
    } catch (error) {
      console.error('Error publishing timetable request:', error);
      return false;
    }
  }

  // Enable silent mode
  publishSilentOn(serial) {
    if (!this.connected || !this.client) {
      console.error('MQTT not connected');
      return false;
    }

    try {
      const topic = `ringer/off/${serial}`;
      const payload = JSON.stringify({});

      this.client.publish(topic, payload, { qos: 1 }, (err) => {
        if (err) {
          console.error(`Error publishing silent ON to ${serial}:`, err);
        } else {
          console.log(`✓ Silent mode ON published to ${serial}`);
        }
      });

      return true;
    } catch (error) {
      console.error('Error publishing silent ON:', error);
      return false;
    }
  }

  // Disable silent mode
  publishSilentOff(serial) {
    if (!this.connected || !this.client) {
      console.error('MQTT not connected');
      return false;
    }

    try {
      const topic = `ringer/on/${serial}`;
      const payload = JSON.stringify({});

      this.client.publish(topic, payload, { qos: 1 }, (err) => {
        if (err) {
          console.error(`Error publishing silent OFF to ${serial}:`, err);
        } else {
          console.log(`✓ Silent mode OFF published to ${serial}`);
        }
      });

      return true;
    } catch (error) {
      console.error('Error publishing silent OFF:', error);
      return false;
    }
  }

  // Request comprehensive device status
  publishDeviceStatusRequest(serial, callback = null) {
    if (!this.connected || !this.client) {
      console.error('MQTT not connected');
      return false;
    }

    try {
      const topic = `ringer/checkreq/${serial}`;
      const payload = JSON.stringify({});

      // Register callback if provided
      if (callback) {
        this.deviceStatusCallbacks.set(serial, callback);
        
        // Set timeout to clear callback
        setTimeout(() => {
          if (this.deviceStatusCallbacks.has(serial)) {
            this.deviceStatusCallbacks.delete(serial);
            callback({ error: 'No response from device', timeout: true });
          }
        }, MQTT_RESPONSE_TIMEOUT);
      }

      this.client.publish(topic, payload, { qos: 0 }, (err) => {
        if (err) {
          console.error(`Error publishing device status request to ${serial}:`, err);
        } else {
          console.log(`✓ Device status request published to ${serial}`);
        }
      });

      return true;
    } catch (error) {
      console.error('Error publishing device status request:', error);
      return false;
    }
  }

  // Publish schedule to device
  publishSchedule(serial, weeklySchedule) {
    if (!this.connected || !this.client) {
      console.error('MQTT not connected');
      return false;
    }

    try {
      const topic = `bellbot/${serial}/schedule`;
      const payload = JSON.stringify({
        weeklySchedule,
        effectiveDate: new Date().toISOString()
      });

      this.client.publish(topic, payload, { qos: 1, retain: true }, (err) => {
        if (err) {
          console.error(`Error publishing schedule to ${serial}:`, err);
        } else {
          console.log(`✓ Schedule published to ${serial}`);
        }
      });

      return true;
    } catch (error) {
      console.error('Error publishing schedule:', error);
      return false;
    }
  }

  // Publish status request (bellbot protocol - legacy)
  publishStatusRequest(serial, callback = null) {
    if (!this.connected || !this.client) {
      console.error('MQTT not connected');
      return false;
    }

    try {
      const topic = `bellbot/${serial}/status/request`;
      const payload = JSON.stringify({
        command: 'status',
        timestamp: new Date().toISOString()
      });

      // Register callback if provided
      if (callback) {
        this.statusCallbacks.set(serial, callback);
        
        // Set timeout to clear callback
        setTimeout(() => {
          if (this.statusCallbacks.has(serial)) {
            this.statusCallbacks.delete(serial);
            callback({ error: 'No response from device' });
          }
        }, 5000);
      }

      this.client.publish(topic, payload, { qos: 1 }, (err) => {
        if (err) {
          console.error(`Error publishing status request to ${serial}:`, err);
        } else {
          console.log(`✓ Status request published to ${serial}`);
        }
      });

      return true;
    } catch (error) {
      console.error('Error publishing status request:', error);
      return false;
    }
  }

  // Disconnect from broker
  disconnect() {
    if (this.client) {
      this.client.end();
      this.connected = false;
      console.log('MQTT Disconnected');
    }
  }

  // Check if connected
  isConnected() {
    return this.connected;
  }
}

// Export singleton instance
export const mqttService = new MQTTService();

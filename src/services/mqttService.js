import mqtt from 'mqtt';
import { config } from '../config/env.js';

class MQTTService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.statusCallbacks = new Map(); // Store callbacks for status responses
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
        
        // Subscribe to all status response topics
        this.client.subscribe('bellbot/+/status/response', (err) => {
          if (err) {
            console.error('Error subscribing to status responses:', err);
          } else {
            console.log('✓ Subscribed to status response topics');
          }
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
        this.handleMessage(topic, message);
      });

    } catch (error) {
      console.error('Error connecting to MQTT broker:', error);
    }
  }

  // Handle incoming MQTT messages
  handleMessage(topic, message) {
    try {
      // Parse topic to get device serial
      const topicParts = topic.split('/');
      const serial = topicParts[1];
      const messageType = topicParts[2];

      if (messageType === 'status' && topicParts[3] === 'response') {
        const payload = JSON.parse(message.toString());
        console.log(`Status response from ${serial}:`, payload);
        
        // Call any registered callbacks for this device
        const callback = this.statusCallbacks.get(serial);
        if (callback) {
          callback(payload);
          this.statusCallbacks.delete(serial);
        }
      }
    } catch (error) {
      console.error('Error handling MQTT message:', error);
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

  // Publish manual ring command
  publishRing(serial, duration = 5) {
    if (!this.connected || !this.client) {
      console.error('MQTT not connected');
      return false;
    }

    try {
      const topic = `bellbot/${serial}/ring`;
      const payload = JSON.stringify({
        command: 'ring',
        duration,
        timestamp: new Date().toISOString()
      });

      this.client.publish(topic, payload, { qos: 1 }, (err) => {
        if (err) {
          console.error(`Error publishing ring command to ${serial}:`, err);
        } else {
          console.log(`✓ Ring command published to ${serial} (${duration}s)`);
        }
      });

      return true;
    } catch (error) {
      console.error('Error publishing ring command:', error);
      return false;
    }
  }

  // Publish time update
  publishTimeUpdate(serial) {
    if (!this.connected || !this.client) {
      console.error('MQTT not connected');
      return false;
    }

    try {
      const topic = `bellbot/${serial}/time`;
      const payload = JSON.stringify({
        command: 'sync_time',
        serverTime: new Date().toISOString()
      });

      this.client.publish(topic, payload, { qos: 1 }, (err) => {
        if (err) {
          console.error(`Error publishing time update to ${serial}:`, err);
        } else {
          console.log(`✓ Time update published to ${serial}`);
        }
      });

      return true;
    } catch (error) {
      console.error('Error publishing time update:', error);
      return false;
    }
  }

  // Publish status request
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
        
        // Set timeout to clear callback after 5 seconds
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

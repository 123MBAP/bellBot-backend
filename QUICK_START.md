# BellBot Backend - Quick Start Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **MongoDB** (v6 or higher)
- **Mosquitto MQTT Broker** (v2 or higher)

## Installation Steps

### 1. Install Dependencies

```bash
cd Ring-Backend
npm install
```

### 2. Configure Environment

The `.env` file is already created with default settings. Update if needed:

```bash
# Default configuration (already set)
PORT=5000
MONGODB_URI=mongodb://localhost:27017/bellbot
MQTT_BROKER_URL=mqtt://localhost:1883
JWT_SECRET=bellbot-super-secret-jwt-key-2026-change-in-production
```

### 3. Start MongoDB

**Windows (if installed as service):**
```bash
net start MongoDB
```

**macOS/Linux:**
```bash
sudo systemctl start mongod
```

**Docker (alternative):**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 4. Start Mosquitto MQTT Broker

**Windows:**
```bash
# If installed as service
net start mosquitto

# Or run directly
mosquitto -v
```

**macOS:**
```bash
brew services start mosquitto
```

**Linux:**
```bash
sudo systemctl start mosquitto
```

**Docker (alternative):**
```bash
docker run -d -p 1883:1883 --name mosquitto eclipse-mosquitto
```

### 5. Seed the Database (First Time Only)

```bash
npm run seed
```

This will create sample data including:
- 6 schools
- 5 users (admin, managers, ringers)
- 8 devices
- Preset timetables
- Default timetables

**Sample Credentials Created:**
- Admin: `admin@bellbot.com` / `admin123`
- Manager: `manager1@bellbot.com` / `manager123`
- Ringer: `ringer1@bellbot.com` / `ringer123`

### 6. Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on http://localhost:5000

### 7. Verify Installation

Check health endpoint:
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "OK",
  "mongodb": "connected",
  "mqtt": "connected",
  "timestamp": "2026-01-11T..."
}
```

## Testing the API

### 1. Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bellbot.com","password":"admin123"}'
```

Copy the token from the response.

### 2. Get Schools (Protected Route)

```bash
curl http://localhost:5000/api/schools \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 3. Get Devices

```bash
curl http://localhost:5000/api/devices \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Connecting Frontend

Update your React frontend to point to the backend:

**In Ring-App, create/update `.env`:**
```
VITE_API_URL=http://localhost:5000/api
```

**Update AuthContext or create an API service:**
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Login example
const response = await fetch(`${API_URL}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
```

## Troubleshooting

### MongoDB Connection Error

**Error:** `MongoServerError: connect ECONNREFUSED`

**Solution:**
- Verify MongoDB is running: `mongosh` (should connect)
- Check connection string in `.env`

### MQTT Connection Error

**Error:** `MQTT Error: connect ECONNREFUSED`

**Solution:**
- Verify Mosquitto is running: `mosquitto_sub -t '#' -v`
- Check broker URL in `.env`
- On Linux, check firewall: `sudo ufw allow 1883`

### Port Already in Use

**Error:** `Error: listen EADDRINUSE: address already in use :::5000`

**Solution:**
- Change PORT in `.env` file
- Or kill process using port 5000:
  ```bash
  # Windows
  netstat -ano | findstr :5000
  taskkill /PID <PID> /F
  
  # macOS/Linux
  lsof -ti:5000 | xargs kill -9
  ```

### JWT Token Expired

**Error:** `Token expired`

**Solution:**
- Login again to get a new token
- Tokens expire after 24 hours by default
- Update JWT_EXPIRE in `.env` if needed

## Development Tips

### Watch MongoDB Changes

```bash
mongosh bellbot
db.users.find().pretty()
db.devices.find().pretty()
```

### Monitor MQTT Messages

```bash
# Subscribe to all topics
mosquitto_sub -t 'bellbot/#' -v

# Subscribe to specific device
mosquitto_sub -t 'bellbot/BELL1001/#' -v
```

### Publish Test MQTT Message

```bash
# Manual ring
mosquitto_pub -t 'bellbot/BELL1001/ring' \
  -m '{"command":"ring","duration":5,"timestamp":"2026-01-11T10:30:00Z"}'

# Status request
mosquitto_pub -t 'bellbot/BELL1001/status/request' \
  -m '{"command":"status","timestamp":"2026-01-11T10:30:00Z"}'
```

### Reset Database

```bash
# Clear all data and reseed
npm run seed
```

## Project Structure

```
Ring-Backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Express middleware
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── services/        # Business logic (MQTT)
│   └── server.js        # Main entry point
├── .env                 # Environment variables
├── seed.js              # Database seeder
└── package.json         # Dependencies
```

## Next Steps

1. ✅ Backend is running
2. 📱 Connect your React frontend
3. 🔔 Test device ring commands
4. 📅 Create and manage timetables
5. 👥 Add more users and schools
6. 🔧 Configure MQTT for real bell devices

## Support

For API documentation, see `API_DOCUMENTATION.md`

For issues or questions:
- Check logs in the terminal
- Verify all services are running (MongoDB, Mosquitto)
- Test endpoints using curl or Postman

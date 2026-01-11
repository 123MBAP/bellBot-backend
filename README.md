# BellBot Backend API

Backend server for the BellBot School Bell Management System.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT + bcryptjs
- **Messaging**: MQTT (Mosquitto)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration

4. Make sure MongoDB and Mosquitto are running

5. Start development server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/forgot-password` - Request password reset
- `GET /api/auth/forgot-password-requests` - List password reset requests (admin)
- `PUT /api/auth/forgot-password-requests/:id` - Process password reset (admin)

### Schools (Admin only)
- `GET /api/schools` - List all schools
- `POST /api/schools` - Create school
- `GET /api/schools/:id` - Get school details
- `PUT /api/schools/:id` - Update school
- `DELETE /api/schools/:id` - Delete school

### Devices
- `GET /api/devices` - List devices
- `POST /api/devices` - Register device (admin)
- `GET /api/devices/:id` - Get device details
- `PUT /api/devices/:id` - Update device (admin)
- `DELETE /api/devices/:id` - Delete device (admin)
- `POST /api/devices/:id/assign` - Assign device to user (admin)
- `DELETE /api/devices/:id/assign/:userId` - Unassign user (admin)
- `POST /api/devices/:id/ring` - Manual ring
- `POST /api/devices/:id/status` - Check device status
- `POST /api/devices/:id/update-time` - Update device time (admin)
- `PUT /api/devices/:id/silence` - Toggle silence

### Users (Admin only)
- `GET /api/users` - List all users
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Timetables
- `GET /api/timetables/school/:schoolId` - Get school timetable
- `PUT /api/timetables/school/:schoolId/day/:day` - Update day schedule
- `GET /api/timetables/presets` - List presets
- `POST /api/timetables/presets` - Create preset
- `PUT /api/timetables/presets/:id` - Update preset
- `DELETE /api/timetables/presets/:id` - Delete preset
- `POST /api/timetables/special-day` - Create special day
- `DELETE /api/timetables/special-day/:date` - Delete special day

## MQTT Topics

- `bellbot/{serial}/schedule` - Schedule updates
- `bellbot/{serial}/ring` - Manual ring commands
- `bellbot/{serial}/time` - Time sync updates
- `bellbot/{serial}/status/request` - Status requests
- `bellbot/{serial}/status/response` - Status responses

## License

ISC

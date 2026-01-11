# BellBot API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Authentication Endpoints

### Login
```http
POST /api/auth/login
```

**Body:**
```json
{
  "email": "admin@bellbot.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "_id": "user_id",
    "email": "admin@bellbot.com",
    "name": "Admin User",
    "role": "admin",
    "schoolId": null
  }
}
```

### Change Password
```http
POST /api/auth/change-password
```

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword"
}
```

### Forgot Password Request
```http
POST /api/auth/forgot-password
```

**Body:**
```json
{
  "email": "user@bellbot.com",
  "reason": "Cannot remember password"
}
```

### Get Password Reset Requests (Admin)
```http
GET /api/auth/forgot-password-requests
```

**Headers:** `Authorization: Bearer <admin_token>`

### Process Password Reset Request (Admin)
```http
PUT /api/auth/forgot-password-requests/:id
```

**Headers:** `Authorization: Bearer <admin_token>`

**Body (Approve):**
```json
{
  "action": "approve",
  "newPassword": "TempPass123"
}
```

**Body (Reject):**
```json
{
  "action": "reject",
  "rejectionReason": "Invalid request"
}
```

---

## School Management (Admin Only)

### Get All Schools
```http
GET /api/schools
```

**Headers:** `Authorization: Bearer <admin_token>`

### Get School by ID
```http
GET /api/schools/:id
```

**Headers:** `Authorization: Bearer <admin_token>`

### Create School
```http
POST /api/schools
```

**Headers:** `Authorization: Bearer <admin_token>`

**Body:**
```json
{
  "name": "New School Name"
}
```

### Update School
```http
PUT /api/schools/:id
```

**Headers:** `Authorization: Bearer <admin_token>`

**Body:**
```json
{
  "name": "Updated School Name"
}
```

### Delete School
```http
DELETE /api/schools/:id
```

**Headers:** `Authorization: Bearer <admin_token>`

---

## Device Management

### Get All Devices
```http
GET /api/devices
```

**Headers:** `Authorization: Bearer <token>`

*Note: Non-admin users only see devices from their school*

### Get Device by ID
```http
GET /api/devices/:id
```

**Headers:** `Authorization: Bearer <token>`

### Create Device (Admin)
```http
POST /api/devices
```

**Headers:** `Authorization: Bearer <admin_token>`

**Body:**
```json
{
  "serial": "BELL2001",
  "schoolId": "school_id_here",
  "location": "Main Hall",
  "model": "Premium Bell"
}
```

### Update Device (Admin)
```http
PUT /api/devices/:id
```

**Headers:** `Authorization: Bearer <admin_token>`

**Body:**
```json
{
  "serial": "BELL2001",
  "location": "Updated Location",
  "model": "Premium Bell"
}
```

### Delete Device (Admin)
```http
DELETE /api/devices/:id
```

**Headers:** `Authorization: Bearer <admin_token>`

### Assign Device to User (Admin)
```http
POST /api/devices/:id/assign
```

**Headers:** `Authorization: Bearer <admin_token>`

**Body:**
```json
{
  "userId": "user_id_here"
}
```

### Unassign Device from User (Admin)
```http
DELETE /api/devices/:id/assign/:userId
```

**Headers:** `Authorization: Bearer <admin_token>`

### Manual Ring Device
```http
POST /api/devices/:id/ring
```

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "duration": 5
}
```

*Note: Duration in seconds (default: 5)*

### Check Device Status
```http
POST /api/devices/:id/status
```

**Headers:** `Authorization: Bearer <token>`

### Update Device Time (Admin)
```http
POST /api/devices/:id/update-time
```

**Headers:** `Authorization: Bearer <admin_token>`

### Toggle Device Silence (Admin/Manager)
```http
PUT /api/devices/:id/silence
```

**Headers:** `Authorization: Bearer <token>`

---

## User Management (Admin Only)

### Get All Users
```http
GET /api/users
```

**Headers:** `Authorization: Bearer <admin_token>`

### Get User by ID
```http
GET /api/users/:id
```

**Headers:** `Authorization: Bearer <admin_token>`

### Create User
```http
POST /api/users
```

**Headers:** `Authorization: Bearer <admin_token>`

**Body:**
```json
{
  "email": "newuser@bellbot.com",
  "password": "password123",
  "name": "New User",
  "role": "manager",
  "schoolId": "school_id_here"
}
```

*Note: role can be "admin", "manager", or "ringer". Admin users don't need schoolId.*

### Update User
```http
PUT /api/users/:id
```

**Headers:** `Authorization: Bearer <admin_token>`

**Body:**
```json
{
  "email": "updated@bellbot.com",
  "name": "Updated Name",
  "role": "manager",
  "schoolId": "school_id_here"
}
```

### Delete User
```http
DELETE /api/users/:id
```

**Headers:** `Authorization: Bearer <admin_token>`

---

## Timetable Management

### Get School Timetable
```http
GET /api/timetables/school/:schoolId
```

**Headers:** `Authorization: Bearer <token>`

### Update Day Schedule (Admin/Manager)
```http
PUT /api/timetables/school/:schoolId/day/:day
```

**Headers:** `Authorization: Bearer <token>`

*Note: day must be one of: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday*

**Body (Using Custom Times):**
```json
{
  "presetId": null,
  "customTimes": [
    { "time": "08:30", "duration": 5, "label": "First Bell" },
    { "time": "12:00", "duration": 5, "label": "Lunch" },
    { "time": "15:30", "duration": 5, "label": "End of Day" }
  ]
}
```

**Body (Using Preset):**
```json
{
  "presetId": "preset_id_here",
  "customTimes": []
}
```

### Get Preset Timetables
```http
GET /api/timetables/presets
```

**Headers:** `Authorization: Bearer <token>`

### Create Preset Timetable (Admin/Manager)
```http
POST /api/timetables/presets
```

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "schoolId": "school_id_here",
  "name": "Regular Schedule",
  "description": "Standard weekday schedule",
  "times": [
    { "time": "08:30", "duration": 5, "label": "First Bell" },
    { "time": "10:30", "duration": 5, "label": "Break" },
    { "time": "12:00", "duration": 5, "label": "Lunch" },
    { "time": "15:30", "duration": 5, "label": "End of Day" }
  ]
}
```

### Update Preset Timetable (Admin/Manager)
```http
PUT /api/timetables/presets/:id
```

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "name": "Updated Schedule Name",
  "description": "Updated description",
  "times": [
    { "time": "08:00", "duration": 5, "label": "Early Bell" }
  ]
}
```

### Delete Preset Timetable (Admin/Manager)
```http
DELETE /api/timetables/presets/:id
```

**Headers:** `Authorization: Bearer <token>`

### Create Special Day Timetable (Admin/Manager)
```http
POST /api/timetables/special-day
```

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "schoolId": "school_id_here",
  "date": "2026-01-15",
  "times": [
    { "time": "09:00", "duration": 5, "label": "Special Event Start" },
    { "time": "12:00", "duration": 5, "label": "Event End" }
  ]
}
```

### Delete Special Day Timetable (Admin/Manager)
```http
DELETE /api/timetables/special-day/:date?schoolId=school_id_here
```

**Headers:** `Authorization: Bearer <token>`

---

## Health Check

### Check API Health
```http
GET /health
```

**Response:**
```json
{
  "status": "OK",
  "mongodb": "connected",
  "mqtt": "connected",
  "timestamp": "2026-01-11T10:30:00.000Z"
}
```

---

## Error Responses

All endpoints return consistent error responses:

**400 Bad Request:**
```json
{
  "message": "Error description"
}
```

**401 Unauthorized:**
```json
{
  "message": "Not authorized, no token"
}
```

**403 Forbidden:**
```json
{
  "message": "User role 'ringer' is not authorized to access this route"
}
```

**404 Not Found:**
```json
{
  "message": "Resource not found"
}
```

**500 Server Error:**
```json
{
  "message": "Server error description"
}
```

---

## Rate Limiting

- **General API calls:** 100 requests per minute per user
- **Login attempts:** 5 attempts per 15 minutes per IP
- **MQTT operations (manual rings):** 20 requests per minute per user

When rate limit is exceeded:
```json
{
  "message": "Too many requests from this IP, please try again later"
}
```

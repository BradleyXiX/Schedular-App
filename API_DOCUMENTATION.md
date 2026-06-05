# Scheduler API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### Authentication Routes

#### Register User
- **POST** `/auth/register`
- **Body:**
  ```json
  {
    "username": "string (3-50 chars, alphanumeric)",
    "email": "string (valid email)",
    "password": "string (min 8 chars, must contain uppercase, lowercase, numbers)"
  }
  ```
- **Response:** 201 Created
  ```json
  {
    "message": "User registered successfully",
    "user": { "id": 1, "username": "john", "email": "john@example.com" },
    "token": "JWT_TOKEN"
  }
  ```

#### Login User
- **POST** `/auth/login`
- **Rate Limit:** 5 requests per 15 minutes
- **Body:**
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Response:** 200 OK
  ```json
  {
    "message": "Login successful",
    "user": { "id": 1, "username": "john", "email": "john@example.com" },
    "token": "JWT_TOKEN"
  }
  ```

### Schedule Routes
*All endpoints require authentication*
- **Rate Limit:** 100 requests per minute
- **Create Rate Limit:** 20 requests per minute

#### Get All Schedules
- **GET** `/schedules`
- **Response:** 200 OK
  ```json
  [
    {
      "id": 1,
      "user_id": 1,
      "title": "Team Meeting",
      "description": "Weekly sync",
      "start_time": "2026-06-05T10:00:00Z",
      "end_time": "2026-06-05T11:00:00Z",
      "status": "active",
      "created_at": "2026-06-05T09:00:00Z",
      "updated_at": "2026-06-05T09:00:00Z"
    }
  ]
  ```

#### Get Single Schedule
- **GET** `/schedules/:id`
- **Response:** 200 OK (same as above)

#### Create Schedule
- **POST** `/schedules`
- **Body:**
  ```json
  {
    "title": "string (3-255 chars, required)",
    "description": "string (optional, max 1000 chars)",
    "start_time": "ISO 8601 datetime (required)",
    "end_time": "ISO 8601 datetime (required, must be after start_time)"
  }
  ```
- **Response:** 201 Created

#### Update Schedule
- **PUT** `/schedules/:id`
- **Body:** Same as create (all fields optional)
- **Status Options:** `active`, `completed`, `cancelled`
- **Response:** 200 OK

#### Delete Schedule
- **DELETE** `/schedules/:id`
- **Response:** 200 OK
  ```json
  {
    "message": "Schedule deleted successfully",
    "id": 1
  }
  ```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "error": "Access token required" 
}
```

### 403 Forbidden
```json
{
  "error": "Invalid or expired token"
}
```

### 404 Not Found
```json
{
  "error": "Route not found" or "Schedule not found"
}
```

### 429 Too Many Requests
```json
{
  "error": "Too many requests, please try again later"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error"
}
```

## Testing with cURL

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

### Create Schedule (replace TOKEN with actual token)
```bash
curl -X POST http://localhost:5000/api/schedules \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "title": "Team Meeting",
    "description": "Weekly sync",
    "start_time": "2026-06-05T10:00:00Z",
    "end_time": "2026-06-05T11:00:00Z"
  }'
```

## Logging
- All requests are logged to `logs/app-YYYY-MM-DD.log`
- Errors are logged to `logs/error-YYYY-MM-DD.log`
- User activities are logged to `logs/activity-YYYY-MM-DD.log`

# 🔐 Authentication API Testing Guide

Test all authentication endpoints using **curl**, **Postman**, or **Thunder Client** (VS Code extension).

**Base URL**: `http://localhost:5000/api`

---

## 📝 Test Endpoints

### 1. Health Check (Server Status)

```bash
curl http://localhost:5000/api/health
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2026-01-26T..."
}
```

---

### 2. Register New User

**POST** `/api/auth/register`

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tafsir Rahman",
    "email": "tafsir@shwapnerthikana.com",
    "password": "SecurePass123!",
    "phone": "+8801712345678",
    "role": "customer"
  }'
```

**Response**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "...",
      "name": "Tafsir Rahman",
      "email": "tafsir@shwapnerthikana.com",
      "phone": "+8801712345678",
      "role": "customer"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 3. Login User

**POST** `/api/auth/login`

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tafsir@shwapnerthikana.com",
    "password": "SecurePass123!"
  }'
```

**Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "...",
      "name": "Tafsir Rahman",
      "email": "tafsir@shwapnerthikana.com",
      "phone": "+8801712345678",
      "role": "customer",
      "avatar": null,
      "isVerified": false
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 4. Get Current User Profile (Protected)

**GET** `/api/auth/me`

**Required**: Authorization header with JWT token

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Response**:
```json
{
  "success": true,
  "message": "User profile retrieved",
  "data": {
    "user": {
      "id": "...",
      "name": "Tafsir Rahman",
      "email": "tafsir@shwapnerthikana.com",
      "phone": "+8801712345678",
      "role": "customer",
      "savedProperties": [],
      "savedSearches": [],
      "isActive": true,
      "isVerified": false,
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

---

### 5. Update User Profile (Protected)

**PUT** `/api/auth/profile`

```bash
curl -X PUT http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tafsir Rahman Updated",
    "phone": "+8801798765432"
  }'
```

**Response**:
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      ...updated user data
    }
  }
}
```

---

### 6. Forgot Password (Request Reset Token)

**POST** `/api/auth/forgot-password`

```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tafsir@shwapnerthikana.com"
  }'
```

**Response (Development Mode)**:
```json
{
  "success": true,
  "message": "Password reset link sent to email",
  "data": {
    "resetToken": "abcd1234...",
    "resetUrl": "http://localhost:3000/reset-password?token=abcd1234..."
  }
}
```

**Note**: In production, reset token will only be sent via email.

---

### 7. Reset Password (With Token)

**POST** `/api/auth/reset-password`

```bash
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_RESET_TOKEN_HERE",
    "newPassword": "NewSecurePass123!"
  }'
```

**Response**:
```json
{
  "success": true,
  "message": "Password reset successful",
  "data": {
    "user": {
      "id": "...",
      "name": "Tafsir Rahman",
      "email": "tafsir@shwapnerthikana.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 8. Change Password (Protected, for logged-in users)

**POST** `/api/auth/change-password`

```bash
curl -X POST http://localhost:5000/api/auth/change-password \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "SecurePass123!",
    "newPassword": "NewPassword456!"
  }'
```

**Response**:
```json
{
  "success": true,
  "message": "Password changed successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## 🧪 Complete Test Flow

### 1. Register a New User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@test.com",
    "password": "Test1234!",
    "phone": "+8801700000000"
  }'
```

**Save the token from response for next requests!**

### 2. Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.com",
    "password": "Test1234!"
  }'
```

### 3. Get Profile (Replace TOKEN)

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Update Profile

```bash
curl -X PUT http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User Updated",
    "phone": "+8801711111111"
  }'
```

---

## ❌ Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Password must be at least 8 characters long",
    "Please provide a valid email"
  ]
}
```

### Unauthorized (401)
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

### User Already Exists (400)
```json
{
  "success": false,
  "message": "User with this email already exists"
}
```

### Invalid Credentials (401)
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

## 🔑 Using Postman

### Setup:

1. **Create Collection**: "shwapner Thikana API"
2. **Add Environment**: 
   - Variable: `baseUrl` = `http://localhost:5000/api`
   - Variable: `token` = (will be set automatically)

### Save Token Automatically:

In **Tests** tab of login/register request:
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("token", response.data.token);
}
```

### Use Token in Protected Routes:

Authorization → Type: **Bearer Token**  
Token: `{{token}}`

---

## 🧪 Testing with Thunder Client (VS Code)

1. Install "Thunder Client" extension
2. Create new request
3. Set method (POST, GET, PUT)
4. Enter URL: `http://localhost:5000/api/auth/register`
5. Set Headers:
   ```
   Content-Type: application/json
   ```
6. Set Body (JSON):
   ```json
   {
     "name": "Test User",
     "email": "test@test.com",
     "password": "Test1234!"
   }
   ```
7. Click **Send**

---

## 📊 Database Verification

Check if users are created in MongoDB Atlas:

1. Go to MongoDB Atlas dashboard
2. Browse Collections → `shwapner-thikana` → `users`
3. See registered users

---

## ✅ Authentication Features Implemented

- [x] User registration with validation
- [x] User login with JWT
- [x] Password hashing (bcrypt, 12 rounds)
- [x] JWT token generation (7 days expiry)
- [x] Get current user profile
- [x] Update user profile
- [x] Forgot password with reset token
- [x] Reset password with token validation
- [x] Change password for logged-in users
- [x] Input validation with express-validator
- [x] Error handling
- [x] Account deactivation check
- [x] Role-based user creation

---

## 🚀 Next Steps

1. Test all endpoints  
2. Create property endpoints
3. Implement agent profile features
4. Add email service integration
5. Create user management endpoints (admin)

---

**Created**: January 26, 2026  
**Backend Running**: http://localhost:5000  
**Database**: MongoDB Atlas (shwapner-thikana)

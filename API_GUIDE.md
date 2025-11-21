# Investment Tracker API Guide

A comprehensive guide to using the Investment Tracker API, including authentication, endpoints, and testing examples.

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
- [Testing in Development](#testing-in-development)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

---

## Overview

The Investment Tracker API is a RESTful API built with Node.js, Express, and TypeScript. It provides endpoints for managing investment portfolios across Brazil and USA with multi-currency support.

**Base URL (Development):** `http://localhost:3001/api/v1`

**API Documentation:** `http://localhost:3001/api-docs` (Swagger UI)

**Key Features:**
- JWT-based authentication
- Multi-currency portfolio management (BRL/USD)
- Investment tracking with monthly snapshots
- Tax calculations for Brazilian investments
- Dashboard analytics
- Exchange rate management

---

## Getting Started

### Prerequisites

1. Node.js 18+ installed
2. Backend server running on port 3001
3. Database migrations completed

### Setup Steps

1. **Install dependencies:**
```bash
cd backend
npm install
```

2. **Configure environment variables:**
```bash
cp .env.example .env
```

3. **Generate a secure JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy the output and update `JWT_SECRET` in `.env` file.

4. **Run database migrations:**
```bash
npm run migrate
```

5. **Start the development server:**
```bash
npm run dev
```

The API will be available at `http://localhost:3001/api/v1`

---

## Authentication

The API uses **JWT (JSON Web Tokens)** for authentication. Most endpoints require a valid JWT token in the Authorization header.

### Authentication Flow

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       │ 1. Register/Login
       ▼
┌─────────────┐
│     API     │
└──────┬──────┘
       │
       │ 2. Return JWT Token
       ▼
┌─────────────┐
│   Client    │
│  (stores    │
│   token)    │
└──────┬──────┘
       │
       │ 3. Subsequent requests with
       │    Authorization: Bearer <token>
       ▼
┌─────────────┐
│     API     │
│  (validates │
│   token)    │
└─────────────┘
```

### Step 1: Register a New User

**Endpoint:** `POST /api/v1/auth/register`

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123",
  "name": "John Doe"
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

**Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "email": "john.doe@example.com",
      "name": "John Doe",
      "role": "USER",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiam9obi5kb2VAZXhhbXBsZS5jb20iLCJyb2xlIjoiVVNFUiIsImlhdCI6MTcwNTMxNjQwMCwiZXhwIjoxNzA1OTIxMjAwfQ...."
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123",
    "name": "John Doe"
  }'
```

### Step 2: Login

**Endpoint:** `POST /api/v1/auth/login`

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "email": "john.doe@example.com",
      "name": "John Doe",
      "role": "USER",
      "isActive": true,
      "lastLogin": "2024-01-15T10:35:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123"
  }'
```

### Step 3: Use the Token

Include the token in the `Authorization` header for all protected endpoints:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example Authenticated Request:**
```bash
curl -X GET http://localhost:3001/api/v1/investments \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Token Management

**Token Expiry:** Default is 7 days (configurable via `JWT_EXPIRY` in `.env`)

**Verify Token:**
```bash
curl -X GET http://localhost:3001/api/v1/auth/verify \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Get User Profile:**
```bash
curl -X GET http://localhost:3001/api/v1/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Change Password:**
```bash
curl -X POST http://localhost:3001/api/v1/auth/change-password \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "SecurePass123",
    "newPassword": "NewSecurePass456"
  }'
```

---

## API Endpoints

### Authentication Endpoints (Public)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login user |
| GET | `/api/v1/auth/verify` | Verify token validity |
| GET | `/api/v1/auth/profile` | Get current user profile |
| PUT | `/api/v1/auth/profile` | Update user profile |
| POST | `/api/v1/auth/change-password` | Change password |

### Investment Endpoints (Protected)

All investment endpoints require authentication.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/investments` | List all investments |
| POST | `/api/v1/investments` | Create new investment |
| GET | `/api/v1/investments/:id` | Get investment by ID |
| PUT | `/api/v1/investments/:id` | Update investment |
| DELETE | `/api/v1/investments/:id` | Delete investment |
| GET | `/api/v1/investments/codigo/:codigo` | Get investment by codigo |
| GET | `/api/v1/investments/summary` | Get investments summary |
| GET | `/api/v1/investments/upcoming-maturities` | Get upcoming maturities |
| GET | `/api/v1/investments/search?q=term` | Search investments |
| POST | `/api/v1/investments/:id/mark-done` | Mark investment as done |

### Snapshot Endpoints (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/snapshots/monthly` | Get monthly snapshots |
| GET | `/api/v1/snapshots/investment/:id` | Get snapshots for investment |
| POST | `/api/v1/snapshots` | Create snapshot |
| POST | `/api/v1/snapshots/bulk-update` | Bulk update snapshots |

### Exchange Rate Endpoints (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/exchange-rates/current` | Get current exchange rate |
| GET | `/api/v1/exchange-rates/history` | Get historical rates |
| POST | `/api/v1/exchange-rates` | Create/update exchange rate |

### Dashboard Endpoints (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/dashboard/summary` | Get dashboard summary |
| GET | `/api/v1/dashboard/evolution` | Get portfolio evolution |
| GET | `/api/v1/dashboard/allocation` | Get asset allocation |

---

## Testing in Development

### Option 1: Using cURL

#### Complete Workflow Example

**1. Register a user:**
```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123",
    "name": "Test User"
  }'
```

**2. Save the token from the response:**
```bash
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**3. Create an investment:**
```bash
curl -X POST http://localhost:3001/api/v1/investments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "country": "BR",
    "account": "Nubank",
    "description": "Tesouro Selic 2025",
    "type": "TREASURY",
    "codigo": "TS-2025",
    "status": "ACTIVE",
    "purchaseDate": "2024-01-01",
    "purchaseValueOriginal": 10000.00,
    "purchaseCurrency": "BRL",
    "maturityDate": "2025-12-31",
    "notes": "Low risk investment"
  }'
```

**4. List all investments:**
```bash
curl -X GET http://localhost:3001/api/v1/investments \
  -H "Authorization: Bearer $TOKEN"
```

**5. Get investment by ID:**
```bash
curl -X GET http://localhost:3001/api/v1/investments/1 \
  -H "Authorization: Bearer $TOKEN"
```

**6. Update an investment:**
```bash
curl -X PUT http://localhost:3001/api/v1/investments/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "country": "BR",
    "account": "Nubank",
    "description": "Tesouro Selic 2025 - Updated",
    "type": "TREASURY",
    "status": "ACTIVE",
    "purchaseValueOriginal": 12000.00
  }'
```

**7. Create a snapshot:**
```bash
curl -X POST http://localhost:3001/api/v1/snapshots \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "investmentId": 1,
    "snapshotDate": "2024-01-31",
    "valueOriginal": 10150.50,
    "currency": "BRL",
    "status": "ACTIVE"
  }'
```

**8. Get dashboard summary:**
```bash
curl -X GET http://localhost:3001/api/v1/dashboard/summary \
  -H "Authorization: Bearer $TOKEN"
```

**9. Create exchange rate:**
```bash
curl -X POST http://localhost:3001/api/v1/exchange-rates \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-01-15",
    "rate": 4.95,
    "type": "OFFICIAL",
    "source": "Banco Central"
  }'
```

**10. Get current exchange rate:**
```bash
curl -X GET http://localhost:3001/api/v1/exchange-rates/current \
  -H "Authorization: Bearer $TOKEN"
```

### Option 2: Using Swagger UI (Recommended)

Swagger UI provides an interactive interface for testing all endpoints.

**Steps:**

1. **Open Swagger UI:**
   - Navigate to `http://localhost:3001/api-docs`

2. **Authenticate:**
   - Click the "Authorize" button (top right)
   - Register/Login to get a token (use the auth endpoints)
   - Enter `Bearer YOUR_TOKEN_HERE` in the value field
   - Click "Authorize" then "Close"

3. **Test Endpoints:**
   - Click on any endpoint to expand it
   - Click "Try it out"
   - Fill in the required parameters
   - Click "Execute"
   - View the response

**Swagger Features:**
- Auto-generated documentation from code
- Interactive API testing
- Request/response examples
- Schema validation
- Persistent authorization across requests

### Option 3: Using Postman

**Setup Collection:**

1. Create a new collection: "Investment Tracker API"
2. Set base URL variable: `{{baseUrl}}` = `http://localhost:3001/api/v1`
3. Add authentication:
   - Type: Bearer Token
   - Token: `{{authToken}}`

**Sample Requests:**

**Register:**
- Method: POST
- URL: `{{baseUrl}}/auth/register`
- Body (JSON):
```json
{
  "email": "test@example.com",
  "password": "TestPass123",
  "name": "Test User"
}
```
- Script (Tests tab):
```javascript
if (pm.response.code === 201) {
    pm.collectionVariables.set("authToken", pm.response.json().data.token);
}
```

**Get Investments:**
- Method: GET
- URL: `{{baseUrl}}/investments`
- Authorization: Bearer Token (uses `{{authToken}}` automatically)

### Option 4: Using HTTPie

HTTPie is a user-friendly command-line HTTP client.

**Install:**
```bash
pip install httpie
```

**Examples:**

**Register:**
```bash
http POST http://localhost:3001/api/v1/auth/register \
  email=test@example.com \
  password=TestPass123 \
  name="Test User"
```

**Login and save token:**
```bash
export TOKEN=$(http POST http://localhost:3001/api/v1/auth/login \
  email=test@example.com \
  password=TestPass123 | jq -r '.data.token')
```

**Create investment:**
```bash
http POST http://localhost:3001/api/v1/investments \
  Authorization:"Bearer $TOKEN" \
  country=BR \
  account=Nubank \
  description="Tesouro Selic" \
  type=TREASURY \
  status=ACTIVE
```

**List investments:**
```bash
http GET http://localhost:3001/api/v1/investments \
  Authorization:"Bearer $TOKEN"
```

### Option 5: Testing Scripts

Create a test script for automated testing:

**test-api.sh:**
```bash
#!/bin/bash

BASE_URL="http://localhost:3001/api/v1"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "=== Investment Tracker API Test ==="

# 1. Register
echo -e "\n${GREEN}1. Registering new user...${NC}"
REGISTER_RESPONSE=$(curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test'$(date +%s)'@example.com",
    "password": "TestPass123",
    "name": "Test User"
  }')

echo $REGISTER_RESPONSE | jq .

# Extract token
TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.data.token')

if [ "$TOKEN" = "null" ]; then
  echo -e "${RED}Registration failed!${NC}"
  exit 1
fi

echo -e "${GREEN}Token received: ${TOKEN:0:20}...${NC}"

# 2. Create Investment
echo -e "\n${GREEN}2. Creating investment...${NC}"
INVESTMENT_RESPONSE=$(curl -s -X POST $BASE_URL/investments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "country": "BR",
    "account": "Test Account",
    "description": "Test Investment",
    "type": "CDB",
    "status": "ACTIVE",
    "purchaseDate": "2024-01-01",
    "purchaseValueOriginal": 10000,
    "purchaseCurrency": "BRL"
  }')

echo $INVESTMENT_RESPONSE | jq .

INVESTMENT_ID=$(echo $INVESTMENT_RESPONSE | jq -r '.data.id')

# 3. List Investments
echo -e "\n${GREEN}3. Listing investments...${NC}"
curl -s -X GET $BASE_URL/investments \
  -H "Authorization: Bearer $TOKEN" | jq .

# 4. Get Dashboard
echo -e "\n${GREEN}4. Getting dashboard summary...${NC}"
curl -s -X GET $BASE_URL/dashboard/summary \
  -H "Authorization: Bearer $TOKEN" | jq .

# 5. Create Snapshot
echo -e "\n${GREEN}5. Creating snapshot...${NC}"
curl -s -X POST $BASE_URL/snapshots \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "investmentId": '$INVESTMENT_ID',
    "snapshotDate": "2024-01-31",
    "valueOriginal": 10100,
    "currency": "BRL"
  }' | jq .

echo -e "\n${GREEN}=== Test Complete ===${NC}"
```

**Make it executable and run:**
```bash
chmod +x test-api.sh
./test-api.sh
```

---

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "msg": "Detailed error message",
      "param": "field_name",
      "location": "body"
    }
  ]
}
```

### Common HTTP Status Codes

| Status Code | Meaning | Example |
|-------------|---------|---------|
| 200 | OK | Successful GET, PUT requests |
| 201 | Created | Successful POST (resource created) |
| 400 | Bad Request | Validation errors |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Valid token but insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource (e.g., email already exists) |
| 500 | Internal Server Error | Server-side error |

### Common Error Scenarios

**1. Invalid Token:**
```json
{
  "success": false,
  "message": "Invalid token"
}
```

**2. Token Expired:**
```json
{
  "success": false,
  "message": "Token has expired"
}
```

**3. Validation Error:**
```json
{
  "success": false,
  "errors": [
    {
      "msg": "Valid email is required",
      "param": "email",
      "location": "body"
    },
    {
      "msg": "Password must be at least 8 characters long",
      "param": "password",
      "location": "body"
    }
  ]
}
```

**4. Resource Not Found:**
```json
{
  "success": false,
  "message": "Investment not found"
}
```

**5. Duplicate Resource:**
```json
{
  "success": false,
  "message": "User with this email already exists"
}
```

---

## Best Practices

### Security

1. **Never commit tokens or secrets:**
   - Use environment variables
   - Add `.env` to `.gitignore`

2. **Generate strong JWT secrets:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **Use HTTPS in production:**
   - Never send tokens over unencrypted connections

4. **Implement token refresh:**
   - Consider implementing refresh tokens for long-lived sessions

5. **Store tokens securely:**
   - Use secure, httpOnly cookies or secure storage in mobile apps
   - Don't store in localStorage for web apps (XSS vulnerability)

### Performance

1. **Use pagination for large datasets:**
   ```bash
   curl -X GET "http://localhost:3001/api/v1/investments?page=1&limit=20" \
     -H "Authorization: Bearer $TOKEN"
   ```
   (Note: Pagination to be implemented)

2. **Filter data on the server:**
   - Use query parameters to filter
   - Don't fetch all data and filter on client

3. **Cache frequently accessed data:**
   - Cache exchange rates
   - Cache dashboard summaries

### Data Validation

1. **Always validate input:**
   - API validates all inputs
   - Client-side validation is a UX enhancement, not security

2. **Use proper data types:**
   - Dates: ISO 8601 format (`YYYY-MM-DD`)
   - Currencies: 3-letter codes (`BRL`, `USD`)
   - Decimal values: Use numbers, not strings

3. **Handle errors gracefully:**
   - Check response status codes
   - Parse error messages
   - Provide user-friendly feedback

### Development Workflow

1. **Use Swagger UI for exploration:**
   - Great for understanding API structure
   - Test endpoints interactively

2. **Create test scripts for regression:**
   - Automate common workflows
   - Test after making changes

3. **Monitor API logs:**
   ```bash
   tail -f backend/logs/combined.log
   ```

4. **Use version control:**
   - Commit working code
   - Use feature branches
   - Write descriptive commit messages

### Testing Checklist

- [ ] User registration works
- [ ] User login works
- [ ] Token is valid for authenticated requests
- [ ] Token expires after configured time
- [ ] Invalid tokens are rejected
- [ ] CRUD operations work for investments
- [ ] Snapshots can be created and retrieved
- [ ] Dashboard shows correct summary
- [ ] Exchange rates can be updated
- [ ] Validation errors are clear and helpful
- [ ] 404 errors for non-existent resources
- [ ] 401 errors for unauthenticated requests

---

## Troubleshooting

### Common Issues

**1. "Connection refused" error:**
- Check if backend server is running: `npm run dev`
- Verify port 3001 is not in use: `lsof -i :3001`

**2. "Invalid token" error:**
- Token may have expired (default: 7 days)
- Login again to get a new token
- Check token is properly formatted in header

**3. "User not found" error:**
- User may not be registered
- Check email spelling
- Try registering a new user

**4. Database errors:**
- Run migrations: `npm run migrate`
- Check database file exists: `ls backend/data/investments.db`

**5. Validation errors:**
- Check request body matches required format
- Ensure required fields are included
- Verify data types (dates, numbers, etc.)

### Debug Mode

Enable detailed logging:

**In `.env`:**
```
LOG_LEVEL=debug
NODE_ENV=development
```

**View logs:**
```bash
# Real-time logs
tail -f backend/logs/combined.log

# Error logs only
tail -f backend/logs/error.log
```

---

## Additional Resources

- **Swagger UI:** `http://localhost:3001/api-docs`
- **API JSON Spec:** `http://localhost:3001/api-docs.json`
- **Health Check:** `http://localhost:3001/health`
- **GitHub Repository:** [Link to repo]
- **Issue Tracker:** [Link to issues]

---

## Support

For questions, issues, or contributions:

1. Check the [README.md](README.md) for general information
2. Review the [API Documentation](http://localhost:3001/api-docs)
3. Open an issue on GitHub
4. Contact the development team

---

**Last Updated:** January 2025
**API Version:** 1.0.0

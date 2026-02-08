# FREIP API Documentation

## Base URL
`http://localhost:3001/api`

## Authentication
All authenticated endpoints require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

---

## Authentication Endpoints

### 1. Register User
**POST** `/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+923001234567",
  "role_id": "investor"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "role": "investor"
  }
}
```

### 2. Login
**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "role": "investor",
    "kyc_status": "verified"
  }
}
```

### 3. Verify Token
**GET** `/auth/verify-token`

**Response:**
```json
{
  "valid": true,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "role": "investor"
  }
}
```

---

## User Endpoints

### 1. Get Profile
**GET** `/users/profile`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+923001234567",
  "role": "investor",
  "kyc_status": "verified",
  "kyc_level": 2,
  "wallet_balance": 500000,
  "created_at": "2024-01-15T10:30:00Z"
}
```

### 2. Update Profile
**PUT** `/users/profile`

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+923001234567"
}
```

### 3. Get Wallet
**GET** `/users/wallet`

**Response:**
```json
{
  "wallet_balance": 500000,
  "currency": "PKR"
}
```

---

## Property Endpoints

### 1. Get All Properties
**GET** `/properties?city=Lahore&property_type=residential&status=active`

**Query Parameters:**
- `city` (optional): City name
- `property_type` (optional): residential, commercial, industrial
- `status` (optional): draft, pending, active, funded, closed

**Response:**
```json
{
  "count": 5,
  "properties": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Modern Apartment",
      "address": "Gulberg, Lahore",
      "city": "Lahore",
      "property_type": "residential",
      "area_sqft": 2500,
      "total_value": 5000000,
      "funding_target": 2500000,
      "funding_raised": 1500000,
      "min_investment": 100000,
      "max_investment": 500000,
      "expected_returns_annual": 12.5,
      "rental_yield": 8.5,
      "status": "active",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### 2. Get Property Detail
**GET** `/properties/:id`

**Response:** Property object with additional fields:
```json
{
  "...property_fields",
  "investor_count": 15,
  "total_invested": 1500000
}
```

### 3. Create Property (Seller only)
**POST** `/properties`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "Modern Apartment",
  "description": "Beautiful residential apartment in Gulberg",
  "location": {"latitude": 31.5497, "longitude": 74.3436},
  "address": "Block H, Gulberg, Lahore",
  "city": "Lahore",
  "property_type": "residential",
  "area_sqft": 2500,
  "total_value": 5000000,
  "funding_target": 2500000,
  "min_investment": 100000,
  "max_investment": 500000,
  "expected_returns_annual": 12.5,
  "rental_yield": 8.5
}
```

### 4. Update Property (Seller only)
**PUT** `/properties/:id`

**Request Body:** (Any field to update)
```json
{
  "title": "Updated Title",
  "status": "pending"
}
```

---

## Investment Endpoints

### 1. Create Investment
**POST** `/investments`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "property_id": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 500000
}
```

**Response:**
```json
{
  "message": "Investment successful",
  "investment": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "investor_id": "550e8400-e29b-41d4-a716-446655440001",
    "property_id": "550e8400-e29b-41d4-a716-446655440000",
    "amount_invested": 500000,
    "shares": 10.5,
    "ownership_percentage": 2.5,
    "investment_date": "2024-02-08T10:30:00Z",
    "status": "active"
  }
}
```

### 2. Get Investor Portfolio
**GET** `/investments/portfolio`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "total_invested": 2500000,
  "total_returns": 375000,
  "current_value": 2875000,
  "investment_count": 12,
  "portfolio": [
    {
      "...investment_fields",
      "property": {
        "title": "Modern Apartment",
        "city": "Lahore",
        "status": "active"
      }
    }
  ]
}
```

### 3. Get Property Investors
**GET** `/investments/:property_id/investors`

**Response:**
```json
{
  "property_id": "550e8400-e29b-41d4-a716-446655440000",
  "investor_count": 15,
  "total_raised": 1500000,
  "funding_target": 2500000,
  "funding_percentage": 60,
  "investments": [...]
}
```

---

## Transaction Endpoints

### 1. Deposit Funds
**POST** `/transactions/deposit`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "amount": 500000,
  "payment_method": "card",
  "gateway": "stripe"
}
```

### 2. Withdraw Funds
**POST** `/transactions/withdraw`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "amount": 250000
}
```

### 3. Get Transaction History
**GET** `/transactions/history`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "summary": {
    "total_deposits": 1500000,
    "total_withdrawals": 200000,
    "total_investments": 2500000,
    "total_dividends": 375000
  },
  "transactions": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "type": "investment",
      "amount": 500000,
      "status": "completed",
      "gateway": "internal",
      "created_at": "2024-01-20T10:30:00Z"
    }
  ]
}
```

---

## Admin Endpoints

### 1. List Users
**GET** `/admin/users?role=investor`

**Headers:** `Authorization: Bearer <token>` (super_admin only)

**Query Parameters:**
- `role` (optional): Filter by role

**Response:**
```json
{
  "users": [...],
  "count": 15432
}
```

### 2. Get Pending Properties
**GET** `/admin/properties/pending`

**Headers:** `Authorization: Bearer <token>` (super_admin only)

**Response:**
```json
{
  "properties": [...],
  "count": 3
}
```

### 3. Approve Property
**PUT** `/admin/properties/:id/approve`

**Headers:** `Authorization: Bearer <token>` (super_admin only)

**Response:**
```json
{
  "message": "Property approved",
  "property": {
    "...property_fields",
    "status": "active"
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation error",
  "details": [
    {
      "field": "email",
      "message": "\"email\" must be a valid email"
    }
  ]
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
  "error": "Access denied. Required roles: super_admin"
}
```

### 404 Not Found
```json
{
  "error": "Property not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "Error details"
}
```

---

## Rate Limiting

- 100 requests per minute per IP
- 1000 requests per hour per user

---

## Version
API Version: 1.0.0
Last Updated: February 2024

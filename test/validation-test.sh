#!/bin/bash

BASE_URL="http://localhost:5000/users/api/v1/web/register"

echo "Testing Website Registration Validation..."

# 1. Missing fields
echo -e "\n1. Testing Missing Fields:"
curl -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{}' | jq .

# 2. Invalid Email
echo -e "\n2. Testing Invalid Email:"
curl -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "invalid-email",
    "phone": "+14155552671",
    "password": "password123",
    "cPassword": "password123"
  }' | jq .

# 3. Password Mismatch
echo -e "\n3. Testing Password Mismatch:"
curl -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+14155552671",
    "password": "password123",
    "cPassword": "password456"
  }' | jq .

# 4. Valid Request
echo -e "\n4. Testing Valid Request:"
curl -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+14155552671",
    "password": "password123",
    "cPassword": "password123"
  }' | jq .

# 6. Check Users
echo -e "\n6. Listing Users:"
curl -X GET "http://localhost:5000/users" | jq .

# 5. Duplicate Email
echo -e "\n5. Testing Duplicate Email:"
curl -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+14155552672",
    "password": "password123",
    "cPassword": "password123"
  }' | jq .

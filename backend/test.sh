#!/bin/bash

echo "🧪 SmartPark Backend Test Suite"
echo "================================"
echo ""

API_URL="http://localhost:3001"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Test function
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local expected_code=$5
    
    echo -n "Testing: $name... "
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" == "$expected_code" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code)"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC} (Expected $expected_code, got $http_code)"
        ((FAILED++))
    fi
}

echo "1️⃣  Testing Health & Basic Endpoints"
echo "──────────────────────────────────────"
test_endpoint "Health Check" "GET" "/health" "" "200"
test_endpoint "API Root" "GET" "/" "" "200"
test_endpoint "Get All Spots" "GET" "/api/spots" "" "200"
test_endpoint "Get Statistics" "GET" "/api/spots/statistics" "" "200"

echo ""
echo "2️⃣  Testing Authentication"
echo "──────────────────────────────────────"

# Generate random email
RANDOM_EMAIL="test$(date +%s)@test.com"

signup_data="{\"email\":\"$RANDOM_EMAIL\",\"password\":\"test123\",\"fullName\":\"Test User\"}"
signup_response=$(curl -s -X POST "$API_URL/api/auth/signup" \
    -H "Content-Type: application/json" \
    -d "$signup_data")

if echo "$signup_response" | grep -q "token"; then
    echo -e "Testing: Signup... ${GREEN}✓ PASSED${NC}"
    ((PASSED++))
    TOKEN=$(echo "$signup_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
else
    echo -e "Testing: Signup... ${RED}✗ FAILED${NC}"
    ((FAILED++))
fi

login_data="{\"email\":\"$RANDOM_EMAIL\",\"password\":\"test123\"}"
login_response=$(curl -s -X POST "$API_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "$login_data")

if echo "$login_response" | grep -q "token"; then
    echo -e "Testing: Login... ${GREEN}✓ PASSED${NC}"
    ((PASSED++))
else
    echo -e "Testing: Login... ${RED}✗ FAILED${NC}"
    ((FAILED++))
fi

echo ""
echo "3️⃣  Testing Analytics Endpoints"
echo "──────────────────────────────────────"
test_endpoint "Predict Availability" "GET" "/api/analytics/predict?spotId=1&horizon=30" "" "200"
test_endpoint "Get Best Spots" "GET" "/api/analytics/predict/best?limit=5" "" "200"
test_endpoint "Get Spot Pricing" "GET" "/api/analytics/pricing?spotId=1" "" "200"

echo ""
echo "4️⃣  Testing Spot Endpoints"
echo "──────────────────────────────────────"
test_endpoint "Get Spot by ID" "GET" "/api/spots/1" "" "200"
test_endpoint "Filter by Zone" "GET" "/api/spots?zone=downtown" "" "200"
test_endpoint "Filter Available" "GET" "/api/spots?available=true" "" "200"

echo ""
echo "5️⃣  Testing Sensor Update"
echo "──────────────────────────────────────"
sensor_data='{"spotId":1,"isOccupied":true}'
test_endpoint "Update Sensor" "POST" "/api/spots/sensor-update" "$sensor_data" "200"

echo ""
echo "6️⃣  Testing Protected Endpoints (Reservations)"
echo "──────────────────────────────────────"

if [ -n "$TOKEN" ]; then
    # Test with token
    future_start=$(date -u -d "+2 hours" +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u -v+2H +"%Y-%m-%dT%H:%M:%SZ")
    future_end=$(date -u -d "+4 hours" +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u -v+4H +"%Y-%m-%dT%H:%M:%SZ")
    
    reservation_data="{\"spotId\":5,\"startTime\":\"$future_start\",\"endTime\":\"$future_end\"}"
    
    reservation_response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/reservations" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d "$reservation_data")
    
    http_code=$(echo "$reservation_response" | tail -n1)
    
    if [ "$http_code" == "201" ]; then
        echo -e "Testing: Create Reservation... ${GREEN}✓ PASSED${NC} (HTTP $http_code)"
        ((PASSED++))
    else
        echo -e "Testing: Create Reservation... ${RED}✗ FAILED${NC} (Expected 201, got $http_code)"
        ((FAILED++))
    fi
    
    # Test get reservations
    get_reservations=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/api/reservations" \
        -H "Authorization: Bearer $TOKEN")
    
    http_code=$(echo "$get_reservations" | tail -n1)
    
    if [ "$http_code" == "200" ]; then
        echo -e "Testing: Get Reservations... ${GREEN}✓ PASSED${NC} (HTTP $http_code)"
        ((PASSED++))
    else
        echo -e "Testing: Get Reservations... ${RED}✗ FAILED${NC} (Expected 200, got $http_code)"
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⚠ Skipping protected endpoint tests (no token)${NC}"
fi

echo ""
echo "7️⃣  Testing Error Handling"
echo "──────────────────────────────────────"
test_endpoint "Invalid Spot ID" "GET" "/api/spots/9999" "" "404"
test_endpoint "Missing Auth Token" "GET" "/api/reservations" "" "401"

echo ""
echo "════════════════════════════════════════"
echo "📊 Test Results"
echo "════════════════════════════════════════"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"

TOTAL=$((PASSED + FAILED))
SUCCESS_RATE=$((PASSED * 100 / TOTAL))

echo "Success Rate: $SUCCESS_RATE%"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Backend is working perfectly!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed. Check the output above.${NC}"
    exit 1
fi

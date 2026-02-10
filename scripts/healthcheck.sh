#!/usr/bin/env bash
# Health check script for all services
set -euo pipefail

API_URL="${API_URL:-http://localhost:8080}"
WEB_URL="${WEB_URL:-http://localhost:3000}"

echo "=== Syntiant Atlas Health Check ==="
echo ""

# API Health
echo -n "API ($API_URL/api/health): "
if curl -sf "$API_URL/api/health" > /dev/null 2>&1; then
  echo "✓ OK"
else
  echo "✗ FAIL"
fi

# Web Health
echo -n "Web ($WEB_URL): "
if curl -sf "$WEB_URL" > /dev/null 2>&1; then
  echo "✓ OK"
else
  echo "✗ FAIL"
fi

# Database (via API health endpoint JSON)
echo -n "Database: "
DB_STATUS=$(curl -sf "$API_URL/api/health" 2>/dev/null | grep -o '"database":"[^"]*"' | head -1 || echo "unknown")
echo "$DB_STATUS"

# Redis (via API health endpoint JSON)
echo -n "Redis: "
REDIS_STATUS=$(curl -sf "$API_URL/api/health" 2>/dev/null | grep -o '"redis":"[^"]*"' | head -1 || echo "unknown")
echo "$REDIS_STATUS"

echo ""
echo "=== Check Complete ==="

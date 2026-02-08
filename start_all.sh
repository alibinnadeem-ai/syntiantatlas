#!/bin/bash

# SYNTIANT ATLAS Startup Script

echo "🚀 Starting SYNTIANT ATLAS Services..."

# 1. Start Landing Page (Port 3000)
echo "------------------------------------------------"
echo "🌐 Starting Landing Page on http://localhost:3000"
echo "------------------------------------------------"
cd "Landing page"
# Use nvm to ensure correct node version
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 18
npm run dev > ../landing_page.log 2>&1 &
LANDING_PID=$!
echo "✅ Landing Page started (PID: $LANDING_PID)"

cd ..

# 2. Start FREIP Backend (Port 5000/Default)
echo "------------------------------------------------"
echo "🛠️  Starting FREIP Backend"
echo "------------------------------------------------"
cd "FREIP - Fractional Real Estate Investment Platform/backend"
npm install >> ../../backend_install.log 2>&1
npm run dev > ../../freip_backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ FREIP Backend started (PID: $BACKEND_PID)"

cd ../..

# 3. Start FREIP Frontend (Port 3001)
echo "------------------------------------------------"
echo "💻 Starting FREIP Frontend on http://localhost:3001"
echo "------------------------------------------------"
cd "FREIP - Fractional Real Estate Investment Platform/frontend"
npm install >> ../../frontend_install.log 2>&1
npm run dev > ../../freip_frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✅ FREIP Frontend started (PID: $FRONTEND_PID)"

cd ../..

echo "------------------------------------------------"
echo "🎉 All services are running in the background!"
echo "------------------------------------------------"
echo "📝 Logs are being written to:"
echo "   - landing_page.log"
echo "   - freip_backend.log"
echo "   - freip_frontend.log"
echo "------------------------------------------------"
echo "👉 Landing Page: http://localhost:3000"
echo "👉 FREIP App:    http://localhost:3001"
echo "------------------------------------------------"
echo "Press Ctrl+C to stop all services."

# Wait for user input to exit
trap "kill $LANDING_PID $BACKEND_PID $FRONTEND_PID; exit" INT
wait

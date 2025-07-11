#!/bin/bash

# BRUTAL V3 Test Server
echo "🚀 Starting BRUTAL V3 Test Server..."

# Kill any existing server on port 8000
lsof -ti:8000 | xargs kill -9 2>/dev/null

# Start Python HTTP server in background
python3 -m http.server 8000 > /dev/null 2>&1 &
SERVER_PID=$!

echo "✅ Server started on http://localhost:8000"
echo "📋 Test runner: http://localhost:8000/test-runner.html"
echo "🧪 Performance test: http://localhost:8000/test-performance-gems.html"
echo ""
echo "Press Ctrl+C to stop the server"

# Function to cleanup on exit
cleanup() {
    echo -e "\n🛑 Stopping server..."
    kill $SERVER_PID 2>/dev/null
    exit 0
}

# Set up trap to cleanup on Ctrl+C
trap cleanup INT

# Keep script running
while true; do
    sleep 1
done
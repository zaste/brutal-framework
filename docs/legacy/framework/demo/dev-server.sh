#!/bin/bash
# Native Web Components Framework - Development Server

echo "🚀 Starting development server..."

# Kill existing servers
pkill -f "python -m http.server" 2>/dev/null
sleep 1

# Start server
echo "📡 Server: http://localhost:8000/"
echo "Press Ctrl+C to stop"

python -m http.server 8000
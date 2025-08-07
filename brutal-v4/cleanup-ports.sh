#!/bin/bash
# Script to identify and clean up unnecessary ports

echo "🔍 Analyzing ports in use..."
echo "================================"

# Get all listening ports
echo "Current listening ports:"
lsof -i -P -n | grep LISTEN | grep -v grep

echo -e "\n📊 Port Summary:"
echo "================================"

# Our server
our_port=$(lsof -i :8080 -P -n | grep LISTEN)
if [ ! -z "$our_port" ]; then
    echo "✅ Port 8080 - BRUTAL V4 Dev Server (KEEP)"
fi

# VS Code ports
vscode_ports=$(lsof -i -P -n | grep LISTEN | grep vscode)
if [ ! -z "$vscode_ports" ]; then
    echo "✅ VS Code system ports (KEEP - required for IDE)"
fi

echo -e "\n🧹 Cleanup recommendations:"
echo "================================"
echo "1. In GitHub Codespaces UI, go to the 'Ports' tab"
echo "2. Remove any ports that show as 'Not running' or unused"
echo "3. Keep only:"
echo "   - Port 8080 (BRUTAL V4 dev server)"
echo "   - Any VS Code system ports"
echo ""
echo "To stop BRUTAL V4 server: pkill -f 'node server.js'"
echo "To restart: cd /workspaces/web/brutal-v4 && node server.js &"
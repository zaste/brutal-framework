#!/bin/bash

echo "🧪 Testing framework demos..."
echo

# Test if server is running
if curl -s http://localhost:8080/ > /dev/null; then
    echo "✅ Server is running on port 8080"
else
    echo "❌ Server is not running"
    exit 1
fi

echo
echo "📋 Available demos:"
curl -s http://localhost:8080/showcase/demos/ | grep -E 'href="[^"]+\.html"' | sed 's/.*href="\([^"]*\)".*/- \1/' | head -10

echo
echo "🔗 Access the framework demos at:"
echo "- Main Demo: http://localhost:8080/showcase/demos/index.html"
echo "- Real Framework Test: http://localhost:8080/showcase/demos/test-real-framework.html"
echo "- Advanced Demo: http://localhost:8080/showcase/demos/advanced-demo.html"
echo "- React Comparison: http://localhost:8080/showcase/demos/react-comparison.html"
echo "- Mission Control: http://localhost:8080/showcase/demos/mission-control.html"
echo "- Playground: http://localhost:8080/showcase/playground/index.html"

echo
echo "📦 Framework structure:"
ls -la /workspaces/web/framework/core/systems/ | grep -E "\.js$"
echo
ls -la /workspaces/web/framework/core/engine/ | grep -E "\.js$"
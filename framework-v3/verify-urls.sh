#!/bin/bash

echo "🔍 Verificando URLs críticas..."
echo ""

urls=(
    "http://localhost:8000/verify-browser.html"
    "http://localhost:8000/run-all-tests.js"
    "http://localhost:8000/01-core/Component.js"
    "http://localhost:8000/01-core/State.js"
    "http://localhost:8000/01-core/Router.js"
    "http://localhost:8000/02-performance/index.js"
    "http://localhost:8000/test-suite.js"
    "http://localhost:8000/tests/01-test-component.js"
)

all_ok=true

for url in "${urls[@]}"; do
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    if [ "$response" = "200" ]; then
        echo "✅ $url - OK"
    else
        echo "❌ $url - ERROR ($response)"
        all_ok=false
    fi
done

echo ""
echo "📊 Headers para verify-browser.html:"
curl -I -s http://localhost:8000/verify-browser.html | grep -E "(Cross-Origin|Content-Type)"

echo ""
if $all_ok; then
    echo "✅ Todos los archivos están accesibles!"
    echo "🌐 Abre http://localhost:8000/verify-browser.html en tu navegador"
else
    echo "❌ Algunos archivos no están accesibles. Verifica el servidor."
fi
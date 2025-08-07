#!/bin/bash

echo "🚀 Testing Native Framework v2 Demos"
echo "===================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if demos directory exists
if [ ! -d "$(pwd)" ]; then
    echo -e "${RED}Error: Must run from demos directory${NC}"
    exit 1
fi

echo -e "\n${YELLOW}Checking demo files...${NC}"

# List of demo files to check
demos=(
    "index.html"
    "index-gallery.html"
    "gallery.html"
    "demo.js"
    "showcase/simple-working.html"
    "showcase/advanced.html"
    "showcase/advanced-demo.js"
    "showcase/mission-control.html"
    "showcase/mission-control.js"
    "showcase/react-comparison.html"
)

missing=0
for demo in "${demos[@]}"; do
    if [ -f "$demo" ]; then
        echo -e "${GREEN}✓${NC} $demo"
    else
        echo -e "${RED}✗${NC} $demo (missing)"
        missing=$((missing + 1))
    fi
done

echo -e "\n${YELLOW}Checking framework imports...${NC}"

# Check if framework modules are accessible
if [ -f "../src/index.js" ]; then
    echo -e "${GREEN}✓${NC} Framework core found"
else
    echo -e "${RED}✗${NC} Framework core missing"
    missing=$((missing + 1))
fi

# Summary
echo -e "\n${YELLOW}Summary:${NC}"
if [ $missing -eq 0 ]; then
    echo -e "${GREEN}All demos are ready!${NC}"
    echo -e "\nTo run the demos:"
    echo "1. Start a local server: python3 -m http.server 8000"
    echo "2. Open http://localhost:8000/demos/index-gallery.html"
else
    echo -e "${RED}$missing files are missing${NC}"
fi

echo -e "\n${YELLOW}Demo URLs:${NC}"
echo "- Main Hub: index-gallery.html"
echo "- Gallery: gallery.html"
echo "- Quick Demo: index.html"
echo "- Simple Demo: showcase/simple-working.html"
echo "- Advanced Demo: showcase/advanced.html"
echo "- Mission Control: showcase/mission-control.html"
echo "- React Comparison: showcase/react-comparison.html"
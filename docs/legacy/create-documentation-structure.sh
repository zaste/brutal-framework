#!/bin/bash
# create-documentation-structure.sh
# Creates optimal documentation structure for Native Web Components Framework

echo "🏗️ Creating optimal documentation structure..."

# Create main documentation hierarchy
mkdir -p documentation/{01-strategic,02-technical,03-implementation,04-progress,05-research,06-operations}

# Create strategic subcategories
mkdir -p documentation/01-strategic/archive

# Create technical subcategories
mkdir -p documentation/02-technical/research/{browser-apis,specialized-apis,api-discovery-archive}

# Create implementation subcategories  
mkdir -p documentation/03-implementation/{phases,examples}

# Create progress subcategories
mkdir -p documentation/04-progress/weekly-reports

# Create research subcategories
mkdir -p documentation/05-research/extensions

# Create operations subcategories
mkdir -p documentation/06-operations/governance

# Create archive structure
mkdir -p documentation/archive/{handshakes,context-windows,deprecated,experiments}

# Create tools directory for automation
mkdir -p tools

echo "✅ Directory structure created successfully"
echo "📊 Created directories:"
echo "   📁 documentation/01-strategic/ (business strategy)"
echo "   📁 documentation/02-technical/ (architecture & APIs)"  
echo "   📁 documentation/03-implementation/ (development guides)"
echo "   📁 documentation/04-progress/ (project tracking)"
echo "   📁 documentation/05-research/ (advanced research)"
echo "   📁 documentation/06-operations/ (project management)"
echo "   📁 documentation/archive/ (historical documents)"
echo "   📁 tools/ (automation utilities)"
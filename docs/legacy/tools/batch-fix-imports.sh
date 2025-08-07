#!/bin/bash

# Script to fix all imports in framework files

echo "🔧 Fixing imports in framework files..."

# Function to update imports in a file
fix_imports() {
    local file=$1
    echo "Processing: $file"
    
    # Update require statements to import
    sed -i "s/const { \(.*\) } = require('\(.*\)\.cjs');/import { \1 } from '\2.js';/g" "$file"
    sed -i "s/const \(.*\) = require('\(.*\)\.cjs');/import \1 from '\2.js';/g" "$file"
    
    # Fix specific path mappings
    sed -i "s|'./native-state-manager.js'|'./state-manager.js'|g" "$file"
    sed -i "s|'../native-state-manager.js'|'../state-manager.js'|g" "$file"
    sed -i "s|'./native-router.js'|'./router.js'|g" "$file"
    sed -i "s|'../native-router.js'|'../router.js'|g" "$file"
    sed -i "s|'./native-ssr-system.js'|'./ssr.js'|g" "$file"
    sed -i "s|'../native-ssr-system.js'|'../ssr.js'|g" "$file"
    sed -i "s|'./native-component-base.js'|'./component-base.js'|g" "$file"
    sed -i "s|'../native-component-base.js'|'../component-base.js'|g" "$file"
    sed -i "s|'./native-framework-core.js'|'./framework-core.js'|g" "$file"
    sed -i "s|'../native-framework-core.js'|'../framework-core.js'|g" "$file"
    sed -i "s|'./missing-base-framework.js'|'./base-framework.js'|g" "$file"
    sed -i "s|'../missing-base-framework.js'|'../base-framework.js'|g" "$file"
    
    # Fix performance files
    sed -i "s|'./event-handling-optimizer.js'|'./events.js'|g" "$file"
    sed -i "s|'../event-handling-optimizer.js'|'../events.js'|g" "$file"
    sed -i "s|'./template-optimizer.js'|'./templates.js'|g" "$file"
    sed -i "s|'../template-optimizer.js'|'../templates.js'|g" "$file"
    sed -i "s|'./performance-optimization-engine.js'|'./engine.js'|g" "$file"
    sed -i "s|'../performance-optimization-engine.js'|'../engine.js'|g" "$file"
    sed -i "s|'./shadow-dom-optimizer.js'|'./shadow-dom.js'|g" "$file"
    sed -i "s|'../shadow-dom-optimizer.js'|'../shadow-dom.js'|g" "$file"
    sed -i "s|'./css-styling-optimizer.js'|'./style.js'|g" "$file"
    sed -i "s|'../css-styling-optimizer.js'|'../style.js'|g" "$file"
    
    # Update module.exports to export
    sed -i "s/module\.exports = {/export {/g" "$file"
    sed -i "s/module\.exports = \(.*\);/export default \1;/g" "$file"
    
    # Fix any remaining .cjs extensions
    sed -i "s/\.cjs/\.js/g" "$file"
}

# Find all JS files in framework (excluding node_modules)
cd /workspaces/web/framework
files=$(find . -name "*.js" -type f -not -path "*/node_modules/*" | sort)

# Process each file
for file in $files; do
    fix_imports "$file"
done

echo "✅ Import fixing complete!"
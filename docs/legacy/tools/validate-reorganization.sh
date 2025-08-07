#!/bin/bash
# validate-reorganization.sh
# Validates the documentation reorganization progress

echo "🔍 Validating Documentation Reorganization Progress..."
echo "=================================================="

# Count files in root directory (excluding essential files)
echo "📊 ROOT DIRECTORY ANALYSIS:"
root_md_count=$(find /workspaces/web -maxdepth 1 -name "*.md" | grep -v -E "(README|QUICK-START|CLAUDE)" | wc -l)
echo "   Markdown files in root (excluding essentials): $root_md_count"

# Check for critical master documents
echo ""
echo "📋 MASTER DOCUMENTS STATUS:"
critical_files=(
    "/workspaces/web/documentation/01-strategic/STRATEGIC-MASTER.md"
    "/workspaces/web/documentation/02-technical/TECHNICAL-MASTER.md" 
    "/workspaces/web/documentation/03-implementation/IMPLEMENTATION-MASTER.md"
    "/workspaces/web/documentation/04-progress/PROGRESS-MASTER.md"
)

for file in "${critical_files[@]}"; do
    if [[ -f "$file" ]]; then
        echo "   ✅ Found: $(basename "$file")"
    else
        echo "   ❌ Missing: $(basename "$file")"
    fi
done

# Check directory structure
echo ""
echo "📁 DIRECTORY STRUCTURE:"
directories=(
    "/workspaces/web/documentation/01-strategic"
    "/workspaces/web/documentation/02-technical"
    "/workspaces/web/documentation/03-implementation"
    "/workspaces/web/documentation/04-progress"
    "/workspaces/web/documentation/05-research"
    "/workspaces/web/documentation/06-operations"
    "/workspaces/web/documentation/archive"
)

for dir in "${directories[@]}"; do
    if [[ -d "$dir" ]]; then
        file_count=$(find "$dir" -name "*.md" | wc -l)
        echo "   ✅ $dir ($file_count files)"
    else
        echo "   ❌ Missing: $dir"
    fi
done

# Check essential files preservation
echo ""
echo "🔒 ESSENTIAL FILES STATUS:"
essential_files=(
    "/workspaces/web/CLAUDE.md"
    "/workspaces/web/README.md"
    "/workspaces/web/QUICK-START.md"
)

for file in "${essential_files[@]}"; do
    if [[ -f "$file" ]]; then
        echo "   ✅ Preserved: $(basename "$file")"
    else
        echo "   ❌ Missing: $(basename "$file")"
    fi
done

# Summary statistics
echo ""
echo "📊 REORGANIZATION SUMMARY:"
total_md_files=$(find /workspaces/web -name "*.md" | grep -v "node_modules" | wc -l)
organized_files=$(find /workspaces/web/documentation -name "*.md" | wc -l)
root_remaining=$(find /workspaces/web -maxdepth 1 -name "*.md" | wc -l)

echo "   Total markdown files: $total_md_files"
echo "   Files in documentation/: $organized_files"
echo "   Files remaining in root: $root_remaining"

# Calculate organization percentage
if [[ $total_md_files -gt 0 ]]; then
    organization_percent=$((organized_files * 100 / total_md_files))
    echo "   Organization progress: $organization_percent%"
fi

echo ""
echo "✅ Validation completed!"
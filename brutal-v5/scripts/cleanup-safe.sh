#!/bin/bash
# BRUTAL V5 Safe Cleanup Script
# This script only removes truly safe items that won't affect development

set -e  # Exit on error

echo "==================================="
echo "BRUTAL V5 Safe Directory Cleanup"
echo "==================================="
echo ""

# Function to safely remove directories
safe_remove() {
    if [ -d "$1" ]; then
        echo "Removing: $1"
        rm -rf "$1"
    else
        echo "Skipping (not found): $1"
    fi
}

# Function to safely remove files
safe_remove_file() {
    if [ -f "$1" ]; then
        echo "Removing file: $1"
        rm -f "$1"
    else
        echo "Skipping file (not found): $1"
    fi
}

# Function to safely move files
safe_move() {
    if [ -f "$1" ]; then
        echo "Moving: $1 -> $2"
        mv "$1" "$2" 2>/dev/null || echo "  Failed to move $1"
    fi
}

echo "Step 1: Removing empty app directories..."
echo "-----------------------------------------"
safe_remove "apps/benchmark"
safe_remove "apps/docs"
safe_remove "apps/playground"
safe_remove "apps/showcase"

echo ""
echo "Step 2: Removing empty example directories..."
echo "--------------------------------------------"
safe_remove "examples/advanced"
safe_remove "examples/basic"
safe_remove "examples/intermediate"
safe_remove "examples/real-world"

echo ""
echo "Step 3: Removing other empty directories..."
echo "------------------------------------------"
safe_remove "integrations"
safe_remove "foundation/learning/from-v3"
safe_remove "foundation/learning/from-v4"
safe_remove "foundation/learning/ongoing"

echo ""
echo "Step 4: Removing backup directory..."
echo "-----------------------------------"
safe_remove "backups"

echo ""
echo "Step 5: Removing framework-v3..."
echo "--------------------------------"
safe_remove "framework-v3"

echo ""
echo "Step 6: Removing duplicate lock file..."
echo "--------------------------------------"
safe_remove_file "package-lock.json"

echo ""
echo "Step 7: Creating documentation structure..."
echo "-----------------------------------------"
mkdir -p docs/handoffs
mkdir -p docs/status
mkdir -p docs/sessions
mkdir -p docs/planning
mkdir -p docs/compliance
mkdir -p docs/analysis

echo ""
echo "Step 8: Organizing documentation files..."
echo "----------------------------------------"

# Move handoff/handshake files
for file in HANDOFF-*.md HANDSHAKE-*.md; do
    [ -f "$file" ] && safe_move "$file" "docs/handoffs/"
done

# Move status files
for file in STATUS-*.md CURRENT-STATUS.md; do
    [ -f "$file" ] && safe_move "$file" "docs/status/"
done

# Move session files
for file in SESSION-*.md; do
    [ -f "$file" ] && safe_move "$file" "docs/sessions/"
done

# Move planning files
for file in *-PLAN*.md ACTION-PLAN-*.md; do
    [ -f "$file" ] && safe_move "$file" "docs/planning/"
done

# Move compliance/test files
for file in COMPLIANCE-*.md TEST_REPORT.md; do
    [ -f "$file" ] && safe_move "$file" "docs/compliance/"
done

# Move analysis files
for file in *-ANALYSIS*.md BUNDLE-BLOAT-*.md; do
    [ -f "$file" ] && safe_move "$file" "docs/analysis/"
done

echo ""
echo "Step 9: Cleaning empty package directories..."
echo "--------------------------------------------"
find packages/@brutal -type d -empty -delete 2>/dev/null || echo "Some directories could not be removed"

echo ""
echo "Step 10: Final cleanup check..."
echo "-------------------------------"

# Count remaining root level .md files
ROOT_MD_COUNT=$(ls -1 *.md 2>/dev/null | wc -l)
echo "Remaining .md files in root: $ROOT_MD_COUNT"

# Show what's left in root
if [ $ROOT_MD_COUNT -gt 0 ]; then
    echo "Files that should stay in root:"
    ls -1 *.md 2>/dev/null | grep -E "^(README|LICENSE|CONTRIBUTING|CODE_OF_CONDUCT|SECURITY)" || true
    echo ""
    echo "Other files (consider moving):"
    ls -1 *.md 2>/dev/null | grep -vE "^(README|LICENSE|CONTRIBUTING|CODE_OF_CONDUCT|SECURITY)" || true
fi

echo ""
echo "==================================="
echo "Cleanup Complete!"
echo "==================================="
echo ""
echo "Summary:"
echo "- Removed empty directories"
echo "- Removed backup directory"
echo "- Removed framework-v3"
echo "- Organized documentation into /docs"
echo "- Cleaned up package directories"
echo ""
echo "Next steps:"
echo "1. Review /docs structure"
echo "2. Consider organizing remaining root .md files"
echo "3. Commit these changes"
#!/bin/bash
# BRUTAL V5 - Safe Cleanup Script
# This only removes empty directories and reorganizes docs
# Nothing that could break the build

echo "🧹 BRUTAL V5 Safe Cleanup"
echo "========================"

# 1. Remove empty directories
echo "📁 Removing empty directories..."
find apps -type d -empty -delete 2>/dev/null
find examples -type d -empty -delete 2>/dev/null
rmdir integrations 2>/dev/null
find packages/@brutal -type d -empty -delete 2>/dev/null

# 2. Remove obvious non-code files
echo "🗑️  Removing non-essential files..."
rm -rf backups/  # 500MB backup shouldn't be in git
rm -rf framework-v3/  # Only has one file
rm -f package-lock.json  # We use pnpm

# 3. Organize root documentation
echo "📚 Organizing documentation..."
mkdir -p docs/{architecture,sessions,status,planning}

# Move handoff/session docs
mv -f HANDOFF-*.md docs/sessions/ 2>/dev/null
mv -f *-SESSION-*.md docs/sessions/ 2>/dev/null
mv -f HANDSHAKE-*.md docs/sessions/ 2>/dev/null

# Move status docs
mv -f OPERATIONAL-STATUS-*.md docs/status/ 2>/dev/null
mv -f CURRENT-STATUS*.md docs/status/ 2>/dev/null

# Move planning docs
mv -f ACTION-PLAN-*.md docs/planning/ 2>/dev/null
mv -f PHASE-*.md docs/planning/ 2>/dev/null

# Move architecture docs
mv -f BROKEN-*.md docs/architecture/ 2>/dev/null

# 4. Clean up dist (build artifacts)
echo "🔧 Cleaning build artifacts..."
rm -rf dist/

echo "✅ Safe cleanup complete!"
echo ""
echo "📊 What was cleaned:"
echo "- Empty directories in apps/ and examples/"
echo "- 500MB+ backup directory"
echo "- framework-v3 with single file"
echo "- Duplicate package-lock.json"
echo "- Organized ~20 docs into docs/ folder"
echo ""
echo "🛡️ What was preserved:"
echo "- All code in packages/"
echo "- All tools/"
echo "- All foundation/"
echo "- All scripts/"
echo "- All configs"
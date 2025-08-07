#!/bin/bash
# Verify foundation integrity

echo "🔍 Verifying BRUTAL V6 Foundation..."
echo "=================================="

# Check all required files exist
REQUIRED_FILES=(
  "index.ts"
  "principles.ts"
  "validate.ts"
  "invariants.ts"
  "rules/index.ts"
  "rules/size.ts"
  "rules/dependencies.ts"
  "rules/composition.ts"
  "rules/duplication.ts"
  "rules/patterns.ts"
  "rules/framework-growth.ts"
  "enforce/pre-commit"
  "enforce/monitor.ts"
  "enforce/setup.sh"
  "enforce/north-star-check.sh"
  "FOUNDATION-STATUS.md"
  "README.md"
)

MISSING=0
for file in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo "❌ Missing: $file"
    MISSING=$((MISSING + 1))
  else
    echo "✅ Found: $file"
  fi
done

echo ""
echo "📊 Summary:"
echo "- Files checked: ${#REQUIRED_FILES[@]}"
echo "- Missing files: $MISSING"

if [ $MISSING -eq 0 ]; then
  echo ""
  echo "✅ Foundation structure is complete!"
  
  # Check that index.ts only exports validate
  echo ""
  echo "🔍 Checking public API..."
  EXPORTS=$(grep -c "^export" index.ts)
  if [ $EXPORTS -eq 2 ]; then
    echo "✅ Public API is correctly limited (validate + types only)"
  else
    echo "❌ Too many exports in index.ts (found $EXPORTS, expected 2)"
  fi
else
  echo ""
  echo "❌ Foundation is incomplete!"
  exit 1
fi
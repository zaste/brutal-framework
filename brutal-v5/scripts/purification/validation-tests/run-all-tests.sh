#!/bin/bash
# BRUTAL V5 - Purification Validation Test Suite
# Runs all validation checks to ensure safety

echo "🧪 BRUTAL V5 Purification Validation Suite"
echo "========================================="
echo ""

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/.."

# Track test results
TESTS_PASSED=0
TESTS_FAILED=0

run_test() {
    local test_name=$1
    local test_command=$2
    
    echo -n "🔍 $test_name... "
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo "✅ PASS"
        ((TESTS_PASSED++))
        return 0
    else
        echo "❌ FAIL"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Test 1: Check current state documentation exists
run_test "Current state documented" "[ -d current-state ] && [ -f current-state/summary.json ]"

# Test 2: Validate all core packages are documented
run_test "All packages documented" "[ $(ls current-state/*.json | wc -l) -eq 13 ]"

# Test 3: Check backup exists
run_test "Backup created" "[ -d ../../backups ] && [ $(ls ../../backups | wc -l) -gt 0 ]"

# Test 4: Validate package structure
run_test "Package structure intact" "[ -d ../../packages/@brutal ] && [ $(ls ../../packages/@brutal | wc -l) -ge 12 ]"

# Test 5: Check for build errors
echo ""
echo "📦 Checking package builds..."
PACKAGES=(foundation shared events templates components state routing cache http validation animation testing)

for pkg in "${PACKAGES[@]}"; do
    if [ -f "../../packages/@brutal/$pkg/tsconfig.json" ]; then
        run_test "  $pkg TypeScript valid" "cd ../../packages/@brutal/$pkg && npx tsc --noEmit"
    fi
done

# Test 6: Dependency validation
echo ""
echo "🔗 Validating dependencies..."
run_test "Zero external dependencies" "! grep -r '\"dependencies\"' ../../packages/@brutal/*/package.json | grep -v '@brutal/'"

# Test 7: Bundle size check
echo ""
echo "📏 Checking bundle sizes..."
TOTAL_SIZE=0
for pkg in "${PACKAGES[@]}"; do
    if [ -d "../../packages/@brutal/$pkg/dist" ]; then
        SIZE=$(du -sb "../../packages/@brutal/$pkg/dist" | cut -f1)
        TOTAL_SIZE=$((TOTAL_SIZE + SIZE))
    fi
done

# Convert to KB
TOTAL_KB=$((TOTAL_SIZE / 1024))
run_test "Total bundle < 100KB" "[ $TOTAL_KB -lt 100 ]"

# Test 8: Check for minimal implementations
echo ""
echo "🔄 Checking minimal implementations..."
MINIMAL_COUNT=$(find ../../packages/@brutal/*/src -name "minimal.ts" | wc -l)
run_test "Minimal implementations exist" "[ $MINIMAL_COUNT -gt 0 ]"

# Summary
echo ""
echo "📊 TEST SUMMARY"
echo "=============="
echo "✅ Passed: $TESTS_PASSED"
echo "❌ Failed: $TESTS_FAILED"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo "🎉 All validation tests passed! Safe to proceed with purification."
    exit 0
else
    echo "⚠️  Some tests failed. Fix issues before proceeding."
    exit 1
fi
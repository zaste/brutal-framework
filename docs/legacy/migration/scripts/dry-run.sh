#!/bin/bash
# DRY RUN - Validates migration plan without making changes

set -e

MIGRATION_DIR="/workspaces/web/migration"
DRY_RUN_LOG="$MIGRATION_DIR/logs/dry_run_$(date +%Y%m%d_%H%M%S).log"

echo "🧪 Starting dry run validation..." | tee "$DRY_RUN_LOG"

# Function to simulate file operations
simulate_operation() {
    local operation=$1
    local source=$2
    local target=$3
    
    echo "SIMULATE [$operation]: $source -> $target" >> "$DRY_RUN_LOG"
    
    case $operation in
        "MOVE")
            if [[ -f "$source" ]] || [[ -d "$source" ]]; then
                echo "✓ Source exists: $source" >> "$DRY_RUN_LOG"
            else
                echo "❌ Source missing: $source" >> "$DRY_RUN_LOG"
                return 1
            fi
            
            if [[ -e "$target" ]]; then
                echo "⚠️  Target exists: $target" >> "$DRY_RUN_LOG"
            fi
            ;;
        "COPY")
            if [[ -f "$source" ]] || [[ -d "$source" ]]; then
                echo "✓ Source exists: $source" >> "$DRY_RUN_LOG"
            else
                echo "❌ Source missing: $source" >> "$DRY_RUN_LOG"
                return 1
            fi
            ;;
        "CREATE")
            echo "📁 Will create: $target" >> "$DRY_RUN_LOG"
            ;;
    esac
    
    return 0
}

# Phase 1: Root directory cleanup simulation
echo "=== Phase 1: Root Directory Cleanup ===" >> "$DRY_RUN_LOG"

# Strategic Planning Documents
simulate_operation "MOVE" "/workspaces/web/STRATEGIC-PLANNING-END-TO-END.md" "/workspaces/web/docs/01-strategic/master-plans/end-to-end-strategy.md"
simulate_operation "MOVE" "/workspaces/web/MASTER-IMPLEMENTATION-ROADMAP-REFORMULATED.md" "/workspaces/web/docs/01-strategic/roadmaps/master-implementation.md"
simulate_operation "MOVE" "/workspaces/web/COMPLEX-COMPONENTS-EVOLUTION-STRATEGY.md" "/workspaces/web/docs/01-strategic/business-analysis/complex-components-strategy.md"
simulate_operation "MOVE" "/workspaces/web/VISUAL-DEMONSTRATION-PLATFORM-PLAN.md" "/workspaces/web/docs/01-strategic/business-analysis/visual-demo-platform.md"

# Technical Architecture
simulate_operation "MOVE" "/workspaces/web/NATIVE-WEB-COMPONENTS-FRAMEWORK-COMPLETE.md" "/workspaces/web/docs/02-technical/architecture/framework-complete.md"
simulate_operation "MOVE" "/workspaces/web/NATIVE-WEB-COMPONENTS-FRAMEWORK-FINAL-DOCUMENTATION.md" "/workspaces/web/docs/02-technical/architecture/framework-final-documentation.md"

# Sample some PHASE files
for file in /workspaces/web/PHASE-I-*.md; do
    if [[ -f "$file" ]]; then
        filename=$(basename "$file")
        simulate_operation "MOVE" "$file" "/workspaces/web/docs/03-implementation/phases/phase-1/${filename,,}"
        break # Just test one for dry run
    fi
done

# Sample some DAY files
for file in /workspaces/web/DAY-*.md; do
    if [[ -f "$file" ]]; then
        filename=$(basename "$file")
        simulate_operation "MOVE" "$file" "/workspaces/web/docs/04-progress/daily-logs/${filename,,}"
        break # Just test one for dry run
    fi
done

# Phase 2: Framework consolidation simulation
echo "=== Phase 2: Framework Consolidation ===" >> "$DRY_RUN_LOG"
simulate_operation "MOVE" "/workspaces/web/custom-elements-research" "/workspaces/web/framework"
simulate_operation "MOVE" "/workspaces/web/custom-elements-research/src" "/workspaces/web/framework/src"
simulate_operation "MOVE" "/workspaces/web/custom-elements-research/tests" "/workspaces/web/framework/tests"

# Phase 3: Documentation consolidation simulation
echo "=== Phase 3: Documentation Consolidation ===" >> "$DRY_RUN_LOG"
simulate_operation "MOVE" "/workspaces/web/docs/research" "/workspaces/web/docs/05-research"
simulate_operation "MOVE" "/workspaces/web/docs/specs" "/workspaces/web/docs/02-technical/specifications"

# Check for critical files
echo "=== Critical Files Check ===" >> "$DRY_RUN_LOG"
critical_files=(
    "/workspaces/web/CLAUDE.md"
    "/workspaces/web/README.md"
    "/workspaces/web/custom-elements-research/package.json"
    "/workspaces/web/custom-elements-research/src"
)

for file in "${critical_files[@]}"; do
    if [[ -f "$file" ]] || [[ -d "$file" ]]; then
        echo "✓ Critical file exists: $file" >> "$DRY_RUN_LOG"
    else
        echo "❌ Critical file missing: $file" >> "$DRY_RUN_LOG"
    fi
done

# Directory creation simulation
echo "=== Directory Creation Simulation ===" >> "$DRY_RUN_LOG"
target_dirs=(
    "/workspaces/web/docs/01-strategic/master-plans"
    "/workspaces/web/docs/01-strategic/roadmaps"
    "/workspaces/web/docs/01-strategic/business-analysis"
    "/workspaces/web/docs/02-technical/architecture"
    "/workspaces/web/docs/03-implementation/phases/phase-1"
    "/workspaces/web/docs/03-implementation/phases/phase-2"
    "/workspaces/web/docs/03-implementation/phases/phase-3"
    "/workspaces/web/docs/04-progress/daily-logs"
    "/workspaces/web/docs/04-progress/weekly-reports"
    "/workspaces/web/docs/04-progress/handshakes"
    "/workspaces/web/framework"
)

for dir in "${target_dirs[@]}"; do
    simulate_operation "CREATE" "" "$dir"
done

# Count files to be moved
echo "=== Migration Impact Analysis ===" >> "$DRY_RUN_LOG"
root_md_files=$(find /workspaces/web -maxdepth 1 -name "*.md" -not -name "README.md" -not -name "CLAUDE.md" | wc -l)
echo "Root markdown files to move: $root_md_files" >> "$DRY_RUN_LOG"

framework_files=$(find /workspaces/web/custom-elements-research -type f 2>/dev/null | wc -l)
echo "Framework files to move: $framework_files" >> "$DRY_RUN_LOG"

docs_files=$(find /workspaces/web/docs -name "*.md" 2>/dev/null | wc -l)
echo "Existing docs files: $docs_files" >> "$DRY_RUN_LOG"

# Validation summary
ERRORS=$(grep "❌" "$DRY_RUN_LOG" | wc -l)
WARNINGS=$(grep "⚠️" "$DRY_RUN_LOG" | wc -l)
SUCCESSES=$(grep "✓" "$DRY_RUN_LOG" | wc -l)

echo "=== DRY RUN SUMMARY ===" >> "$DRY_RUN_LOG"
echo "Successful operations: $SUCCESSES" >> "$DRY_RUN_LOG"
echo "Warnings: $WARNINGS" >> "$DRY_RUN_LOG"
echo "Errors: $ERRORS" >> "$DRY_RUN_LOG"

echo "🔍 Dry run completed:" | tee -a "$DRY_RUN_LOG"
echo "   ✅ Successful operations: $SUCCESSES" | tee -a "$DRY_RUN_LOG"
echo "   ⚠️  Warnings: $WARNINGS" | tee -a "$DRY_RUN_LOG"
echo "   ❌ Errors: $ERRORS" | tee -a "$DRY_RUN_LOG"

if [[ $ERRORS -gt 0 ]]; then
    echo "❌ Dry run failed. Check log: $DRY_RUN_LOG"
    echo "Critical errors found. Migration cannot proceed safely."
    exit 1
else
    echo "✅ Dry run successful. Ready for migration."
    echo "📄 Full dry run log: $DRY_RUN_LOG"
fi
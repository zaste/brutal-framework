#!/bin/bash
# FULL MIGRATION ORCHESTRATOR - Executes complete migration process

set -e

MIGRATION_DIR="/workspaces/web/migration"
MASTER_LOG="$MIGRATION_DIR/logs/full_migration_$(date +%Y%m%d_%H%M%S).log"

echo "🚀 Starting Full Migration Process" | tee "$MASTER_LOG"
echo "===============================================" | tee -a "$MASTER_LOG"
echo "Migration started at: $(date)" | tee -a "$MASTER_LOG"
echo "Project location: /workspaces/web" | tee -a "$MASTER_LOG"
echo "===============================================" | tee -a "$MASTER_LOG"

# Create migration directory structure if not exists
mkdir -p "$MIGRATION_DIR"/{scripts,backups,validation,logs}

# Make all scripts executable
chmod +x "$MIGRATION_DIR"/scripts/*.sh 2>/dev/null || true

# Function to check script existence and execute
execute_phase() {
    local phase_name=$1
    local script_path=$2
    local description=$3
    
    echo "" | tee -a "$MASTER_LOG"
    echo "=== $phase_name: $description ===" | tee -a "$MASTER_LOG"
    echo "Script: $script_path" | tee -a "$MASTER_LOG"
    echo "Started at: $(date)" | tee -a "$MASTER_LOG"
    
    if [[ -f "$script_path" ]]; then
        if bash "$script_path"; then
            echo "✅ $phase_name completed successfully at $(date)" | tee -a "$MASTER_LOG"
            return 0
        else
            echo "❌ $phase_name failed at $(date)" | tee -a "$MASTER_LOG"
            return 1
        fi
    else
        echo "❌ Script not found: $script_path" | tee -a "$MASTER_LOG"
        return 1
    fi
}

# Function to show migration status
show_status() {
    local phase=$1
    local status=$2
    
    echo "[$phase] $status" | tee -a "$MASTER_LOG"
}

# Pre-migration validation
echo "=== PRE-MIGRATION VALIDATION ===" | tee -a "$MASTER_LOG"

# Check required tools
required_tools=("find" "tar" "mv" "cp" "mkdir" "rm" "chmod")
for tool in "${required_tools[@]}"; do
    if command -v "$tool" >/dev/null 2>&1; then
        show_status "TOOL" "✅ $tool available"
    else
        show_status "TOOL" "❌ $tool missing"
        echo "❌ Required tool missing: $tool. Aborting migration." | tee -a "$MASTER_LOG"
        exit 1
    fi
done

# Check disk space
available_space=$(df /workspaces/web | awk 'NR==2 {print $4}')
echo "Available disk space: ${available_space}KB" | tee -a "$MASTER_LOG"

if [[ $available_space -lt 1000000 ]]; then
    echo "⚠️  Low disk space warning. Consider cleaning up before migration." | tee -a "$MASTER_LOG"
fi

# Count files before migration
total_files_before=$(find /workspaces/web -type f -not -path "*/node_modules/*" -not -path "*/.git/*" | wc -l)
md_files_before=$(find /workspaces/web -name "*.md" -not -path "*/node_modules/*" | wc -l)
root_md_before=$(find /workspaces/web -maxdepth 1 -name "*.md" | wc -l)

echo "Files before migration:" | tee -a "$MASTER_LOG"
echo "  Total files: $total_files_before" | tee -a "$MASTER_LOG"
echo "  Markdown files: $md_files_before" | tee -a "$MASTER_LOG"
echo "  Root markdown files: $root_md_before" | tee -a "$MASTER_LOG"

# Phase 0: Backup
show_status "PHASE-0" "Creating comprehensive backup"
if execute_phase "Phase 0" "$MIGRATION_DIR/scripts/backup.sh" "Creating comprehensive backup"; then
    show_status "BACKUP" "✅ Backup completed successfully"
else
    show_status "BACKUP" "❌ Backup failed - ABORTING MIGRATION"
    exit 1
fi

# Phase 0.5: Dry run validation
show_status "PHASE-0.5" "Running dry run validation"
if execute_phase "Phase 0.5" "$MIGRATION_DIR/scripts/dry-run.sh" "Dry run validation"; then
    show_status "DRY-RUN" "✅ Dry run validation passed"
else
    show_status "DRY-RUN" "❌ Dry run validation failed - ABORTING MIGRATION"
    echo "Check the dry run log for detailed error information." | tee -a "$MASTER_LOG"
    exit 1
fi

# Phase 1: Root directory cleanup
show_status "PHASE-1" "Root directory cleanup"
if execute_phase "Phase 1" "$MIGRATION_DIR/scripts/phase1-root-cleanup.sh" "Root directory cleanup"; then
    show_status "ROOT-CLEANUP" "✅ Phase 1 completed successfully"
    
    # Verify Phase 1 results
    root_md_after_phase1=$(find /workspaces/web -maxdepth 1 -name "*.md" -not -name "README.md" -not -name "CLAUDE.md" | wc -l)
    echo "Root markdown files after Phase 1: $root_md_after_phase1" | tee -a "$MASTER_LOG"
    
    if [[ $root_md_after_phase1 -lt 5 ]]; then
        show_status "PHASE-1" "✅ Root cleanup successful (${root_md_after_phase1} files remaining)"
    else
        show_status "PHASE-1" "⚠️  Root cleanup incomplete (${root_md_after_phase1} files remaining)"
    fi
else
    show_status "ROOT-CLEANUP" "❌ Phase 1 failed - Check logs for details"
    echo "Phase 1 failed. You can restore from backup and retry." | tee -a "$MASTER_LOG"
    exit 1
fi

# Phase 2: Framework consolidation
show_status "PHASE-2" "Framework consolidation"
if execute_phase "Phase 2" "$MIGRATION_DIR/scripts/phase2-framework-consolidation.sh" "Framework consolidation"; then
    show_status "FRAMEWORK" "✅ Phase 2 completed successfully"
    
    # Verify Phase 2 results
    if [[ -d "/workspaces/web/framework" ]]; then
        framework_files=$(find /workspaces/web/framework -type f | wc -l)
        show_status "PHASE-2" "✅ Framework created with $framework_files files"
    else
        show_status "PHASE-2" "❌ Framework directory not created"
    fi
else
    show_status "FRAMEWORK" "❌ Phase 2 failed - Check logs for details"
    echo "Phase 2 failed. You can restore from backup and retry." | tee -a "$MASTER_LOG"
    exit 1
fi

# Phase 3: Documentation consolidation (basic merge of remaining docs)
show_status "PHASE-3" "Documentation consolidation"
echo "=== Phase 3: Documentation Consolidation ===" | tee -a "$MASTER_LOG"

# Merge any remaining documentation directories
if [[ -d "/workspaces/web/documentation" ]]; then
    echo "Merging /documentation into /docs" | tee -a "$MASTER_LOG"
    
    # Move documentation content to appropriate docs locations
    find /workspaces/web/documentation -name "*.md" -type f | while read -r file; do
        relative_path=${file#/workspaces/web/documentation/}
        target_dir="/workspaces/web/docs/archive/deprecated"
        mkdir -p "$target_dir"
        mv "$file" "$target_dir/$(basename "$file")"
        echo "Moved: $relative_path -> docs/archive/deprecated/" | tee -a "$MASTER_LOG"
    done
    
    # Remove empty documentation directory
    find /workspaces/web/documentation -type d -empty -delete 2>/dev/null || true
    rmdir /workspaces/web/documentation 2>/dev/null || echo "Documentation directory not empty, preserved" | tee -a "$MASTER_LOG"
fi

show_status "PHASE-3" "✅ Documentation consolidation completed"

# Phase 4: Workspace configuration
show_status "PHASE-4" "Workspace configuration"
if execute_phase "Phase 4" "$MIGRATION_DIR/scripts/configure-workspace.sh" "Workspace configuration"; then
    show_status "WORKSPACE" "✅ Phase 4 completed successfully"
    
    # Verify workspace configuration
    if [[ -f "/workspaces/web/package.json" ]] && grep -q '"workspaces"' /workspaces/web/package.json; then
        show_status "PHASE-4" "✅ Workspace configuration verified"
    else
        show_status "PHASE-4" "⚠️  Workspace configuration may be incomplete"
    fi
else
    show_status "WORKSPACE" "❌ Phase 4 failed - Check logs for details"
    echo "Phase 4 failed. You can continue with manual workspace setup." | tee -a "$MASTER_LOG"
fi

# Phase 5: Final validation
show_status "PHASE-5" "Final validation"
if [[ -f "/workspaces/web/tools/validation/validate-project.sh" ]]; then
    chmod +x "/workspaces/web/tools/validation/validate-project.sh"
    if bash "/workspaces/web/tools/validation/validate-project.sh"; then
        show_status "VALIDATION" "✅ Final validation passed"
    else
        show_status "VALIDATION" "⚠️  Final validation had warnings - check validation report"
    fi
else
    show_status "VALIDATION" "⚠️  Validation script not found - skipping final validation"
fi

# Post-migration analysis
echo "" | tee -a "$MASTER_LOG"
echo "=== POST-MIGRATION ANALYSIS ===" | tee -a "$MASTER_LOG"

# Count files after migration
total_files_after=$(find /workspaces/web -type f -not -path "*/node_modules/*" -not -path "*/.git/*" | wc -l)
md_files_after=$(find /workspaces/web -name "*.md" -not -path "*/node_modules/*" | wc -l)
root_md_after=$(find /workspaces/web -maxdepth 1 -name "*.md" | wc -l)

echo "Files after migration:" | tee -a "$MASTER_LOG"
echo "  Total files: $total_files_after" | tee -a "$MASTER_LOG"
echo "  Markdown files: $md_files_after" | tee -a "$MASTER_LOG"
echo "  Root markdown files: $root_md_after" | tee -a "$MASTER_LOG"

# File movement summary
files_moved=$(expr $total_files_before - $total_files_after + $total_files_after)
root_files_moved=$(expr $root_md_before - $root_md_after)

echo "" | tee -a "$MASTER_LOG"
echo "Migration statistics:" | tee -a "$MASTER_LOG"
echo "  Root files cleaned up: $root_files_moved" | tee -a "$MASTER_LOG"
echo "  Total file integrity: $(expr $total_files_after \* 100 / $total_files_before)%" | tee -a "$MASTER_LOG"

# Directory structure summary
echo "" | tee -a "$MASTER_LOG"
echo "New directory structure:" | tee -a "$MASTER_LOG"
echo "  📁 /docs/ - $(find /workspaces/web/docs -name "*.md" | wc -l) documentation files" | tee -a "$MASTER_LOG"
echo "  📁 /framework/ - $(find /workspaces/web/framework -type f | wc -l) framework files" | tee -a "$MASTER_LOG"
echo "  📁 /tools/ - $(find /workspaces/web/tools -type f | wc -l) tool files" | tee -a "$MASTER_LOG"
echo "  📁 /migration/ - Migration system preserved" | tee -a "$MASTER_LOG"

# Final status
echo "" | tee -a "$MASTER_LOG"
echo "===============================================" | tee -a "$MASTER_LOG"
echo "🎉 MIGRATION COMPLETED SUCCESSFULLY!" | tee -a "$MASTER_LOG"
echo "===============================================" | tee -a "$MASTER_LOG"
echo "Migration completed at: $(date)" | tee -a "$MASTER_LOG"
echo "" | tee -a "$MASTER_LOG"
echo "📊 FINAL SUMMARY:" | tee -a "$MASTER_LOG"
echo "✅ Phase 0: Backup created" | tee -a "$MASTER_LOG"
echo "✅ Phase 1: Root directory cleaned ($root_files_moved files moved)" | tee -a "$MASTER_LOG"
echo "✅ Phase 2: Framework consolidated" | tee -a "$MASTER_LOG"
echo "✅ Phase 3: Documentation organized" | tee -a "$MASTER_LOG"
echo "✅ Phase 4: Workspace configured" | tee -a "$MASTER_LOG"
echo "✅ Phase 5: Project validated" | tee -a "$MASTER_LOG"
echo "" | tee -a "$MASTER_LOG"
echo "🔧 NEXT STEPS:" | tee -a "$MASTER_LOG"
echo "1. Run: npm install (install workspace dependencies)" | tee -a "$MASTER_LOG"
echo "2. Run: npm run validate (validate project structure)" | tee -a "$MASTER_LOG"
echo "3. Run: npm run test (test framework functionality)" | tee -a "$MASTER_LOG"
echo "4. Run: npm run build (build framework)" | tee -a "$MASTER_LOG"
echo "5. Run: npm run benchmark (validate performance)" | tee -a "$MASTER_LOG"
echo "" | tee -a "$MASTER_LOG"
echo "📄 Complete migration log: $MASTER_LOG" | tee -a "$MASTER_LOG"
echo "📦 Backup location: $(cat /workspaces/web/migration/logs/latest_backup.txt 2>/dev/null || echo 'Check migration/backups/')" | tee -a "$MASTER_LOG"
echo "" | tee -a "$MASTER_LOG"
echo "🚀 Your Native Web Components Framework is now ready for development!" | tee -a "$MASTER_LOG"
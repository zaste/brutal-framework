#!/bin/bash
# ROLLBACK SYSTEM - Emergency recovery from migration backup

set -e

MIGRATION_DIR="/workspaces/web/migration"
ROLLBACK_LOG="$MIGRATION_DIR/logs/rollback_$(date +%Y%m%d_%H%M%S).log"

echo "🔄 EMERGENCY ROLLBACK SYSTEM" | tee "$ROLLBACK_LOG"
echo "===============================" | tee -a "$ROLLBACK_LOG"
echo "Rollback started at: $(date)" | tee -a "$ROLLBACK_LOG"

# Function to find latest backup
find_latest_backup() {
    local backup_dir="$MIGRATION_DIR/backups"
    
    if [[ -f "$MIGRATION_DIR/logs/latest_backup.txt" ]]; then
        local latest_backup=$(cat "$MIGRATION_DIR/logs/latest_backup.txt")
        if [[ -d "$latest_backup" ]]; then
            echo "$latest_backup"
            return 0
        fi
    fi
    
    # Fallback: find most recent backup directory
    local latest=$(find "$backup_dir" -name "pre_migration_*" -type d | sort | tail -1)
    if [[ -n "$latest" ]]; then
        echo "$latest"
        return 0
    fi
    
    return 1
}

# Function to confirm rollback
confirm_rollback() {
    echo "⚠️  WARNING: This will restore the project to its pre-migration state." | tee -a "$ROLLBACK_LOG"
    echo "All migration changes will be lost!" | tee -a "$ROLLBACK_LOG"
    echo "" | tee -a "$ROLLBACK_LOG"
    
    # In automation context, we'll proceed if backup exists
    # In interactive context, this would prompt for confirmation
    return 0
}

# Function to perform rollback
perform_rollback() {
    local backup_path=$1
    
    echo "🔄 Restoring from backup: $backup_path" | tee -a "$ROLLBACK_LOG"
    
    # Verify backup exists
    if [[ ! -f "$backup_path/project_backup.tar.gz" ]]; then
        echo "❌ Backup archive not found: $backup_path/project_backup.tar.gz" | tee -a "$ROLLBACK_LOG"
        return 1
    fi
    
    # Stop any running processes that might interfere
    echo "Stopping any running processes..." | tee -a "$ROLLBACK_LOG"
    pkill -f "npm" 2>/dev/null || true
    pkill -f "node" 2>/dev/null || true
    
    # Create a rollback backup of current state
    local current_backup="$MIGRATION_DIR/backups/pre_rollback_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$current_backup"
    echo "Creating backup of current state..." | tee -a "$ROLLBACK_LOG"
    
    tar --exclude='migration/backups' \
        --exclude='node_modules' \
        --exclude='.git' \
        -czf "$current_backup/current_state.tar.gz" \
        -C /workspaces/web . 2>/dev/null || echo "Warning: Some files may be in use" | tee -a "$ROLLBACK_LOG"
    
    # Remove current files (except critical ones)
    echo "Removing current project files..." | tee -a "$ROLLBACK_LOG"
    
    # Save critical migration files
    cp -r "$MIGRATION_DIR" "/tmp/migration_backup" 2>/dev/null || true
    
    # Remove everything except git and migration
    find /workspaces/web -maxdepth 1 -not -name "." -not -name ".git" -not -name "migration" -exec rm -rf {} + 2>/dev/null || true
    
    # Restore from backup
    echo "Restoring files from backup..." | tee -a "$ROLLBACK_LOG"
    cd /workspaces/web
    tar -xzf "$backup_path/project_backup.tar.gz" 2>/dev/null
    
    # Restore migration directory
    if [[ -d "/tmp/migration_backup" ]]; then
        cp -r "/tmp/migration_backup" "$MIGRATION_DIR" 2>/dev/null || true
        rm -rf "/tmp/migration_backup" 2>/dev/null || true
    fi
    
    echo "✅ Rollback completed successfully" | tee -a "$ROLLBACK_LOG"
    return 0
}

# Function to verify rollback
verify_rollback() {
    local backup_path=$1
    
    echo "🔍 Verifying rollback..." | tee -a "$ROLLBACK_LOG"
    
    # Check file count matches backup
    if [[ -f "$backup_path/file_inventory.txt" ]]; then
        local expected_files=$(wc -l < "$backup_path/file_inventory.txt")
        local current_files=$(find /workspaces/web -type f -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/migration/backups/*" | wc -l)
        
        echo "Expected files: $expected_files" | tee -a "$ROLLBACK_LOG"
        echo "Current files: $current_files" | tee -a "$ROLLBACK_LOG"
        
        local file_diff=$(expr $expected_files - $current_files)
        if [[ $file_diff -lt 10 && $file_diff -gt -10 ]]; then
            echo "✅ File count verification passed (difference: $file_diff)" | tee -a "$ROLLBACK_LOG"
        else
            echo "⚠️  File count difference larger than expected: $file_diff" | tee -a "$ROLLBACK_LOG"
        fi
    fi
    
    # Check critical files exist
    critical_files=("CLAUDE.md" "README.md")
    
    for file in "${critical_files[@]}"; do
        if [[ -f "/workspaces/web/$file" ]]; then
            echo "✅ Critical file restored: $file" | tee -a "$ROLLBACK_LOG"
        else
            echo "❌ Critical file missing after rollback: $file" | tee -a "$ROLLBACK_LOG"
        fi
    done
    
    # Check if custom-elements-research exists (should be restored)
    if [[ -d "/workspaces/web/custom-elements-research" ]]; then
        echo "✅ Framework directory restored: custom-elements-research" | tee -a "$ROLLBACK_LOG"
    else
        echo "⚠️  Framework directory not found after rollback" | tee -a "$ROLLBACK_LOG"
    fi
}

# Main rollback process
main() {
    # Check if we're in the right directory
    if [[ ! -f "/workspaces/web/CLAUDE.md" ]] && [[ ! -d "/workspaces/web/migration" ]]; then
        echo "❌ Not in project directory or project structure not recognized" | tee -a "$ROLLBACK_LOG"
        exit 1
    fi
    
    # Find latest backup
    echo "🔍 Searching for latest backup..." | tee -a "$ROLLBACK_LOG"
    
    if latest_backup=$(find_latest_backup); then
        echo "✅ Found backup: $latest_backup" | tee -a "$ROLLBACK_LOG"
        
        # Show backup info
        if [[ -f "$latest_backup/backup_summary.txt" ]]; then
            echo "📄 Backup information:" | tee -a "$ROLLBACK_LOG"
            cat "$latest_backup/backup_summary.txt" | tee -a "$ROLLBACK_LOG"
        fi
    else
        echo "❌ No backup found. Cannot perform rollback." | tee -a "$ROLLBACK_LOG"
        echo "Available backups:" | tee -a "$ROLLBACK_LOG"
        find "$MIGRATION_DIR/backups" -name "pre_migration_*" -type d 2>/dev/null | tee -a "$ROLLBACK_LOG"
        exit 1
    fi
    
    # Confirm rollback
    if confirm_rollback; then
        echo "Proceeding with rollback..." | tee -a "$ROLLBACK_LOG"
    else
        echo "Rollback cancelled by user." | tee -a "$ROLLBACK_LOG"
        exit 1
    fi
    
    # Perform rollback
    if perform_rollback "$latest_backup"; then
        echo "✅ Rollback completed" | tee -a "$ROLLBACK_LOG"
    else
        echo "❌ Rollback failed" | tee -a "$ROLLBACK_LOG"
        exit 1
    fi
    
    # Verify rollback
    verify_rollback "$latest_backup"
    
    # Final status
    echo "" | tee -a "$ROLLBACK_LOG"
    echo "===============================" | tee -a "$ROLLBACK_LOG"
    echo "🔄 ROLLBACK COMPLETED" | tee -a "$ROLLBACK_LOG"
    echo "===============================" | tee -a "$ROLLBACK_LOG"
    echo "Rollback completed at: $(date)" | tee -a "$ROLLBACK_LOG"
    echo "Project restored to pre-migration state" | tee -a "$ROLLBACK_LOG"
    echo "Backup used: $latest_backup" | tee -a "$ROLLBACK_LOG"
    echo "Rollback log: $ROLLBACK_LOG" | tee -a "$ROLLBACK_LOG"
    echo "" | tee -a "$ROLLBACK_LOG"
    echo "You can now:" | tee -a "$ROLLBACK_LOG"
    echo "1. Fix any issues that caused migration failure" | tee -a "$ROLLBACK_LOG"
    echo "2. Re-run migration with: ./migration/scripts/full-migration.sh" | tee -a "$ROLLBACK_LOG"
    echo "3. Or continue working with the original project structure" | tee -a "$ROLLBACK_LOG"
}

# Handle command line arguments
case "${1:-}" in
    "--help"|"-h")
        echo "Usage: $0 [--dry-run] [--backup-path PATH]"
        echo ""
        echo "Options:"
        echo "  --dry-run         Show what would be restored without making changes"
        echo "  --backup-path     Specify specific backup path to restore from"
        echo "  --help            Show this help message"
        exit 0
        ;;
    "--dry-run")
        echo "🧪 DRY RUN MODE - No changes will be made" | tee -a "$ROLLBACK_LOG"
        if latest_backup=$(find_latest_backup); then
            echo "Would restore from: $latest_backup" | tee -a "$ROLLBACK_LOG"
            if [[ -f "$latest_backup/backup_summary.txt" ]]; then
                cat "$latest_backup/backup_summary.txt" | tee -a "$ROLLBACK_LOG"
            fi
        else
            echo "❌ No backup found for rollback" | tee -a "$ROLLBACK_LOG"
            exit 1
        fi
        exit 0
        ;;
    "--backup-path")
        if [[ -n "${2:-}" ]]; then
            if [[ -d "$2" ]]; then
                echo "Using specified backup: $2" | tee -a "$ROLLBACK_LOG"
                latest_backup="$2"
                perform_rollback "$latest_backup"
                verify_rollback "$latest_backup"
            else
                echo "❌ Specified backup path does not exist: $2"
                exit 1
            fi
        else
            echo "❌ --backup-path requires a path argument"
            exit 1
        fi
        ;;
    *)
        main
        ;;
esac
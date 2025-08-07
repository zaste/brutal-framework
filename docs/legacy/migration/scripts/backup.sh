#!/bin/bash
# BACKUP SYSTEM - Creates complete project backup before migration

set -e

BACKUP_DIR="/workspaces/web/migration/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_PATH="$BACKUP_DIR/pre_migration_$TIMESTAMP"

echo "🔄 Creating comprehensive backup..."

# Create backup directory
mkdir -p "$BACKUP_PATH"

# Create tar archive of entire project (excluding node_modules)
tar --exclude='node_modules' \
    --exclude='.git' \
    -czf "$BACKUP_PATH/project_backup.tar.gz" \
    -C /workspaces/web .

# Create file inventory
find /workspaces/web -type f -not -path "*/node_modules/*" -not -path "*/.git/*" > "$BACKUP_PATH/file_inventory.txt"

# Create directory structure
find /workspaces/web -type d -not -path "*/node_modules/*" -not -path "*/.git/*" > "$BACKUP_PATH/directory_structure.txt"

# Create git status snapshot
cd /workspaces/web
git status > "$BACKUP_PATH/git_status.txt" 2>/dev/null || echo "No git repository" > "$BACKUP_PATH/git_status.txt"

# Create file count summary
echo "BACKUP SUMMARY - $TIMESTAMP" > "$BACKUP_PATH/backup_summary.txt"
echo "================================" >> "$BACKUP_PATH/backup_summary.txt"
echo "Total files (excluding node_modules): $(cat "$BACKUP_PATH/file_inventory.txt" | wc -l)" >> "$BACKUP_PATH/backup_summary.txt"
echo "Total directories: $(cat "$BACKUP_PATH/directory_structure.txt" | wc -l)" >> "$BACKUP_PATH/backup_summary.txt"
echo "Markdown files: $(find /workspaces/web -name "*.md" -not -path "*/node_modules/*" | wc -l)" >> "$BACKUP_PATH/backup_summary.txt"
echo "JavaScript/TypeScript files: $(find /workspaces/web -type f -not -path "*/node_modules/*" -not -path "*/.git/*" | grep -E '\.(js|ts|json|cjs)$' | wc -l)" >> "$BACKUP_PATH/backup_summary.txt"
echo "Backup created at: $BACKUP_PATH" >> "$BACKUP_PATH/backup_summary.txt"
echo "Archive size: $(du -sh "$BACKUP_PATH/project_backup.tar.gz" | cut -f1)" >> "$BACKUP_PATH/backup_summary.txt"

echo "✅ Backup created at: $BACKUP_PATH"
echo "📁 Backup size: $(du -sh "$BACKUP_PATH/project_backup.tar.gz" | cut -f1)"
echo "📄 Files backed up: $(cat "$BACKUP_PATH/file_inventory.txt" | wc -l)"

# Store backup path for other scripts
echo "$BACKUP_PATH" > /workspaces/web/migration/logs/latest_backup.txt
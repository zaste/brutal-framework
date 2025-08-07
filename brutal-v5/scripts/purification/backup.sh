#!/bin/bash
# BRUTAL V5 - Purification Safety Backup Script
# Creates timestamped backup of packages before purification

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups/purification_${TIMESTAMP}"

echo "🔒 Creating safety backup..."
echo "Timestamp: ${TIMESTAMP}"

# Create backup directory
mkdir -p "${BACKUP_DIR}"

# Backup packages
echo "📦 Backing up packages..."
cp -r packages "${BACKUP_DIR}/packages"

# Backup documentation
echo "📄 Backing up foundation docs..."
cp -r foundation "${BACKUP_DIR}/foundation"

# Create manifest
cat > "${BACKUP_DIR}/manifest.json" << EOF
{
  "timestamp": "${TIMESTAMP}",
  "branch": "$(git branch --show-current)",
  "commit": "$(git rev-parse HEAD)",
  "packages": $(find packages/@brutal -type d -maxdepth 1 -mindepth 1 | wc -l),
  "created": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF

# Create restore script
cat > "${BACKUP_DIR}/restore.sh" << 'EOF'
#!/bin/bash
echo "🔄 Restoring from backup..."
rm -rf ../../packages
cp -r packages ../../packages
echo "✅ Packages restored"
EOF
chmod +x "${BACKUP_DIR}/restore.sh"

echo "✅ Backup complete: ${BACKUP_DIR}"
echo "📋 To restore: cd ${BACKUP_DIR} && ./restore.sh"
# MIGRATION EXECUTION GUIDE
## Native Web Components Framework Project Reorganization

**Version:** 1.0  
**Date:** 2025-07-09  
**Status:** Ready for Execution  

## QUICK START

### 1. Pre-execution Check
```bash
# Verify system requirements
cd /workspaces/web
ls -la migration/scripts/

# Should show:
# backup.sh
# dry-run.sh
# phase1-root-cleanup.sh
# phase2-framework-consolidation.sh
# configure-workspace.sh
# full-migration.sh
# rollback.sh
```

### 2. Execute Complete Migration
```bash
# One-command migration execution
./migration/scripts/full-migration.sh
```

### 3. Post-migration Setup
```bash
# Install workspace dependencies
npm install

# Validate project structure
npm run validate

# Test framework functionality
npm run test

# Build framework
npm run build
```

## DETAILED EXECUTION OPTIONS

### Option A: Full Automated Migration (Recommended)
```bash
# Execute complete migration process
./migration/scripts/full-migration.sh

# This runs all phases:
# - Phase 0: Backup creation
# - Phase 0.5: Dry run validation
# - Phase 1: Root directory cleanup
# - Phase 2: Framework consolidation
# - Phase 3: Documentation consolidation
# - Phase 4: Workspace configuration
# - Phase 5: Final validation
```

### Option B: Step-by-step Manual Execution
```bash
# Phase 0: Create backup
./migration/scripts/backup.sh

# Phase 0.5: Validate migration plan
./migration/scripts/dry-run.sh

# Phase 1: Clean up root directory
./migration/scripts/phase1-root-cleanup.sh

# Phase 2: Consolidate framework
./migration/scripts/phase2-framework-consolidation.sh

# Phase 4: Configure workspace
./migration/scripts/configure-workspace.sh
```

### Option C: Dry Run Only (Safe Testing)
```bash
# Test migration without making changes
./migration/scripts/dry-run.sh

# Review the output to understand what will be moved
cat migration/logs/dry_run_*.log
```

## SAFETY PROCEDURES

### Emergency Rollback
```bash
# If something goes wrong, restore from backup
./migration/scripts/rollback.sh

# Or specify a specific backup
./migration/scripts/rollback.sh --backup-path /workspaces/web/migration/backups/pre_migration_YYYYMMDD_HHMMSS
```

### Backup Verification
```bash
# List available backups
ls -la migration/backups/

# View backup details
cat migration/backups/pre_migration_*/backup_summary.txt
```

### Status Monitoring
```bash
# Monitor migration progress
tail -f migration/logs/full_migration_*.log

# Check specific phase logs
ls migration/logs/phase*.log
```

## EXPECTED RESULTS

### Before Migration
```
/workspaces/web/
├── 54+ markdown files in root directory
├── custom-elements-research/ (framework code)
├── docs/ (existing documentation)
├── documentation/ (duplicate docs)
└── scattered configuration files
```

### After Migration
```
/workspaces/web/
├── README.md (main project README)
├── CLAUDE.md (preserved AI instructions)
├── package.json (workspace configuration)
├── docs/ (organized documentation)
│   ├── 01-strategic/ (strategic planning)
│   ├── 02-technical/ (technical docs)
│   ├── 03-implementation/ (implementation guides)
│   ├── 04-progress/ (progress tracking)
│   ├── 05-research/ (research documentation)
│   └── archive/ (deprecated content)
├── framework/ (consolidated framework)
│   ├── src/ (source code)
│   ├── tests/ (test suite)
│   ├── benchmarks/ (performance tests)
│   └── examples/ (usage examples)
├── tools/ (development tools)
└── migration/ (migration system preserved)
```

## FILE MAPPING SUMMARY

### Strategic Documents (→ docs/01-strategic/)
- `STRATEGIC-PLANNING-END-TO-END.md` → `docs/01-strategic/master-plans/end-to-end-strategy.md`
- `MASTER-IMPLEMENTATION-ROADMAP-REFORMULATED.md` → `docs/01-strategic/roadmaps/master-implementation.md`
- `COMPLEX-COMPONENTS-EVOLUTION-STRATEGY.md` → `docs/01-strategic/business-analysis/complex-components-strategy.md`
- `VISUAL-DEMONSTRATION-PLATFORM-PLAN.md` → `docs/01-strategic/business-analysis/visual-demo-platform.md`

### Technical Documents (→ docs/02-technical/)
- `NATIVE-WEB-COMPONENTS-FRAMEWORK-*.md` → `docs/02-technical/architecture/`
- `VALIDATION-FRAMEWORK.md` → `docs/02-technical/specifications/validation-framework.md`

### Implementation Phases (→ docs/03-implementation/)
- `PHASE-I-*.md` → `docs/03-implementation/phases/phase-1/`
- `PHASE-II-*.md` → `docs/03-implementation/phases/phase-2/`
- `PHASE-III-*.md` → `docs/03-implementation/phases/phase-3/`

### Progress Tracking (→ docs/04-progress/)
- `DAY-*.md` → `docs/04-progress/daily-logs/`
- `WEEK-*.md` → `docs/04-progress/weekly-reports/`
- `*HANDSHAKE*.md` → `docs/04-progress/handshakes/`
- `WINDOW-*.md` → `docs/04-progress/handshakes/`

### Framework Code (→ framework/)
- `custom-elements-research/src/` → `framework/src/`
- `custom-elements-research/tests/` → `framework/tests/`
- `custom-elements-research/benchmarks/` → `framework/benchmarks/`
- `custom-elements-research/examples/` → `framework/examples/`

## VALIDATION CHECKLIST

### Post-migration Verification
- [ ] All 139 markdown files accounted for
- [ ] Framework builds successfully (`npm run build`)
- [ ] All tests pass (`npm run test`)
- [ ] Documentation structure is logical
- [ ] Internal links still work
- [ ] No broken dependencies
- [ ] Git status is clean
- [ ] Performance benchmarks unchanged

### File Count Verification
```bash
# Count markdown files (should be ~139)
find /workspaces/web -name "*.md" -not -path "*/node_modules/*" | wc -l

# Count root directory files (should be minimal)
find /workspaces/web -maxdepth 1 -name "*.md" | wc -l

# Count framework files (should be 90+)
find /workspaces/web/framework -type f | wc -l

# Count docs files (should be 100+)
find /workspaces/web/docs -name "*.md" | wc -l
```

## TROUBLESHOOTING

### Common Issues

#### 1. Permission Errors
```bash
# Fix script permissions
chmod +x migration/scripts/*.sh
```

#### 2. Disk Space Issues
```bash
# Check available space
df -h /workspaces/web

# Clean up if needed
rm -rf custom-elements-research/node_modules
```

#### 3. Backup Not Found
```bash
# List available backups
ls -la migration/backups/

# Create manual backup if needed
./migration/scripts/backup.sh
```

#### 4. Migration Stuck
```bash
# Check running processes
ps aux | grep migration

# Check logs for errors
tail -f migration/logs/full_migration_*.log
```

### Recovery Procedures

#### Partial Migration Failure
```bash
# Stop current migration
pkill -f migration

# Restore from backup
./migration/scripts/rollback.sh

# Fix issues and retry
./migration/scripts/full-migration.sh
```

#### Corrupted State
```bash
# Emergency restoration
./migration/scripts/rollback.sh --backup-path migration/backups/pre_migration_LATEST

# Verify restoration
npm run validate
```

## POST-MIGRATION TASKS

### 1. Dependency Installation
```bash
# Install workspace dependencies
npm install

# Verify installation
npm list --depth=0
```

### 2. Framework Validation
```bash
# Build framework
npm run build

# Run tests
npm run test

# Run benchmarks
npm run benchmark
```

### 3. Documentation Update
```bash
# Update internal links if needed
# Review docs/README.md for navigation
# Update any hardcoded file paths
```

### 4. Git Commit
```bash
# Stage all changes
git add .

# Commit migration
git commit -m "Complete project reorganization

- Moved 50+ root markdown files to organized docs structure
- Consolidated custom-elements-research into framework/
- Created workspace configuration with monorepo support
- Organized documentation by category and purpose
- Preserved all critical files and functionality

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

## PERFORMANCE IMPACT

### Expected Improvements
- **Faster navigation**: Logical directory structure
- **Better maintenance**: Clear separation of concerns
- **Improved builds**: Workspace optimization
- **Reduced confusion**: Organized documentation

### Metrics to Monitor
- Build time before/after migration
- Test execution time
- File search performance
- Developer onboarding time

## SUPPORT AND RECOVERY

### Log Locations
- Migration logs: `migration/logs/`
- Backup location: `migration/backups/`
- Validation reports: Tool-generated

### Emergency Contacts
- Migration system: Check `migration/scripts/rollback.sh`
- Backup verification: Check `migration/backups/*/backup_summary.txt`
- Project validation: Run `npm run validate`

---

**Migration System Status: READY FOR EXECUTION**

The comprehensive migration mapping system is now complete and ready for safe execution. All scripts include validation, rollback capabilities, and detailed logging for complete control and safety throughout the process.
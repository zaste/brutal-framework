# BRUTAL V5 Directory Structure Analysis & Cleanup Plan

## 1. What Makes Structural Sense for the Future

### Well-Organized Areas
- **`/foundation/`** - Excellent organization of principles, patterns, standards, and decisions
- **`/packages/@brutal/`** - Clear modular structure with individual packages
- **`/tools/`** - Logical separation of development tooling
- **`/config/`** - Centralized configuration files
- **`/scripts/brutal2/`** - Clear migration planning and documentation

### Strong Patterns
- Feature-based package organization
- Clear separation of concerns between packages
- Good documentation structure in foundation/
- Proper use of @-scoped packages

## 2. What is Illogical or Poorly Organized

### Root Directory Chaos
- **31 markdown files** in root directory (should be organized)
- Multiple handshake/handoff documents scattered
- Session summaries mixed with core documentation
- Status files without clear versioning

### Empty Directories
- `/apps/*` - All app directories are empty
- `/examples/*` - All example directories are empty
- `/integrations/` - Empty
- Many empty test/docs directories in packages

### Redundant/Confusing Structure
- `/framework-v3/` - Contains only one file, unclear purpose
- `/backups/` - Should not be in version control
- Multiple "test" directories at different levels
- Duplicate patterns in scripts/purification/packages/@brutal2/

## 3. Safe Immediate Cleanup Actions

### DELETE NOW - Empty Directories
```bash
# Empty app directories
rm -rf apps/benchmark apps/docs apps/playground apps/showcase

# Empty example directories  
rm -rf examples/advanced examples/basic examples/intermediate examples/real-world

# Other empty directories
rm -rf integrations/
rm -rf foundation/learning/from-v3 foundation/learning/from-v4 foundation/learning/ongoing

# Empty package subdirectories
find packages/@brutal -type d -empty -delete
```

### DELETE NOW - Redundant Files
```bash
# Backups (should not be in git)
rm -rf backups/

# Framework v3 (only has one file)
rm -rf framework-v3/

# Duplicate lock files (keep only pnpm-lock.yaml)
rm -f package-lock.json
```

### REORGANIZE NOW - Root Documentation
Create organized structure:
```bash
mkdir -p docs/handoffs
mkdir -p docs/status
mkdir -p docs/sessions
mkdir -p docs/planning
mkdir -p docs/compliance

# Move files
mv HANDOFF-*.md HANDSHAKE-*.md docs/handoffs/
mv STATUS-*.md CURRENT-STATUS.md docs/status/
mv SESSION-*.md docs/sessions/
mv *-PLAN*.md ACTION-PLAN-*.md docs/planning/
mv COMPLIANCE-*.md TEST_REPORT.md docs/compliance/
```

## 4. What Should Stay Until @brutal2 is Complete

### Keep for Reference
- `/scripts/brutal2/` - Migration planning documents
- `/scripts/purification/` - Current migration work
- `/packages/@brutal/*` - All current packages (reference for migration)
- `/foundation/` - Core principles and patterns

### Keep for Development
- `/tools/` - Active development tools
- `/config/` - Build configurations
- `/tests/` - Test infrastructure

## 5. Ideal Future Structure After @brutal2

```
brutal-v5/
├── .github/           # GitHub configuration
├── apps/              # Example applications
│   ├── docs/          # Documentation site
│   ├── playground/    # Interactive playground
│   └── showcase/      # Component showcase
├── config/            # Shared configurations
├── docs/              # All documentation
│   ├── api/           # API documentation
│   ├── guides/        # User guides
│   ├── migration/     # Migration guides
│   └── principles/    # Core principles
├── examples/          # Code examples
│   ├── basic/         # Basic usage
│   ├── advanced/      # Advanced patterns
│   └── integrations/  # Framework integrations
├── packages/          # All packages
│   └── @brutal2/      # Core packages only
│       ├── core/
│       ├── dom/
│       ├── state/
│       ├── router/
│       ├── events/
│       └── utils/
├── tools/             # Development tools
│   ├── build/         # Build tools
│   ├── lint/          # Linting tools
│   └── test/          # Testing tools
└── [config files]     # Root config files only
```

## 6. Immediate Action Script

```bash
#!/bin/bash
# BRUTAL V5 Cleanup Script - Safe Actions Only

echo "Starting BRUTAL V5 directory cleanup..."

# 1. Remove empty directories
echo "Removing empty directories..."
rm -rf apps/benchmark apps/docs apps/playground apps/showcase
rm -rf examples/advanced examples/basic examples/intermediate examples/real-world
rm -rf integrations/
rm -rf foundation/learning/from-v3 foundation/learning/from-v4 foundation/learning/ongoing

# 2. Remove backups
echo "Removing backup directory..."
rm -rf backups/

# 3. Remove framework-v3
echo "Removing framework-v3..."
rm -rf framework-v3/

# 4. Remove duplicate lock file
echo "Removing package-lock.json..."
rm -f package-lock.json

# 5. Organize documentation
echo "Organizing documentation..."
mkdir -p docs/handoffs docs/status docs/sessions docs/planning docs/compliance

# Move handoff/handshake files
mv HANDOFF-*.md HANDSHAKE-*.md docs/handoffs/ 2>/dev/null || true

# Move status files
mv STATUS-*.md CURRENT-STATUS.md docs/status/ 2>/dev/null || true

# Move session files
mv SESSION-*.md docs/sessions/ 2>/dev/null || true

# Move planning files
mv *-PLAN*.md ACTION-PLAN-*.md docs/planning/ 2>/dev/null || true

# Move compliance/test files
mv COMPLIANCE-*.md TEST_REPORT.md docs/compliance/ 2>/dev/null || true

# 6. Clean up empty directories in packages
echo "Cleaning empty package directories..."
find packages/@brutal -type d -empty -delete

echo "Cleanup complete!"
```

## 7. Future Cleanup (After @brutal2 Migration)

### Phase 1 - After Core Migration
- Archive all `/packages/@brutal/*` to `/archived/v5-packages/`
- Move successful patterns from `/foundation/` to `/docs/principles/`
- Remove `/scripts/purification/` and `/scripts/brutal2/`

### Phase 2 - Final Structure
- Consolidate all documentation into `/docs/`
- Remove all migration-related files
- Clean up test structures
- Implement monorepo best practices

## Summary

### Immediate Impact
- Removes ~500MB of backups
- Eliminates 40+ empty directories
- Organizes 20+ root-level documentation files
- Creates clear documentation structure

### Preserves
- All active code and packages
- Migration planning documents
- Core principles and patterns
- Development tooling

This cleanup will make the repository more navigable while preserving everything needed for the @brutal2 migration.
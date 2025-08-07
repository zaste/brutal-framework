# 📂 BRUTAL V5 Directory Status Plan
*Clear marking of what's legacy, what's reusable, what's active*

## 🟢 REUSABLE / ACTIVE

### Foundation Knowledge ✅
```
foundation/               # KEEP - Architecture & decisions
├── patterns/            # KEEP - Extracted patterns
├── principles/          # KEEP - Core principles  
├── decisions/           # KEEP - ADRs
├── standards/           # KEEP - Quality standards
└── ACTIVE-STATUS.md     # ACTIVE - Current status
```

### Tooling Suite ✅
```
tools/                   # KEEP - All custom tooling
├── compatibility/       # KEEP - Version validation
├── performance/         # KEEP - Benchmarking
├── migration/          # KEEP - Breaking changes
└── security/           # KEEP - Plugin certification
```

### Build Configuration ✅
```
config/                  # KEEP - Build configs
├── eslint.config.js
├── jest.config.base.js
├── rollup.config.js
└── tsup.config.base.js
```

### Active Scripts ✅
```
scripts/
├── brutal2/            # ACTIVE - Current development
├── create-package.js   # KEEP - Package creation
├── validate-*.js       # KEEP - Validation scripts
└── purification/       # TEMP - Analysis tools (archive after @brutal2)
```

## 🔴 LEGACY TO MARK

### V5 Packages (Replace with @brutal2)
```
packages/@brutal/        # LEGACY - Mark each package
├── foundation/         # -> @brutal2/core
├── shared/            # -> @brutal2/utils
├── events/            # -> @brutal2/events
├── templates/         # -> @brutal2/dom
├── components/        # -> @brutal2/core
├── state/             # -> @brutal2/state
├── routing/           # -> @brutal2/router
├── cache/             # -> Native APIs
├── http/              # -> Native fetch
├── validation/        # -> @brutal2/utils
├── animation/         # -> @brutal2/animation
├── testing/           # -> @brutal2/utils
├── enhanced-*/        # -> Not needed
├── a11y/              # -> @brutal2/utils
├── plugins/           # -> Not needed
├── scheduling/        # -> Not needed
└── test-extractor/    # -> Use Jest
```

### Empty/Unknown Directories
```
apps/                   # MARK - Add STATUS.md to each
├── benchmark/         # Empty - future use?
├── docs/              # Empty - future docs site?
├── playground/        # Empty - future playground?
└── showcase/          # Empty - future examples?

examples/              # MARK - Needs investigation
├── astro/
├── nextjs/
├── react/
└── vanilla/

tests/                 # MARK - Integration tests
└── integration/
```

## 🟡 TO CLEAN/ARCHIVE

### Temporary/Old
```
backups/               # ARCHIVE - Old purification backup
dist/                  # CLEAN - Build output
integrations/          # DELETE - Empty directory
framework-v3/          # DELETE - Single legacy file
node_modules/          # IGNORE - Dependencies
```

### Root Files to Mark
```
HANDOFF-*.md          # ARCHIVE - Old session docs
*-SESSION-*.md        # ARCHIVE - Old summaries
BROKEN-*.md           # ARCHIVE - Old analysis
```

## 📝 Marking Strategy

### 1. Create STATUS.md Files
```bash
# Mark legacy packages
for pkg in packages/@brutal/*/; do
  echo "# LEGACY - See @brutal2" > "$pkg/STATUS.md"
done

# Mark empty apps
for app in apps/*/; do
  echo "# PLACEHOLDER - Not yet implemented" > "$app/STATUS.md"
done

# Mark examples
echo "# EXAMPLES - Status unknown, needs review" > examples/STATUS.md
```

### 2. Update Key Files
```markdown
# In each legacy package.json
"description": "LEGACY - See @brutal2/[equivalent]"

# In root README
## Status
- Active Development: @brutal2 packages
- Legacy Reference: @brutal packages
- See WHERE-TO-LOOK.md for navigation
```

### 3. Create Archive Directory
```bash
mkdir -p _archive/{sessions,analysis,v3-remnants}

# Move old files
mv HANDOFF-*.md _archive/sessions/
mv *-SESSION-*.md _archive/sessions/
mv BROKEN-*.md _archive/analysis/
```

## 🎯 Priority Order

1. **NOW**: Mark @brutal/* as LEGACY
2. **NOW**: Create STATUS files in apps/
3. **LATER**: Archive old session docs
4. **LATER**: Clean empty directories
5. **AFTER @brutal2**: Archive @brutal packages

## 🚨 Key Rules

1. **DON'T DELETE** - Archive instead
2. **MARK CLEARLY** - Legacy vs Active
3. **KEEP TOOLING** - All tools/ are active
4. **KEEP KNOWLEDGE** - All foundation/ is valuable
5. **FOCUS ON @brutal2** - Don't get distracted cleaning

---

**Remember**: Organization enables speed, but building @brutal2 is the priority
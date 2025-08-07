# 📁 BRUTAL V4 - Project Organization

## 🏗️ Directory Structure

```
brutal-v4/
├── README.md                 # Main project documentation
├── PROJECT-STATUS.md         # Current project status
│
├── core/                     # ✅ Core framework (COMPLETE)
│   ├── foundation/          # Base classes (Component, State, etc.)
│   ├── scheduling/          # RenderScheduler with RAF
│   ├── templates/           # Modularized template system (7 files)
│   ├── performance/         # Modularized performance (8 files)
│   ├── events/              # Event system with WeakMaps
│   ├── utils/               # Utilities (Registry, FeatureDetection)
│   └── design/              # Design system integration
│
├── components/              # ⚠️ Component library (3/99+)
│   ├── Button.js           # Demo button component
│   ├── Input.js            # Input with ElementInternals
│   └── Modal.js            # Basic modal component
│
├── workers/                 # ✅ Worker infrastructure (READY)
│   ├── core/               # WorkerManager, Pool, Message, Proxy
│   └── templates/          # Worker templates
│
├── build/                   # ✅ Build system (COMPLETE)
│   ├── config.js           # Build configuration
│   ├── env.js              # Environment detection
│   └── build.js            # Zero-dependency builder
│
├── tests/                   # ✅ Test files (HTML based)
│   ├── test-*.html         # Individual feature tests
│   └── (10 test files)     # Manual verification tests
│
├── validation/              # ✅ Validation suite (COMPLETE)
│   ├── pre-phase2-integration-test.html
│   ├── performance-validation.html
│   └── pre-phase2-validator.js
│
├── testing/                 # ❌ EMPTY - brutal-test not integrated
│   ├── core/               # (empty)
│   ├── runners/            # (empty)
│   ├── assertions/         # (empty)
│   ├── visual/             # (empty)
│   └── performance/        # (empty)
│
├── docs/                    # ✅ Documentation (ORGANIZED)
│   ├── README.md           # Documentation hub
│   ├── PROJECT-ORGANIZATION.md  # This file
│   ├── ACTUAL-STATE-VS-PLANNED.md
│   ├── architecture/       # Architecture documents
│   ├── planning/           # Planning documents
│   ├── progress/           # Progress reports (Day 1-4)
│   └── decisions/          # Architectural decisions
│
├── visual/                  # ❌ NOT IMPLEMENTED
└── tools/                   # ❌ NOT IMPLEMENTED
```

## 📋 File Organization Rules

### 1. **Root Directory**
Only essential files belong in root:
- `README.md` - Main project documentation
- `PROJECT-STATUS.md` - Current status tracking
- Configuration files (if needed)

### 2. **Documentation**
All documentation goes in `/docs/`:
- Architecture → `/docs/architecture/`
- Planning → `/docs/planning/`
- Progress → `/docs/progress/`
- Decisions → `/docs/decisions/`

### 3. **Code Organization**
- Core functionality → `/core/`
- UI Components → `/components/`
- Worker code → `/workers/`
- Build scripts → `/build/`

### 4. **Test Organization**
- Test files → `/tests/`
- Validation tools → `/validation/`
- Test framework → `/testing/` (when integrated)

## 🧹 Cleanliness Standards

### DO ✅
- Keep modules under 400 lines
- One responsibility per file
- Clear, descriptive file names
- Proper directory hierarchy
- Regular cleanup of temporary files

### DON'T ❌
- Leave backup files (.backup, .old, ~)
- Create files in root directory
- Mix test and source files
- Leave empty directories without purpose
- Duplicate documentation

## 📊 Current State

### Clean & Organized ✅
- `/core/` - Well-structured, modularized
- `/docs/` - Properly categorized
- `/build/` - Minimal, focused
- `/workers/` - Clear separation

### Needs Attention ⚠️
- `/components/` - Only 3/99+ components
- `/testing/` - Empty, needs integration

### Not Started ❌
- `/visual/` - No implementation
- `/tools/` - No implementation

## 🔄 Maintenance Tasks

### Daily
- Remove temporary files
- Organize new documentation
- Keep test files in `/tests/`

### Weekly
- Review module sizes
- Clean up old backups
- Update PROJECT-STATUS.md

### Per Phase
- Archive completed phase docs
- Update architecture docs
- Reorganize as needed

## 📝 Notes

1. **brutal-test** exists at `/workspaces/web/brutal-test/` but is NOT integrated
2. **Pre-Phase 2** documentation has been moved to `/docs/progress/`
3. **Validation suite** is separate from test framework (intentional)
4. **Empty directories** indicate planned but not implemented features

---

*Keep the room clean and organized - ALWAYS!*
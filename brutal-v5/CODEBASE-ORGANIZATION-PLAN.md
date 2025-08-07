# 🗂️ V5 Codebase Organization Plan
*Clear separation: Active vs Legacy vs Archive*

## 🎯 Directory Structure

```
brutal-v5/
├── packages/
│   ├── @brutal2/        # ✅ ACTIVE DEVELOPMENT
│   │   └── [7 packages] # The future, clean implementation
│   │
│   ├── @brutal/         # 📚 LEGACY REFERENCE
│   │   └── [19 packages]# Learn from, but don't modify
│   │
│   └── _archived/       # 🗄️ TO CREATE - Redundant implementations
│       └── [move duplicates here]
│
├── scripts/
│   ├── brutal2/         # ✅ ACTIVE - Current planning
│   └── purification/    # 🗄️ ARCHIVE - Old approach
│
└── foundation/
    ├── ACTIVE-STATUS.md # ✅ TO CREATE - Current state
    └── *.md             # 📚 Keep all docs
```

## 📋 Immediate Actions

### 1. Create Status Markers
```bash
# Mark active development
echo "# ACTIVE DEVELOPMENT - @brutal2" > packages/@brutal2/STATUS.md
echo "# LEGACY - Learn from but don't modify" > packages/@brutal/STATUS.md
```

### 2. Archive Redundant Code
```bash
# Create archive structure
mkdir -p packages/_archived/{templates,components,state}

# Move redundant implementations (keep one reference)
# Example: 7 template implementations → keep 1, archive 6
```

### 3. Create Navigation Guide
```markdown
# WHERE-TO-LOOK.md

## For New Development
- Look ONLY in: packages/@brutal2/
- Current plan: scripts/brutal2/MASTER-PLAN-V5-BRUTAL2.md

## For Learning/Reference  
- Look in: packages/@brutal/*/src/minimal.ts
- Best examples: animation, validation, testing

## Never Look In
- packages/_archived/ (unless debugging history)
- scripts/purification/ (abandoned approach)
```

## 🏷️ Tagging Strategy

### File Headers
```typescript
// @brutal2/core/src/index.ts
/**
 * @brutal2 - ACTIVE DEVELOPMENT
 * Clean implementation - Zero dependencies
 */

// @brutal/templates/src/index.ts
/**
 * LEGACY - Reference only
 * See @brutal2/dom for active development
 */
```

### Package.json Markers
```json
{
  "name": "@brutal/templates",
  "description": "LEGACY - See @brutal2/dom",
  "brutal:status": "legacy"
}

{
  "name": "@brutal2/dom",
  "description": "ACTIVE - Template system",
  "brutal:status": "active"
}
```

## 🧹 Cleanup Plan

### Phase 1: Mark & Tag (NOW)
1. Add STATUS.md to each directory
2. Update package.json descriptions
3. Create WHERE-TO-LOOK.md

### Phase 2: Archive Redundant (Day 1)
1. Keep best implementation in @brutal
2. Move duplicates to _archived
3. Update imports to point to kept version

### Phase 3: Document Learnings (Day 2)
1. Extract patterns from minimal.ts files
2. Document in @brutal2/PATTERNS.md
3. Create migration map

## 📍 Session Restart Guide

When returning to this project:
```bash
# 1. Check active status
cat packages/@brutal2/STATUS.md

# 2. Review current plan  
cat scripts/brutal2/MASTER-PLAN-V5-BRUTAL2.md

# 3. Check progress
cat scripts/brutal2/DAY-*-PROGRESS.md

# 4. Never edit @brutal/* packages
# 5. Focus only on @brutal2/*
```

## ⚠️ Critical Rules

1. **NEVER** modify @brutal/* (legacy reference)
2. **ALWAYS** work in @brutal2/* (active)
3. **ARCHIVE** don't delete (might need later)
4. **TAG** everything clearly
5. **DOCUMENT** decisions immediately

---

**Clean codebase = Clear mind = Fast progress**
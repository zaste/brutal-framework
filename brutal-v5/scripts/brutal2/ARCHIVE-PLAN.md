# 🗄️ Archive Plan - What to Move

## Redundant Implementations to Archive

### Templates (6 extra implementations)
```
KEEP: packages/@brutal/templates/src/minimal.ts
ARCHIVE:
- src/compiler/*
- src/core/*  
- src/engine/*
- src/template/*
- src/ultra-minimal.ts
```

### Components (2 extra base classes)
```
KEEP: packages/@brutal/components/src/minimal.ts
ARCHIVE:
- src/base/Component.ts
- src/base/BrutalComponent.ts
```

### State (2 extra stores)
```
KEEP: packages/@brutal/state/src/minimal.ts  
ARCHIVE:
- src/store/core.ts
- src/store/store.ts (if duplicate)
```

## Archive Structure
```
packages/_archived/
├── README.md ("Archived implementations - DO NOT USE")
├── templates/
│   ├── compiler/
│   ├── core/
│   └── engine/
├── components/
│   └── base/
└── state/
    └── store/
```

## Why Archive vs Delete?
1. **Safety**: Might need to check something
2. **History**: Understand evolution
3. **Learning**: See what didn't work
4. **Rollback**: Just in case

## When to Archive?
- After @brutal2 equivalent is working
- When tests pass
- Not critical for Day 0-1

---
**Note**: Archiving is low priority - focus on @brutal2 first
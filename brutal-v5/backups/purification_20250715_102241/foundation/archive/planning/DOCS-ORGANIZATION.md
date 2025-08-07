# 📚 BRUTAL V5 - Documentation Organization Strategy

## Hybrid Approach: Visible + Organized

### Core Principle
Keep **operational docs** in root for visibility, organize **knowledge/reference** in subdirectories.

## Proposed Structure

```
brutal-v5/
├── README.md                    # 🎯 Entry point
├── ARCHITECTURE.md              # 🏗️ Current architecture (operational)
├── PENDING-DECISIONS.md         # ❓ Active decisions needed
├── CONTRIBUTING.md              # 🤝 How to contribute
├── LICENSE                      # ⚖️ Legal
├── SECURITY.md                  # 🔐 Security policy
├── CODE_OF_CONDUCT.md          # 📜 Community standards
│
├── docs/                        # 📁 Organized knowledge base
│   ├── decisions/              # 🎯 Architecture Decision Records (ADRs)
│   │   ├── 001-monorepo-structure.md
│   │   ├── 002-zero-dependencies.md
│   │   └── README.md          # Index of decisions
│   │
│   ├── phase-0/                # 📋 Phase 0 artifacts (completed)
│   │   ├── PHASE-0-FOUNDATION.md
│   │   ├── PHASE-0-COMPLETE.md
│   │   ├── LESSONS-LEARNED.md
│   │   └── archive/            # Old iterations
│   │
│   ├── architecture/           # 🏛️ Architecture deep dives
│   │   ├── ARCHITECTURE-V2.md
│   │   ├── BUNDLE-MAP.md
│   │   ├── DIRECTORY-FINAL.md
│   │   └── alternatives/       # Considered but not chosen
│   │
│   ├── standards/              # 📏 Quality & process standards
│   │   ├── QUALITY-STANDARDS.md
│   │   ├── GOVERNANCE.md
│   │   ├── STRUCTURE-CHECKLIST.md
│   │   └── MASTER-VALIDATION.md
│   │
│   └── planning/               # 🗺️ Future planning
│       ├── FEEDBACK-INTEGRATION.md
│       └── roadmap/
│
├── .github/                    # 🤖 GitHub specific
│   ├── ISSUE_TEMPLATE/
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── workflows/
│
└── scripts/                    # 🔧 Tooling
    └── validate-structure.js
```

## What Stays in Root vs What Moves

### Keep in Root (High Traffic):
1. **README.md** - First thing people see
2. **ARCHITECTURE.md** - Current system design 
3. **PENDING-DECISIONS.md** - Active items needing attention
4. **CONTRIBUTING.md** - How to help
5. **Standard files** - LICENSE, SECURITY, CODE_OF_CONDUCT

### Move to docs/ (Reference):
1. **Historical** - Phase 0 planning docs
2. **Alternatives** - ARCHITECTURE-V2, other options considered
3. **Deep dives** - Detailed explanations
4. **Standards** - Quality metrics, governance
5. **Analysis** - CLEANUP-ANALYSIS, etc.

## Implementation Strategy

### Phase 1: Create Structure
```bash
# Create the organized structure
mkdir -p docs/{decisions,phase-0,architecture,standards,planning}
mkdir -p docs/phase-0/archive
mkdir -p docs/architecture/alternatives
```

### Phase 2: Move with Redirects
Create simple redirects in old locations:
```markdown
# PHASE-0-FOUNDATION.md
This document has moved to [docs/phase-0/PHASE-0-FOUNDATION.md](docs/phase-0/PHASE-0-FOUNDATION.md)
```

### Phase 3: Update References
Update all internal links to point to new locations.

## Benefits of This Approach

1. **Discoverability** - Important docs stay visible
2. **Organization** - Knowledge is categorized
3. **History** - Phase 0 preserved but archived
4. **Scalability** - Clear where new docs go
5. **Navigation** - Each subfolder has README index

## What's Missing?

### 1. Decision Tracking
We need formal Architecture Decision Records (ADRs):
```markdown
# ADR-001: Monorepo Structure
Status: Accepted
Date: 2024-07-12

## Context
[Why we needed to make this decision]

## Decision
[What we decided]

## Consequences
[What happens as a result]
```

### 2. Auto-generated Index
Script to generate index of all docs:
```javascript
// scripts/generate-docs-index.js
// Scans docs/ and creates README with links
```

### 3. Version Strategy
How do we version architecture docs?
- Option A: Git history only
- Option B: Versioned folders (v1/, v2/)
- Option C: Changelog in each doc

## Next Steps

1. **Agree on structure** - Does this hybrid work?
2. **Create directories** - Set up the structure
3. **Move incrementally** - Start with completed Phase 0 docs
4. **Add indexes** - README in each folder
5. **Update tooling** - Scripts to maintain

---

*Visible when needed, organized when browsing.*
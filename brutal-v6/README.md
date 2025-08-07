# 🚀 BRUTAL V6 - Ultra-Lightweight Web Framework

**Current Status**: In Development (43% Complete) - [See Operational Status](./OPERATIONAL-STATUS-2025-08-07.md)

## 🎯 Mission
Prove that 8.5KB can do EVERYTHING that matters from React's 300KB+

## 📦 Packages

### ✅ Implemented (3.2KB)
- **@brutal/core** (1.6KB) - Composition foundation
- **@brutal/dom** (1.1KB) - Template rendering  
- **@brutal/state** (0.541KB) - Global state management

### 🚧 In Progress (5.3KB remaining)
- **@brutal/events** - Event delegation system
- **@brutal/router** - SPA routing
- **@brutal/animation** - GPU-accelerated animations
- **@brutal/utils** - Shared utilities

## 🏃 Quick Start

### Counter Example (8 lines)
```javascript
import { compose, withState } from '@brutal/core';

const Counter = compose(
  withState({ count: 0 }),
  ({ count, setState }) => ({
    view: () => `<button>${count}</button>`,
    click: () => setState({ count: count + 1 })
  })
);
```

### Running Examples
```bash
cd brutal-v6
npm run dev
# Open http://localhost:3000/packages/@brutal/core/examples/counter.html
```

## 📊 Size Budget
- **Target**: 8.5KB total
- **Used**: 3.2KB (37.6%)
- **Remaining**: 5.3KB (62.4%)

## 🗺️ Project Structure
```
brutal-v6/
├── packages/@brutal/     # Framework packages
├── examples/            # Complete app examples
├── foundation/          # Core principles & rules
├── scripts/            # Build & validation tools
└── archive/            # Historical documentation
```

## 📚 Key Documents
- [North Star Vision](./NORTH-STAR.md) - Original vision and goals
- [Operational Status](./OPERATIONAL-STATUS-2025-08-07.md) - Current state and timeline
- [Foundation Principles](./foundation/README.md) - Core design decisions

## ⚠️ Current Limitations
- No routing yet (can't build full SPAs)
- No animation system
- Event handling is basic
- Missing several React features

## 🎯 Next Steps
See [Operational Status](./OPERATIONAL-STATUS-2025-08-07.md) for detailed timeline options and recommendations.

---

*BRUTAL V6 is an experimental framework exploring the limits of minimalism in web development.*
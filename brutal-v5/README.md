# 🔥 BRUTAL V5

> Zero-dependency, modular web framework that delivers maximum performance with minimal complexity.

> ✅ **Distilled**: 2024-07-12  
> - Quick start strategy → [pattern](./foundation/patterns/architecture/quick-start-strategy.md)
> - Living foundation → [pattern](./foundation/patterns/governance/phased-development.md)
> - Bundle sizes → [pattern](./foundation/patterns/architecture/bundle-composition.md)
> - Learning journey → [pattern](./foundation/patterns/learning/version-evolution.md)
> - **Complete implementation guide** → [V5 Core Guide](./foundation/V5-CORE-IMPLEMENTATION-GUIDE.md)
> - **Step-by-step roadmap** → [Implementation Roadmap](./foundation/IMPLEMENTATION-ROADMAP.md)

## 🎯 Project Status: Living Foundation

BRUTAL V5 has a [living foundation](./foundation/patterns/governance/phased-development.md) that evolves with the project. Core architecture is defined, with 5 decisions pending input.

## 📚 Quick Links

### Start Here
1. **[foundation/](./foundation/)** - Complete implementation knowledge
2. **[V5 Core Implementation Guide](./foundation/V5-CORE-IMPLEMENTATION-GUIDE.md)** - Start here
3. **[Implementation Roadmap](./foundation/IMPLEMENTATION-ROADMAP.md)** - Follow this plan
4. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System design overview

### Pending Decisions
- **[5 decisions need your input](./foundation/decisions/pending/)** 

### Key Resources
- **[🧬 Pattern Library](./foundation/patterns/)** - Distilled knowledge from V3/V4/V5
- **[🗺️ Knowledge Map](./foundation/KNOWLEDGE-MAP.md)** - What's been extracted where
- **[Quality Standards](./foundation/standards/quality/)** - Our bar for excellence
- **[Contributing](./CONTRIBUTING.md)** - How to help

## 🏗️ Architecture Summary

### Core Principles
- **Zero Runtime Dependencies** - No exceptions, ever
- **Modular by Design** - 30+ independent packages
- **Performance First** - <30KB core, <50ms init
- **Quality Enforced** - 95% coverage minimum
- **Developer Experience** - Simple things simple

### Bundle Sizes
| Bundle | Size | Use Case |
|--------|------|----------|
| `brutal-lite.js` | 15KB | Landing pages |
| `brutal-core.js` | 35KB | SPAs |
| `brutal-enhanced.js` | 50KB | Complex apps |
| `brutal-ui.js` | 80KB | With UI library |
| `brutal-full.js` | 150KB | Everything |

## 🚀 Quick Start (When Released)

```bash
# Create new app
npx create-brutal-app my-app

# Or install specific packages
npm install @brutal/core @brutal/forms

# Or use CDN
<script src="https://unpkg.com/brutal/brutal-core.js"></script>
```

## 📦 Package Structure

```
packages/
├── @brutal/foundation     # Core primitives
├── @brutal/components     # Web Components
├── @brutal/state         # State management
├── @brutal/routing       # SPA routing
├── @brutal/templates     # Template engine
└── ... 30+ packages
```

## 🔍 What We've Learned

This is V5 because we've learned from:
- **V2 Spec**: Original capabilities and design patterns
- **V3**: 300+ capabilities, but monolithic (~800KB)
- **V4**: Better architecture (100% complete core)
- **brutal-test**: Testing should be symbiotic
- **Community Feedback**: 10+ architectural improvements

V5 captures 95%+ of all capabilities in a modular, zero-dependency architecture.

## 🚀 What's Next

See [ROADMAP.md](./ROADMAP.md) for current focus. We work in continuous iterations, not phases:

### This Week
- Resolve 5 pending decisions
- Create @brutal/foundation package
- Setup monorepo tooling
- Implement test-extractor

### Next Month  
- All 11 core packages
- Enhanced packages
- Migration tooling
- Documentation site

## 🤝 Contributing

We're building the foundation. You can help by:
1. **Review [pending decisions](./foundation/decisions/pending/)**
2. **Test early packages** (coming soon)
3. **Share feedback** via issues
4. **Submit PRs** once we have code

See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

## 📈 Why BRUTAL V5?

1. **Learned from 3+ years** of framework development
2. **Zero compromises** on quality or performance
3. **Modular from core** - use only what you need
4. **Future-proof** - built on web standards
5. **Community-driven** - transparent governance

## 🔗 Links

- Documentation: (Coming soon)
- Playground: (Coming soon)
- Discord: (Coming soon)
- Twitter: (Coming soon)

## 📄 License

MIT © 2024 BRUTAL Team

---

*Currently in Phase 0: Laying the perfect foundation. No code until we're 100% aligned.*
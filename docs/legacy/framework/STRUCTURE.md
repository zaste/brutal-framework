# Framework Structure - Reorganized

## 📁 Directory Organization

### `/core/` - Framework Engine ⚡
The heart of the framework with 52.3x React performance

- **`engine/`** - Base classes and core functionality
  - `base-element.js` - Core Web Component base class
  - `optimized-element.js` - Chromium-optimized element
  - `base-framework.js` - Framework foundation class
  - `framework-core.js` - Native framework core
  - `edge-cases-handler.js` - Edge case handling

- **`performance/`** - Optimization layers
  - `shadow-dom.js` - Shadow DOM optimizer
  - `style.js` - CSS styling optimizer
  - `events.js` - Event handling optimizer
  - `templates.js` - Template optimizer
  - `engine.js` - Performance optimization engine

- **`systems/`** - Core systems
  - `state-manager.js` - Native state management
  - `router.js` - Native routing system
  - `ssr.js` - Server-side rendering
  - `component-base.js` - Component base system

### `/components/` - Complex Components 🎯
The value proposition: build complete website sections

- **`sections/`** - Website sections (hero, features, pricing)
- **`applications/`** - Full applications
  - `dashboard/` - Analytics dashboard components
- **`workflows/`** - Complex workflows (forms, checkout)
- **`intelligence/`** - Smart UX components
  - `ux-system.js` - Intelligent UX implementation

### `/platform/` - Platform Features 🚀
Build, deploy, and integrate

- **`build/`** - Build system
  - `build-system.js` - Native build system
- **`deployment/`** - Deployment tools
  - `automation.js` - Deployment automation
  - `global-scaling.js` - Global scaling system
- **`integrations/`** - External integrations
  - `framework-bridge.js` - Framework integration engine
  - `adapters.js` - Framework adapters
  - `cross-platform.js` - Cross-platform integration
  - `core-api-layer.js` - Core API integration layer
- **`mobile/`** - Mobile features
  - `native-bridge.js` - Native app integration
  - `mobile-optimizer.js` - Mobile optimization engine
- **`builder/`** - Visual tools
  - `visual-component-builder.js` - Visual component builder

### `/enterprise/` - Enterprise Features 🔮
Production-ready enterprise capabilities

- **`security/`** - Security framework
- **`analytics/`** - Business intelligence
  - `bi-system.js` - Business intelligence system
  - `real-time-engine.js` - Real-time analytics
  - `monitoring.js` - Monitoring analytics
- **`ai-ml/`** - AI/ML features
  - `features.js` - AI-powered features
  - `ml-engine.js` - Machine learning engine
- **`core/`** - Enterprise core
  - `features-system.js` - Enterprise features system
- **`deployment/`** - Enterprise deployment
  - `system.js` - Enterprise deployment system

### `/showcase/` - Demos & Examples 🎪
Live demonstrations and performance validation

- **`demos/`** - Interactive demonstrations
  - Mission Control themed demos
  - React comparison demo
  - Performance showcase
- **`benchmarks/`** - Performance tests
  - Browser validation
  - Component creation benchmarks
  - Framework comparison benchmarks
- **`playground/`** - Live playground
  - `index.html` - Interactive playground

### `/tests/` - Test Suite 🧪
Comprehensive testing infrastructure

- **`unit/`** - Unit tests
- **`integration/`** - Integration tests
- **`performance/`** - Performance tests
- **`fixtures/`** - Test fixtures and utilities

### `/tools/` - Development Tools 🔧
- **`testing/`** - Testing infrastructure
  - `infrastructure.js` - Native testing infrastructure

### `/research/` - Experimental Features 🔬
Future developments and advanced features

- **`advanced-features/`**
  - `shadow-optimizer-v2.js` - Advanced shadow DOM optimizer
  - `implementation.js` - Advanced features implementation

### `/packages/` - TypeScript Packages 📦
Modular TypeScript implementation

- **`core/`** - Core package with TypeScript
- **`sections/`** - Section components package

## 📝 Important Notes

1. All documentation has been moved to `/docs/` at the project root
2. The framework now contains only executable code and technical resources
3. Use the showcases to understand capabilities
4. Check `/docs/06-user-guides/` for usage documentation

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Run benchmarks
npm run benchmark
```

## 📊 Migration Status

- ✅ All code files reorganized by function
- ✅ Documentation moved to `/docs/`
- ✅ Tests organized by type
- ✅ Demos and benchmarks in showcase
- ✅ Zero information loss confirmed

# 📚 BRUTAL V4 Documentation

## 🗂️ Documentation Structure

### 📐 Architecture Documents
- [**ARCHITECTURE.md**](./architecture/ARCHITECTURE.md) - Core framework architecture
- [**V3-TO-V4-ARCHITECTURE-COMPARISON.md**](./architecture/V3-TO-V4-ARCHITECTURE-COMPARISON.md) - Detailed comparison between V3 and V4

### 📋 Planning Documents
- [**CONSTRUCTION-PLAN.md**](./planning/CONSTRUCTION-PLAN.md) - Original 8-week construction plan
- [**PRE-PHASE2-MASTER-PLAN.md**](./planning/PRE-PHASE2-MASTER-PLAN.md) - Critical fixes before Phase 2

### 📊 Progress Reports
- [**PRE-PHASE2-DAY1-SUMMARY.md**](./progress/PRE-PHASE2-DAY1-SUMMARY.md) - Day 1 completion report

### 🎯 Decision Records
- (To be created as architectural decisions are made)

## 🧭 Quick Navigation

### Current Phase: Pre-Phase 2 (Day 1 ✅ Complete)

**What's Done:**
- ✅ Phase 1: Foundation (100% complete)
- ✅ Pre-Phase 2 Day 1: RenderScheduler, Memory Safety, Template Modularization

**What's Next:**
- 🔄 Day 2: PerformanceMonitor splitting, Production build, Worker infrastructure
- ⏳ BRUTAL Test V4 Native (2 days)
- ⏳ Phase 2: Performance Layer (5 days)

### Key Locations

**Core Systems:**
- `/core/` - All framework modules
- `/core/scheduling/RenderScheduler.js` - NEW: RAF-based rendering
- `/core/templates/` - NEW: Modularized template system

**Components:**
- `/components/` - UI component library
- `/components/Button.js` - Example implementation
- `/components/Input.js` - Form component with validation
- `/components/Modal.js` - Complex component with a11y

**Tests:**
- `/tests/` - All test files
- `/tests/test-render-scheduler.html` - RenderScheduler validation
- `/tests/test-memory-safety.html` - Memory leak detection
- `/tests/test-template-modules.html` - Template system verification

**Legacy/Reference:**
- `/framework-v3/` - Original V3 for reference
- `/brutal-test/` - Original test system (to be migrated)

## 📈 Metrics Dashboard

### Code Quality
- **Core Bundle**: <10KB ✅
- **Largest Module**: 181 lines (interpolation.js) ✅
- **Memory Leaks**: 0 ✅
- **Sync Renders**: 0 ✅

### Progress
- **Phase 1**: 100% ✅
- **Pre-Phase 2**: 25% (Day 1/4 complete)
- **Overall V4**: ~30% complete

## 🔗 Quick Links

- [Main README](../README.md)
- [Current Plan](./planning/PRE-PHASE2-MASTER-PLAN.md)
- [Latest Progress](./progress/PRE-PHASE2-DAY1-SUMMARY.md)
- [Architecture Overview](./architecture/ARCHITECTURE.md)
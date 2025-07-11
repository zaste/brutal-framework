# BRUTAL V3 - Test System Documentation

## Overview

The BRUTAL V3 test system has been consolidated into a unified, comprehensive testing infrastructure that eliminates redundancies while providing maximum coverage.

## Test System Architecture

### Core Components

1. **ConsolidatedTestSystem** (`test/ConsolidatedTestSystem.js`)
   - Unified test runner with Puppeteer integration
   - Chrome DevTools Protocol (CDP) for deep browser integration
   - All testing capabilities in one place

2. **EnhancedTestHarness** (`test/EnhancedTestHarness.js`)
   - Extended testing for Phase 4 components
   - GPU, gesture, animation, and media testing utilities

3. **ComponentTestHarness** (`test/ComponentTestHarness.js`)
   - Base test harness for component testing
   - Visual regression, performance, and accessibility testing

### Test Runners

1. **run-unified-tests.js** - Main test runner (npm test)
2. **test-orchestrator.js** - Scenario-based testing
3. **ultimate-test-system.js** - Detailed browser capture
4. **browser-test-all.js** - Simple browser testing

## Test Types

### 1. Unit Tests
- Component lifecycle validation
- State management testing
- Shadow DOM verification
- API contract testing

### 2. Integration Tests
- Component interaction testing
- Event flow validation
- Data flow verification

### 3. Visual Tests
- Screenshot comparison
- Visual regression testing
- Multi-viewport testing
- Theme validation

### 4. Performance Tests
- Render performance (60fps target)
- Memory usage tracking
- Bundle size validation
- Core Web Vitals (FCP, LCP, CLS, FID)

### 5. Accessibility Tests
- ARIA compliance
- Keyboard navigation
- Screen reader compatibility
- Color contrast validation

### 6. GPU Tests
- WebGL/WebGPU support
- Shader compilation
- GPU memory usage
- Hardware acceleration

### 7. Gesture Tests
- Touch interaction
- Swipe detection
- Pinch/zoom handling
- Multi-touch support

### 8. Worker Tests
- Web Worker communication
- SharedWorker support
- Worker pool efficiency
- Message passing performance

## Chrome DevTools Protocol Domains

The ConsolidatedTestSystem enables ALL CDP domains for comprehensive data collection:

- **Console** - Capture all console messages
- **Runtime** - Catch JavaScript exceptions
- **Network** - Monitor all network activity
- **Performance** - Detailed performance metrics
- **HeapProfiler** - Memory profiling
- **Tracing** - Performance traces
- **Accessibility** - A11y tree inspection
- **DOM/CSS** - DOM manipulation tracking
- **Animation** - Animation performance
- And 40+ more domains...

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Quick test (skip visual/GPU tests)
npm run test:quick

# Visual test mode (with browser window)
npm run test:visual

# Ultimate test (captures everything)
npm run test:ultimate

# Simple browser test
npm run test:browser
```

### Scenario-Based Testing

```bash
# Test data-intensive components
node test-orchestrator.js dataComponents

# Test GPU-accelerated components
node test-orchestrator.js gpuComponents

# Test all Phase 4 components
node test-orchestrator.js phase4Complete

# Run multiple scenarios
node test-orchestrator.js dataComponents gpuComponents interactiveComponents
```

## Test Configuration

### Environment Variables

- `HEADLESS=false` - Show browser window
- `DEVTOOLS=true` - Open Chrome DevTools
- `QUICK_TEST=true` - Skip time-consuming tests

### Performance Budgets

```javascript
budgets: {
    renderTime: 16.67,      // 60fps
    scriptTime: 50,         // ms
    layoutTime: 50,         // ms
    paintTime: 16.67,       // ms
    memoryLimit: 50MB,      
    bundleSize: 20KB,       
    ttfb: 200,              // Time to first byte
    fcp: 1000,              // First contentful paint
    lcp: 2500,              // Largest contentful paint
    fid: 100,               // First input delay
    cls: 0.1                // Cumulative layout shift
}
```

## Test Output

### Directory Structure

```
test-output/
├── screenshots/         # Visual test screenshots
├── videos/             # Screen recordings
├── traces/             # Performance traces
├── coverage/           # Code coverage reports
├── reports/            # HTML and JSON reports
└── scenarios/          # Scenario-specific results
```

### Reports

1. **test-results.json** - Detailed test results
2. **test-results.html** - Visual HTML report
3. **master-report.json** - Summary across all files
4. **coverage.json** - Code coverage data

## Browser Testing Features

### Real Browser Environment
- CrossOriginIsolated support
- SharedArrayBuffer enabled
- GPU acceleration active
- All web APIs available

### Automated Interactions
- Click all buttons
- Hover over links
- Scroll testing
- Form submission
- Gesture simulation

### Data Collection
- Console messages
- Runtime exceptions
- Network requests/responses
- DOM mutations
- Event listeners
- GPU information
- Performance entries
- Memory snapshots
- Heap profiles

## Writing Tests

### Component Test Example

```javascript
// test-mycomponent.html
<script type="module">
import { MyComponent } from './04-components/MyComponent.js';

// Component will be auto-tested by the test system
customElements.define('my-component', MyComponent);
</script>

<my-component></my-component>
```

### Test Hooks

Components can implement test hooks:

```javascript
class MyComponent extends Component {
    // Called by test system
    __testHook() {
        return {
            criticalPaths: ['render', 'update'],
            performanceBaseline: { render: 5 },
            requiredFeatures: ['gpu', 'workers']
        };
    }
}
```

## Debugging Tests

### Failed Test Investigation

1. Check `test-output/reports/test-results.html`
2. Review screenshots in `test-output/screenshots/`
3. Analyze performance traces
4. Check console logs in test results

### Common Issues

1. **Server not running** - Start with `npm start`
2. **Port conflicts** - Check port 8080
3. **Browser permissions** - Run with `--no-sandbox`
4. **Memory limits** - Increase Node heap size

## Best Practices

1. **Isolate Tests** - Each test should be independent
2. **Clean State** - Reset component state between tests
3. **Real Scenarios** - Test actual user interactions
4. **Performance First** - Always check performance budgets
5. **Accessibility Always** - Never skip a11y tests

## Zero Margin for Error

As requested, the test system ensures:

- ✅ Complete browser API coverage
- ✅ All Chrome DevTools domains enabled
- ✅ Every interaction captured
- ✅ Performance metrics tracked
- ✅ No redundant test code
- ✅ Unified reporting
- ✅ Real browser testing
- ✅ Phase 4 component validation

The consolidated test system provides comprehensive coverage while eliminating all redundancies. Every aspect of the framework can be tested thoroughly with zero margin for error.
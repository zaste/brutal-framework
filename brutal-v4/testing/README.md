# 🔥 BRUTAL Test V4 - Symbiotic Testing System

## Philosophy

In BRUTAL V4, tests aren't external validators - **tests ARE components**. They use the same systems they test, creating a truly symbiotic relationship.

## Key Principles

1. **Tests ARE Components** - Every test extends `BrutalComponent`
2. **Visual by Default** - Tests render their progress in real-time
3. **Zero Dependencies** - No Jest, Mocha, or external frameworks
4. **Reactive Testing** - Test state changes trigger re-renders
5. **Composable** - Tests can contain other tests

## Quick Start

```javascript
import { BrutalTest, withAssertions } from './testing/index.js';

// Create a test component
class MyTest extends withAssertions(BrutalTest) {
    async execute() {
        // Your test logic here
        this.assertEqual(1 + 1, 2, 'Basic math works');
        
        // Test renders itself while running!
    }
}

// Register as custom element
customElements.define('my-test', MyTest);
```

## Structure

```
testing/
├── core/
│   ├── BrutalTest.js          # Base test component
│   ├── BrutalAssertions.js    # Assertion methods
│   └── BrutalTestMetrics.js   # Performance tracking
├── components/
│   └── BrutalTestRunner.js    # Visual test orchestrator
├── patterns/
│   ├── TestHelpers.js         # Common utilities
│   └── CommonPatterns.js      # Reusable test patterns
└── tests/
    └── core/                  # Migrated tests
```

## Running Tests

### Option 1: HTML Demo
```bash
# Open in browser
brutal-v4/testing/demo.html
```

### Option 2: In Your App
```html
<brutal-test-runner autorun>
    <brutal-test-render-scheduler></brutal-test-render-scheduler>
    <my-custom-test></my-custom-test>
</brutal-test-runner>
```

### Option 3: Programmatically
```javascript
const runner = document.querySelector('brutal-test-runner');
await runner.runAll();
```

## Creating Tests

### Basic Test
```javascript
class SimpleTest extends withAssertions(BrutalTest) {
    async execute() {
        const result = await someAsyncOperation();
        this.assertTrue(result.success, 'Operation succeeded');
    }
}
```

### Test with Setup/Teardown
```javascript
class ComplexTest extends withAssertions(BrutalTest) {
    async setup() {
        this.testData = await loadTestData();
        this.component = new MyComponent();
    }
    
    async execute() {
        // Test logic
        this.component.setState(this.testData);
        await TestHelpers.waitForFrame();
        
        this.assertComponentState(
            this.component, 
            'loaded', 
            true
        );
    }
    
    async teardown() {
        this.component.remove();
    }
}
```

### Performance Test
```javascript
class PerfTest extends withAssertions(BrutalTest) {
    async execute() {
        const metrics = await TestHelpers.measurePerformance(
            () => this.component.render(),
            { iterations: 100 }
        );
        
        this.assertLessThan(
            metrics.time.avg,
            16.67,
            'Render completes in one frame'
        );
    }
}
```

## Available Assertions

- `assertEqual(actual, expected, message)`
- `assertNotEqual(actual, expected, message)`
- `assertTrue(value, message)`
- `assertFalse(value, message)`
- `assertNull(value, message)`
- `assertNotNull(value, message)`
- `assertInstanceOf(value, constructor, message)`
- `assertGreaterThan(actual, expected, message)`
- `assertLessThan(actual, expected, message)`
- `assertContains(haystack, needle, message)`
- `assertArrayLength(array, length, message)`
- `assertHasProperty(object, property, message)`
- `assertDeepEqual(actual, expected, message)`
- `assertThrows(fn, expectedError, message)`
- `assertElementExists(selector, message)`
- `assertComponentState(component, path, value, message)`
- `assertRenderTime(component, maxTime, message)`

## Test Helpers

```javascript
// Performance measurement
const metrics = await TestHelpers.measurePerformance(fn, {
    iterations: 100,
    warmup: 10
});

// Wait utilities
await TestHelpers.wait(100);
await TestHelpers.waitForFrame();
await TestHelpers.waitForCondition(() => component.loaded);

// Memory leak detection
const leak = await TestHelpers.detectMemoryLeak(fn, {
    iterations: 1000,
    threshold: 1048576 // 1MB
});

// Component validation
const validation = TestHelpers.validateComponent(component);
console.log(validation.summary); // "9/9 checks passed"
```

## Common Patterns

```javascript
// Validate render scheduler
const result = await CommonPatterns.validateRenderScheduler(scheduler);

// Check memory safety
const memory = await CommonPatterns.checkMemorySafety(ComponentClass);

// Validate performance budget
const perf = await CommonPatterns.validatePerformanceBudget(component, {
    initTime: 1,
    renderTime: 16.67,
    memoryPerInstance: 1000
});
```

## Visual Testing

Tests render themselves with real-time updates:

- **Pending**: Gray border
- **Running**: Orange border with progress
- **Passed**: Green border with metrics
- **Failed**: Red border with errors

## Integration with CI/CD

```javascript
// Export results for CI
const runner = new BrutalTestRunner();
await runner.runAll();
const results = runner.getResults();

// Convert to standard format
console.log(JSON.stringify({
    passed: results.passed,
    failed: results.failed,
    duration: results.duration,
    tests: results.tests
}));
```

## Next Steps

1. Migrate remaining tests from HTML to components
2. Add visual regression testing
3. Create test dashboard component
4. Implement coverage tracking
5. Add watch mode for development

---

Remember: In BRUTAL V4, **the test IS the component**, and **the component CAN be the test**. Pure symbiosis.
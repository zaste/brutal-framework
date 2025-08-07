# Visual Testing Pattern

## Problem
Traditional unit tests can't catch visual regressions, layout issues, or interaction problems that only manifest in the browser.

## Solution
Integrated visual testing using components that render test scenarios and capture visual snapshots for regression detection.

### Visual Test Components
```javascript
// Visual test as component
export class ButtonVisualTest extends TestComponent {
  static testMode = true;
  
  scenarios = [
    { name: 'default', props: {} },
    { name: 'hover', props: { state: 'hover' } },
    { name: 'active', props: { state: 'active' } },
    { name: 'disabled', props: { disabled: true } }
  ];
  
  async captureScenarios() {
    for (const scenario of this.scenarios) {
      await this.render(scenario);
      await this.captureSnapshot(scenario.name);
    }
  }
}
```

### Snapshot Comparison
```javascript
// Visual regression detection
class VisualTestRunner {
  async compareSnapshots(current, baseline) {
    const diff = await imageDiff(current, baseline);
    return {
      match: diff.percentage < 0.01, // 1% threshold
      difference: diff.percentage,
      diffImage: diff.image
    };
  }
}
```

### Benefits
- Catch visual regressions automatically
- Test responsive layouts
- Verify animations and transitions
- Document component states visually

## Evolution
- V3: Manual visual testing only
- brutal-test: Separate visual test framework
- V5: Integrated visual testing as components

## Trade-offs
- ✅ Catches issues unit tests miss
- ✅ Visual documentation
- ✅ Integrated workflow
- ❌ Requires snapshot storage
- ❌ Can be flaky (animations, fonts)

## Related
- [Integrated Testing](./integrated-testing.md)
- [Test Colocation](./test-colocation.md)
- [Component Lifecycle](../core/component-lifecycle.md)
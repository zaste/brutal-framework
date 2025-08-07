/**
 * BRUTAL Test V4 - Symbiotic Testing System
 * 
 * A testing framework where tests ARE components.
 * Zero dependencies, visual by default, truly symbiotic.
 */

// Core test system
export { BrutalTest } from './core/BrutalTest.js';
export { BrutalAssertions, withAssertions } from './core/BrutalAssertions.js';
export { BrutalTestMetrics, globalMetrics, BrutalMetricsMixin } from './core/BrutalTestMetrics.js';

// Test components
export { BrutalTestRunner } from './components/BrutalTestRunner.js';

// Patterns and helpers
export { TestHelpers } from './patterns/TestHelpers.js';
export { CommonPatterns } from './patterns/CommonPatterns.js';

// Visual testing
export { BrutalVisualTest, VisualComparison } from './visual/index.js';

// Re-export specific tests
export { RenderSchedulerTest } from './tests/core/RenderSchedulerTest.js';
export { MemorySafetyTest } from './tests/core/MemorySafetyTest.js';

/**
 * Quick start example:
 * 
 * ```javascript
 * import { BrutalTest, withAssertions } from 'brutal-v4/testing';
 * 
 * class MyTest extends withAssertions(BrutalTest) {
 *     async execute() {
 *         this.assertEqual(1 + 1, 2, 'Math works');
 *     }
 * }
 * 
 * customElements.define('my-test', MyTest);
 * ```
 */
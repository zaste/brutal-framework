/**
 * RenderSchedulerTest - Test component for render scheduler functionality
 * 
 * Migrated from test-render-scheduler.html to symbiotic test component.
 * Tests batching, priorities, and performance of the render scheduler.
 */

import { BrutalTest } from '../../core/BrutalTest.js';
import { withAssertions } from '../../core/BrutalAssertions.js';
import { BrutalComponent, renderScheduler, RenderPriority } from '../../../index.js';
import { CommonPatterns } from '../../patterns/CommonPatterns.js';
import { TestHelpers } from '../../patterns/TestHelpers.js';
import { html } from '../../../core/templates/index.js';

// Apply assertions mixin
class RenderSchedulerTestBase extends BrutalTest {}
withAssertions(RenderSchedulerTestBase);

export class RenderSchedulerTest extends RenderSchedulerTestBase {
    constructor() {
        super();
        this.testComponents = [];
        this.logger = TestHelpers.createTestLogger();
    }
    
    async setup() {
        // Reset render scheduler stats
        renderScheduler._stats = {
            scheduled: 0,
            rendered: 0,
            batches: 0,
            currentBatch: []
        };
        
        // Create test container in shadow DOM
        this.testContainer = document.createElement('div');
        this.testContainer.id = 'test-container';
        this.shadowRoot.appendChild(this.testContainer);
        
        this.logger.log('Test setup complete');
    }
    
    async execute() {
        // Run multiple test scenarios
        await this.testBatchRendering();
        await this.testRenderPriorities();
        await this.testPerformanceBudget();
        await this.testMemorySafety();
    }
    
    async testBatchRendering() {
        this.logger.log('=== Testing Batch Rendering ===');
        
        // Use common pattern for render scheduler validation
        const result = await CommonPatterns.validateRenderScheduler(renderScheduler);
        
        this.assert(
            result.passed,
            `Render batching: ${result.message}`
        );
        
        this.assertLessThanOrEqual(
            result.stats.batches,
            1,
            'All renders should be batched into single frame'
        );
        
        this.assertEqual(
            result.stats.scheduled,
            result.stats.rendered,
            'All scheduled renders should complete'
        );
    }
    
    async testRenderPriorities() {
        this.logger.log('=== Testing Render Priorities ===');
        
        const priorityOrder = [];
        const components = [];
        
        // Create components with different priorities
        const priorities = [
            { priority: RenderPriority.IDLE, name: 'IDLE' },
            { priority: RenderPriority.USER_INPUT, name: 'USER_INPUT' },
            { priority: RenderPriority.BACKGROUND, name: 'BACKGROUND' },
            { priority: RenderPriority.ANIMATION, name: 'ANIMATION' }
        ];
        
        // Create test components that track render order
        class PriorityTestComponent extends BrutalComponent {
            constructor(name) {
                super();
                this.priorityName = name;
            }
            
            render() {
                priorityOrder.push(this.priorityName);
                super.render();
            }
            
            createTemplate() {
                return html`<div>Priority: ${this.priorityName}</div>`;
            }
        }
        
        // Register temporarily
        if (!customElements.get('priority-test-component')) {
            customElements.define('priority-test-component', PriorityTestComponent);
        }
        
        // Schedule renders with different priorities
        for (const { priority, name } of priorities) {
            const comp = new PriorityTestComponent(name);
            this.testContainer.appendChild(comp);
            components.push(comp);
            comp.scheduleRender(priority);
            this.logger.log(`Scheduled ${name} priority render`);
        }
        
        // Wait for renders
        await TestHelpers.waitForFrames(2);
        
        // Verify priority order (higher priority should render first)
        this.logger.log('Render order:', priorityOrder);
        
        const userInputIndex = priorityOrder.indexOf('USER_INPUT');
        const animationIndex = priorityOrder.indexOf('ANIMATION');
        const backgroundIndex = priorityOrder.indexOf('BACKGROUND');
        const idleIndex = priorityOrder.indexOf('IDLE');
        
        this.assertLessThan(
            userInputIndex,
            backgroundIndex,
            'USER_INPUT should render before BACKGROUND'
        );
        
        this.assertLessThan(
            animationIndex,
            idleIndex,
            'ANIMATION should render before IDLE'
        );
        
        // Cleanup
        components.forEach(c => c.remove());
    }
    
    async testPerformanceBudget() {
        this.logger.log('=== Testing Performance Budget ===');
        
        // Create many components to stress test
        const components = [];
        const componentCount = 100;
        
        class StressTestComponent extends BrutalComponent {
            createTemplate() {
                return html`<div>Stress test component</div>`;
            }
        }
        
        if (!customElements.get('stress-test-component')) {
            customElements.define('stress-test-component', StressTestComponent);
        }
        
        // Measure batch render performance
        const perfResult = await TestHelpers.measurePerformance(async () => {
            // Create and schedule all components
            for (let i = 0; i < componentCount; i++) {
                const comp = new StressTestComponent();
                this.testContainer.appendChild(comp);
                components.push(comp);
                comp.scheduleRender();
            }
            
            // Wait for batch render
            await TestHelpers.waitForFrame();
        });
        
        this.logger.log(`Rendered ${componentCount} components in ${perfResult.time.avg.toFixed(2)}ms`);
        
        // Assert performance budget (should render in single frame)
        this.assertLessThan(
            perfResult.time.avg,
            16.67,
            `Batch render of ${componentCount} components should complete in one frame`
        );
        
        // Get scheduler metrics
        const metrics = renderScheduler.getMetrics();
        this.logger.log('Scheduler metrics:', metrics);
        
        this.assertGreaterThan(
            metrics.batchedRenders,
            0,
            'Should have batched renders'
        );
        
        // Cleanup
        components.forEach(c => c.remove());
    }
    
    async testMemorySafety() {
        this.logger.log('=== Testing Memory Safety ===');
        
        // Simple component for memory testing
        class MemoryTestComponent extends BrutalComponent {
            createTemplate() {
                return html`<div>Memory test</div>`;
            }
        }
        
        if (!customElements.get('memory-test-component')) {
            customElements.define('memory-test-component', MemoryTestComponent);
        }
        
        // Check for memory leaks with render scheduling
        const memoryResult = await TestHelpers.detectMemoryLeak(async () => {
            const comp = new MemoryTestComponent();
            this.testContainer.appendChild(comp);
            comp.scheduleRender();
            await TestHelpers.waitForFrame();
            comp.remove();
        }, {
            iterations: 50,
            threshold: 512 * 1024 // 512KB threshold
        });
        
        this.logger.log(`Memory leak test: ${memoryResult.leakedMB.toFixed(2)}MB leaked`);
        
        this.assertFalse(
            memoryResult.hasLeak,
            `Memory leak detected: ${memoryResult.leakedMB.toFixed(2)}MB`
        );
    }
    
    async teardown() {
        // Clean up test components
        this.testComponents.forEach(comp => comp.remove());
        this.testComponents = [];
        
        // Remove test container
        if (this.testContainer) {
            this.testContainer.remove();
        }
        
        // Log summary
        const summary = this.logger.getSummary();
        this.logger.log('Test teardown complete', 'success');
        this.logger.log(`Total logs: ${summary.total}, Errors: ${summary.error}`);
    }
    
    // Override template to show test-specific UI
    createTemplate() {
        const baseTemplate = super.createTemplate();
        const { phase } = this._testState.getAll();
        
        // Add test-specific content when running
        if (phase === 'running' || phase === 'passed' || phase === 'failed') {
            return html`
                ${baseTemplate}
                <style>
                    .scheduler-info {
                        margin-top: 12px;
                        padding: 8px;
                        background: #0a0a0a;
                        border-radius: 4px;
                        font-size: 11px;
                        color: #888;
                    }
                    
                    .test-visual {
                        margin-top: 8px;
                        padding: 12px;
                        background: #1a1a1a;
                        border-radius: 4px;
                        min-height: 50px;
                    }
                </style>
                
                <div class="scheduler-info">
                    Render Scheduler Test validates batching, priorities, and performance
                </div>
                
                <div class="test-visual">
                    <slot name="test-content"></slot>
                </div>
            `;
        }
        
        return baseTemplate;
    }
}

// Register the test component
customElements.define('brutal-test-render-scheduler', RenderSchedulerTest);
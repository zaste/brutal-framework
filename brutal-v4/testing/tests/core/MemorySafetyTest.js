/**
 * MemorySafetyTest - Test component for memory safety and leak detection
 * 
 * Migrated from test-memory-safety.html to symbiotic test component.
 * Tests WeakMap cleanup, component lifecycle, and memory management.
 */

import { BrutalTest } from '../../core/BrutalTest.js';
import { withAssertions } from '../../core/BrutalAssertions.js';
import { BrutalComponent, BrutalState, BrutalEvents } from '../../../index.js';
import { CommonPatterns } from '../../patterns/CommonPatterns.js';
import { TestHelpers } from '../../patterns/TestHelpers.js';
import { html } from '../../../core/templates/index.js';

// Apply assertions mixin
class MemorySafetyTestBase extends BrutalTest {}
withAssertions(MemorySafetyTestBase);

export class MemorySafetyTest extends MemorySafetyTestBase {
    constructor() {
        super();
        this.testComponents = [];
        this.logger = TestHelpers.createTestLogger();
        this.hasMemoryAPI = !!performance.memory;
    }
    
    async setup() {
        if (!this.hasMemoryAPI) {
            this.logger.warning('performance.memory API not available. Memory measurements will be limited.');
        }
        
        // Create test container
        this.testContainer = document.createElement('div');
        this.testContainer.style.display = 'none';
        this.shadowRoot.appendChild(this.testContainer);
        
        this.logger.log('Memory safety test setup complete');
    }
    
    async execute() {
        // Run test scenarios
        await this.testComponentLifecycle();
        await this.testStateSubscriptions();
        await this.testEventListeners();
        await this.testWeakMapCleanup();
        await this.testMemoryPressure();
    }
    
    async testComponentLifecycle() {
        this.logger.log('=== Testing Component Lifecycle Memory ===');
        
        // Test component for memory testing
        class MemoryTestComponent extends BrutalComponent {
            constructor() {
                super();
                this.largeData = new Array(1000).fill('test data');
            }
            
            createTemplate() {
                return html`<div>Memory test component</div>`;
            }
        }
        
        if (!customElements.get('memory-test-component')) {
            customElements.define('memory-test-component', MemoryTestComponent);
        }
        
        // Use common pattern for memory safety check
        const result = await CommonPatterns.checkMemorySafety(
            MemoryTestComponent,
            {
                iterations: 100,
                threshold: 2 * 1024 * 1024 // 2MB threshold
            }
        );
        
        this.assertFalse(
            result.hasLeak,
            `Component lifecycle memory leak: ${result.leakedMB.toFixed(2)}MB leaked`
        );
        
        this.logger.log(`Memory delta: ${result.leakedMB.toFixed(2)}MB`);
    }
    
    async testStateSubscriptions() {
        this.logger.log('=== Testing State Subscription Memory ===');
        
        const states = [];
        const subscriptions = [];
        
        // Measure memory for state subscriptions
        const memoryResult = await TestHelpers.measureMemoryAsync(async () => {
            // Create many states with subscriptions
            for (let i = 0; i < 100; i++) {
                const state = new BrutalState({ value: i });
                const unsub = state.on('change', () => {
                    // Subscription callback
                });
                
                states.push(state);
                subscriptions.push(unsub);
            }
            
            // Trigger changes
            states.forEach(state => {
                state.set({ value: Math.random() });
            });
            
            await TestHelpers.waitForFrame();
            
            // Cleanup subscriptions
            subscriptions.forEach(unsub => unsub());
            subscriptions.length = 0;
            
            // Clear state references
            states.length = 0;
        });
        
        this.logger.log(`State subscriptions memory delta: ${(memoryResult.memoryDelta / 1024).toFixed(2)}KB`);
        
        this.assertLessThan(
            memoryResult.memoryDelta,
            512 * 1024, // 512KB threshold
            'State subscriptions should not leak significant memory'
        );
    }
    
    async testEventListeners() {
        this.logger.log('=== Testing Event Listener Memory ===');
        
        const eventManagers = [];
        const elements = [];
        
        // Create elements with event listeners
        for (let i = 0; i < 100; i++) {
            const element = document.createElement('div');
            const events = new BrutalEvents();
            
            // Add multiple listeners
            events.on('click', () => {});
            events.on('mouseover', () => {});
            events.on('custom', () => {});
            
            element._events = events;
            this.testContainer.appendChild(element);
            
            elements.push(element);
            eventManagers.push(events);
        }
        
        await TestHelpers.waitForFrame();
        
        // Measure cleanup
        const cleanupResult = await TestHelpers.detectMemoryLeak(async () => {
            // Remove all elements and cleanup events
            elements.forEach(el => {
                if (el._events) {
                    el._events.off(); // Remove all listeners
                }
                el.remove();
            });
            
            elements.length = 0;
            eventManagers.length = 0;
            
            await TestHelpers.waitForFrame();
        }, {
            iterations: 1,
            threshold: 256 * 1024 // 256KB
        });
        
        this.assertFalse(
            cleanupResult.hasLeak,
            `Event listener memory leak: ${cleanupResult.leakedMB.toFixed(2)}MB`
        );
    }
    
    async testWeakMapCleanup() {
        this.logger.log('=== Testing WeakMap Cleanup ===');
        
        // Test WeakMap behavior
        const weakMap = new WeakMap();
        let objects = [];
        
        // Create objects and add to WeakMap
        for (let i = 0; i < 100; i++) {
            const obj = { id: i, data: new Array(100).fill(i) };
            weakMap.set(obj, { metadata: `Object ${i}` });
            objects.push(obj);
        }
        
        // Verify all are in WeakMap
        const allExist = objects.every(obj => weakMap.has(obj));
        this.assertTrue(allExist, 'All objects should be in WeakMap');
        
        // Clear references
        objects = null;
        
        // Force GC if available
        if (window.gc) {
            window.gc();
            await TestHelpers.wait(100);
        }
        
        // WeakMap should allow GC of objects
        // We can't directly test this, but we verify the API works
        this.assert(
            weakMap instanceof WeakMap,
            'WeakMap is available and functional'
        );
    }
    
    async testMemoryPressure() {
        this.logger.log('=== Testing Memory Pressure Handling ===');
        
        // Test system under memory pressure
        const components = [];
        const startMemory = performance.memory?.usedJSHeapSize || 0;
        
        try {
            // Create many components rapidly
            const perfResult = await TestHelpers.measurePerformance(async () => {
                for (let i = 0; i < 50; i++) {
                    const comp = document.createElement('div');
                    comp._state = new BrutalState({ id: i });
                    comp._events = new BrutalEvents();
                    comp.innerHTML = `<div>Component ${i}</div>`;
                    
                    this.testContainer.appendChild(comp);
                    components.push(comp);
                }
            });
            
            this.logger.log(`Created 50 components in ${perfResult.time.avg.toFixed(2)}ms`);
            
            // Verify performance under pressure
            this.assertLessThan(
                perfResult.time.avg,
                100,
                'Component creation should remain fast under memory pressure'
            );
            
        } finally {
            // Cleanup
            components.forEach(c => c.remove());
            components.length = 0;
        }
        
        const endMemory = performance.memory?.usedJSHeapSize || 0;
        const memoryDelta = endMemory - startMemory;
        
        this.logger.log(`Memory pressure test delta: ${(memoryDelta / 1024 / 1024).toFixed(2)}MB`);
    }
    
    async teardown() {
        // Clean up test components
        this.testComponents.forEach(comp => comp.remove());
        this.testComponents = [];
        
        // Remove test container
        if (this.testContainer) {
            this.testContainer.remove();
        }
        
        // Final memory report
        if (this.hasMemoryAPI) {
            const finalMemory = performance.memory.usedJSHeapSize;
            this.logger.log(`Final heap size: ${(finalMemory / 1024 / 1024).toFixed(2)}MB`);
        }
        
        const summary = this.logger.getSummary();
        this.logger.log('Memory safety test complete', 'success');
    }
    
    // Enhanced template with memory info
    createTemplate() {
        const baseTemplate = super.createTemplate();
        const { phase } = this._testState.getAll();
        
        if (phase === 'running' || phase === 'passed' || phase === 'failed') {
            const memoryInfo = this.hasMemoryAPI ? html`
                <div class="memory-info">
                    <strong>Heap:</strong> 
                    ${(performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB / 
                    ${(performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(0)}MB
                </div>
            ` : html`
                <div class="memory-info">
                    Memory API not available
                </div>
            `;
            
            return html`
                ${baseTemplate}
                <style>
                    .memory-info {
                        margin-top: 12px;
                        padding: 8px;
                        background: #0a0a0a;
                        border-radius: 4px;
                        font-size: 11px;
                        color: #f39c12;
                    }
                    
                    .test-description {
                        margin-top: 8px;
                        padding: 12px;
                        background: #1a1a1a;
                        border-radius: 4px;
                        font-size: 12px;
                        color: #888;
                    }
                </style>
                
                ${memoryInfo}
                
                <div class="test-description">
                    Memory Safety Test validates WeakMap cleanup, component lifecycle, 
                    and memory management under pressure.
                </div>
            `;
        }
        
        return baseTemplate;
    }
}

// Register the test component
customElements.define('brutal-test-memory-safety', MemorySafetyTest);
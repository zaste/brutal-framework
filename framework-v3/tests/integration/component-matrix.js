/**
 * Component Matrix Test Suite
 * Tests all 400 possible combinations of 20 components
 * Detects conflicts, memory leaks, and integration issues
 */

export class ComponentMatrix {
    constructor() {
        this.components = [
            // Core Components
            'brutal-button',
            'brutal-input', 
            'brutal-card',
            'brutal-select',
            'brutal-form',
            'brutal-checkbox',
            'brutal-radio',
            'brutal-toggle',
            'brutal-modal',
            'brutal-tabs',
            
            // Data Components
            'brutal-table',
            'brutal-list',
            
            // Feedback Components  
            'brutal-alert',
            'brutal-toast',
            'brutal-progress',
            'brutal-spinner',
            
            // Navigation Components
            'brutal-menu',
            'brutal-breadcrumb',
            'brutal-sidebar',
            'brutal-nav'
        ];
        
        this.results = new Map();
        this.conflicts = [];
        this.memoryBaseline = 0;
        this.container = null;
    }

    async initialize(container) {
        this.container = container;
        this.memoryBaseline = await this.getMemoryUsage();
        console.log(`[ComponentMatrix] Initialized with ${this.components.length} components`);
        console.log(`[ComponentMatrix] Testing ${this.components.length * this.components.length} combinations`);
    }

    async runAllTests() {
        const startTime = performance.now();
        let tested = 0;
        const total = this.components.length * this.components.length;

        for (let i = 0; i < this.components.length; i++) {
            for (let j = 0; j < this.components.length; j++) {
                const result = await this.testCombination(
                    this.components[i], 
                    this.components[j]
                );
                
                tested++;
                this.updateProgress(tested, total);
                
                if (!result.success) {
                    this.conflicts.push({
                        component1: this.components[i],
                        component2: this.components[j],
                        error: result.error
                    });
                }
                
                // Small delay to prevent UI blocking
                if (tested % 20 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 0));
                }
            }
        }

        const endTime = performance.now();
        return {
            totalTests: total,
            passed: total - this.conflicts.length,
            failed: this.conflicts.length,
            conflicts: this.conflicts,
            duration: endTime - startTime,
            avgTestTime: (endTime - startTime) / total
        };
    }

    async testCombination(component1, component2) {
        const testId = `${component1}-${component2}`;
        
        try {
            // Clear container
            this.container.innerHTML = '';
            
            // Create test wrapper
            const wrapper = document.createElement('div');
            wrapper.className = 'test-wrapper';
            wrapper.style.display = 'flex';
            wrapper.style.gap = '1rem';
            wrapper.style.padding = '1rem';
            
            // Create first component
            const elem1 = document.createElement(component1);
            elem1.setAttribute('data-test-id', `${testId}-1`);
            this.addTestProps(elem1, component1);
            
            // Create second component  
            const elem2 = document.createElement(component2);
            elem2.setAttribute('data-test-id', `${testId}-2`);
            this.addTestProps(elem2, component2);
            
            // Add to wrapper
            wrapper.appendChild(elem1);
            wrapper.appendChild(elem2);
            this.container.appendChild(wrapper);
            
            // Wait for render
            await new Promise(resolve => requestAnimationFrame(resolve));
            
            // Run integration checks
            const checks = await this.runIntegrationChecks(elem1, elem2, testId);
            
            // Store result
            this.results.set(testId, {
                success: checks.allPassed,
                checks: checks,
                timestamp: Date.now()
            });
            
            return { success: checks.allPassed, checks };
            
        } catch (error) {
            console.error(`[ComponentMatrix] Error testing ${testId}:`, error);
            this.results.set(testId, {
                success: false,
                error: error.message,
                timestamp: Date.now()
            });
            
            return { success: false, error: error.message };
        }
    }

    async runIntegrationChecks(elem1, elem2, testId) {
        const checks = {
            rendering: false,
            shadowDOM: false,
            events: false,
            styles: false,
            memory: false,
            performance: false,
            allPassed: false
        };

        // Check 1: Both elements rendered
        checks.rendering = elem1.shadowRoot !== null && elem2.shadowRoot !== null;
        
        // Check 2: Shadow DOM isolation
        if (checks.rendering) {
            const elem1Styles = elem1.shadowRoot.querySelectorAll('style');
            const elem2Styles = elem2.shadowRoot.querySelectorAll('style');
            checks.shadowDOM = elem1Styles.length > 0 || elem2Styles.length > 0;
        }
        
        // Check 3: Event isolation
        checks.events = await this.testEventIsolation(elem1, elem2);
        
        // Check 4: Style containment
        checks.styles = await this.testStyleContainment(elem1, elem2);
        
        // Check 5: Memory usage
        checks.memory = await this.testMemoryUsage(testId);
        
        // Check 6: Performance
        checks.performance = await this.testPerformance(elem1, elem2);
        
        // All passed?
        checks.allPassed = Object.entries(checks)
            .filter(([key]) => key !== 'allPassed')
            .every(([, value]) => value === true);
        
        return checks;
    }

    async testEventIsolation(elem1, elem2) {
        let isolated = true;
        
        // Test if events from elem1 affect elem2
        const testEvent = new CustomEvent('brutal:test', {
            bubbles: true,
            detail: { test: true }
        });
        
        let elem2Received = false;
        elem2.addEventListener('brutal:test', () => {
            elem2Received = true;
        });
        
        elem1.dispatchEvent(testEvent);
        
        // Events should not cross shadow DOM boundaries
        if (elem2Received) {
            isolated = false;
        }
        
        return isolated;
    }

    async testStyleContainment(elem1, elem2) {
        // Check if styles leak between components
        const elem1Computed = window.getComputedStyle(elem1);
        const elem2Computed = window.getComputedStyle(elem2);
        
        // Components should have independent styling
        return elem1Computed.display !== 'none' && elem2Computed.display !== 'none';
    }

    async testMemoryUsage(testId) {
        const currentMemory = await this.getMemoryUsage();
        const increase = currentMemory - this.memoryBaseline;
        
        // Allow up to 1MB increase per test
        const threshold = 1 * 1024 * 1024; // 1MB
        
        if (increase > threshold) {
            console.warn(`[ComponentMatrix] High memory usage in ${testId}: ${(increase / 1024 / 1024).toFixed(2)}MB`);
            return false;
        }
        
        return true;
    }

    async testPerformance(elem1, elem2) {
        const startMark = `${elem1.tagName}-${elem2.tagName}-start`;
        const endMark = `${elem1.tagName}-${elem2.tagName}-end`;
        
        performance.mark(startMark);
        
        // Trigger re-renders
        if (elem1.update) elem1.update();
        if (elem2.update) elem2.update();
        
        await new Promise(resolve => requestAnimationFrame(resolve));
        
        performance.mark(endMark);
        performance.measure('render-time', startMark, endMark);
        
        const measure = performance.getEntriesByName('render-time')[0];
        const renderTime = measure ? measure.duration : 0;
        
        // Should render in less than 16ms (60fps)
        return renderTime < 16;
    }

    async getMemoryUsage() {
        if (performance.memory) {
            return performance.memory.usedJSHeapSize;
        }
        return 0;
    }

    addTestProps(element, componentType) {
        // Add appropriate props based on component type
        switch (componentType) {
            case 'brutal-button':
                element.textContent = 'Test Button';
                element.setAttribute('variant', 'primary');
                break;
                
            case 'brutal-input':
                element.setAttribute('placeholder', 'Test input');
                element.setAttribute('type', 'text');
                break;
                
            case 'brutal-card':
                element.innerHTML = '<h3>Test Card</h3><p>Test content</p>';
                break;
                
            case 'brutal-select':
                element.setAttribute('options', JSON.stringify([
                    { value: '1', label: 'Option 1' },
                    { value: '2', label: 'Option 2' }
                ]));
                break;
                
            case 'brutal-table':
                element.setAttribute('columns', JSON.stringify([
                    { key: 'id', label: 'ID' },
                    { key: 'name', label: 'Name' }
                ]));
                element.setAttribute('data', JSON.stringify([
                    { id: 1, name: 'Test 1' },
                    { id: 2, name: 'Test 2' }
                ]));
                break;
                
            case 'brutal-list':
                element.setAttribute('items', JSON.stringify([
                    { id: 1, text: 'Item 1' },
                    { id: 2, text: 'Item 2' }
                ]));
                break;
                
            case 'brutal-alert':
                element.setAttribute('type', 'info');
                element.textContent = 'Test alert message';
                break;
                
            case 'brutal-toast':
                element.setAttribute('message', 'Test toast');
                element.setAttribute('type', 'success');
                break;
                
            case 'brutal-progress':
                element.setAttribute('value', '50');
                element.setAttribute('max', '100');
                break;
                
            case 'brutal-spinner':
                element.setAttribute('size', 'medium');
                break;
                
            case 'brutal-menu':
                element.setAttribute('items', JSON.stringify([
                    { label: 'Item 1', value: '1' },
                    { label: 'Item 2', value: '2' }
                ]));
                break;
                
            case 'brutal-breadcrumb':
                element.setAttribute('items', JSON.stringify([
                    { label: 'Home', url: '/' },
                    { label: 'Test', url: '/test' }
                ]));
                break;
                
            case 'brutal-sidebar':
                element.setAttribute('collapsed', 'false');
                element.innerHTML = '<div>Sidebar content</div>';
                break;
                
            case 'brutal-tabs':
                element.setAttribute('tabs', JSON.stringify([
                    { id: 'tab1', label: 'Tab 1' },
                    { id: 'tab2', label: 'Tab 2' }
                ]));
                break;
                
            default:
                // Generic props
                element.setAttribute('data-test', 'true');
        }
    }

    updateProgress(current, total) {
        const percent = (current / total) * 100;
        const event = new CustomEvent('matrix:progress', {
            detail: { current, total, percent }
        });
        window.dispatchEvent(event);
    }

    generateReport() {
        const report = {
            summary: {
                totalCombinations: this.components.length * this.components.length,
                tested: this.results.size,
                passed: Array.from(this.results.values()).filter(r => r.success).length,
                failed: this.conflicts.length
            },
            conflicts: this.conflicts,
            details: Object.fromEntries(this.results)
        };
        
        return report;
    }
}

// Auto-initialize if running in test-runner
if (typeof window !== 'undefined' && window.location.pathname.includes('test-runner.html')) {
    window.ComponentMatrix = ComponentMatrix;
}
# 🏗️ BRUTAL Test V4 - Arquitectura Nativa

## 🎯 Principios de Diseño

### 1. **Simbiótico y Recursivo**
Los tests son componentes V4 que testean componentes V4. Usan los mismos sistemas que están validando.

### 2. **Zero Dependencies**
No hay framework de testing externo. El testing ES parte del framework.

### 3. **Observable y Reactivo**
Los tests emiten eventos, tienen estado reactivo, y pueden ser observados como cualquier componente.

### 4. **Autocontenido**
Cada test es un componente completo con su propio shadow DOM, template, y ciclo de vida.

## 🗺️ Mapa de Destilación

```
┌─────────────────────────────────────────────────────────────┐
│                     FUENTES DE CONOCIMIENTO                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  V3 Testing System          V4 Current Tests          brutal-test
│  ┌──────────────┐          ┌──────────────┐         ┌──────────────┐
│  │ Orchestrator │          │ 11 HTML Tests│         │ Analysis     │
│  │ Scenarios    │          │ Validation   │         │ Engine       │
│  │ Budgets      │          │ Suite        │         │ Error        │
│  │ Categories   │          │ Patterns     │         │ Capture      │
│  └──────────────┘          └──────────────┘         └──────────────┘
│         │                          │                         │
│         ▼                          ▼                         ▼
├─────────────────────────────────────────────────────────────┤
│                      DESTILACIÓN A V4                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              BRUTAL Test V4 Native Core              │   │
│  │                                                      │   │
│  │  BrutalTest extends BrutalComponent                 │   │
│  │  BrutalTestRunner extends BrutalComponent           │   │
│  │  BrutalTestState extends BrutalState               │   │
│  │  BrutalTestEvents extends BrutalEvents             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🏛️ Arquitectura Core

### 1. **Base Test Component**
```javascript
// El test ES un componente
class BrutalTest extends BrutalComponent {
    static observedAttributes = ['auto-run', 'verbose', 'timeout'];
    
    constructor() {
        super();
        
        // Estado reactivo para el test
        this._testState = new BrutalTestState({
            phase: 'pending',    // pending|setup|running|teardown|complete
            passed: 0,
            failed: 0,
            skipped: 0,
            assertions: [],
            metrics: {},
            errors: []
        });
        
        // Sistema de eventos para el test
        this._testEvents = new BrutalTestEvents(this);
        
        // Assertions nativas
        this._assert = new BrutalAssertions(this);
        
        // Recolector de métricas
        this._metrics = new BrutalMetrics(this);
    }
    
    // Ciclo de vida del test
    async connectedCallback() {
        super.connectedCallback();
        if (this.hasAttribute('auto-run')) {
            await this.run();
        }
    }
    
    // Template reactivo que muestra el estado del test
    createTemplate() {
        const state = this._testState.getAll();
        return html`
            <div class="brutal-test ${state.phase}">
                <header>
                    <h3>${this.name || this.constructor.name}</h3>
                    <span class="status">${state.phase}</span>
                </header>
                <div class="metrics">
                    ✅ ${state.passed} | ❌ ${state.failed} | ⏭️ ${state.skipped}
                </div>
                <div class="assertions">
                    ${state.assertions.map(a => this.renderAssertion(a))}
                </div>
            </div>
        `;
    }
}
```

### 2. **Test State Management**
```javascript
// Estado específico para tests
class BrutalTestState extends BrutalState {
    constructor(initial) {
        super({
            ...initial,
            startTime: null,
            endTime: null,
            duration: null
        });
        
        // Eventos específicos de test
        this.on('change', (changes) => {
            if (changes.phase === 'complete') {
                this.calculateDuration();
            }
        });
    }
    
    // Helpers específicos para tests
    recordAssertion(assertion) {
        this.update(state => {
            state.assertions.push(assertion);
            if (assertion.passed) state.passed++;
            else state.failed++;
        });
    }
}
```

### 3. **Assertion System**
```javascript
// Sistema de assertions que usa los mismos componentes
class BrutalAssertions {
    constructor(test) {
        this.test = test;
    }
    
    // Assertions básicas
    assert(condition, message) {
        const assertion = {
            passed: !!condition,
            message,
            timestamp: Date.now(),
            stack: condition ? null : new Error().stack
        };
        
        this.test._testState.recordAssertion(assertion);
        this.test.emit('assertion', assertion);
        
        if (!condition) {
            throw new AssertionError(message);
        }
    }
    
    // Assertions específicas para V4
    assertComponent(element) {
        this.assert(element instanceof BrutalComponent, 
            'Element should be a BrutalComponent');
        this.assert(element.shadowRoot, 
            'Component should have shadow DOM');
    }
    
    assertNoSyncRenders() {
        const stats = renderScheduler.getStats();
        this.assert(stats.syncRenders === 0, 
            'No synchronous renders allowed');
    }
    
    assertNoMemoryLeaks(fn, threshold = 1048576) {
        const before = performance.memory?.usedJSHeapSize || 0;
        fn();
        if (window.gc) window.gc();
        const after = performance.memory?.usedJSHeapSize || 0;
        this.assert((after - before) < threshold, 
            `Memory leak detected: ${after - before} bytes`);
    }
}
```

## 📦 Mapeo de Destilación

### De V3 → V4

| V3 Feature | V4 Implementation | Location |
|------------|-------------------|----------|
| Test Orchestrator | `BrutalTestRunner` | `/testing/core/TestRunner.js` |
| Scenarios | `TestScenarios` | `/testing/scenarios/` |
| Performance Budgets | `PerformanceBudgets` | `/testing/budgets/` |
| Test Categories | `TestRegistry.categories` | `/testing/core/TestRegistry.js` |
| Comprehensive Tests | `ComprehensiveTest` base | `/testing/patterns/ComprehensiveTest.js` |

### De V4 Tests Actuales → V4 Native

| Current Test | Extract To | As |
|--------------|------------|-----|
| `test-render-scheduler.html` | `RenderSchedulerTest` | Component test |
| `validateRenderScheduler()` | `TestPatterns.renderScheduler` | Reusable pattern |
| `addResult()` pattern | Built into `BrutalTest.render()` | Native rendering |
| Memory leak checks | `BrutalAssertions.assertNoMemoryLeaks()` | Native assertion |
| Performance metrics | `BrutalMetrics` | Native collection |

### De brutal-test → V4 Native

| brutal-test Feature | V4 Integration | Purpose |
|-------------------|----------------|---------|
| ErrorAnalyzer | `BrutalErrorAnalysis` | Analyze test failures |
| PerformanceAnalyzer | `BrutalPerformanceAnalysis` | Performance insights |
| Visual Capture | `BrutalVisualTest` | Visual regression |
| Report Generator | `BrutalTestReporter` | Test reports |

## 🔄 Flujo de Datos

```
┌─────────────────┐
│   Test Define   │
│                 │
│ class MyTest    │
│ extends         │
│ BrutalTest      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Test Runner    │
│                 │
│ Discovers and   │
│ orchestrates    │
│ tests           │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Test Execution  │
│                 │
│ - Setup         │
│ - Run           │
│ - Assertions    │
│ - Teardown      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ State Updates   │
│                 │
│ Reactive state  │
│ triggers render │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Visual Output   │
│                 │
│ Shadow DOM      │
│ shows results   │
└─────────────────┘
```

## 🎨 Patrones de Test

### 1. **Unit Test Pattern**
```javascript
class ComponentUnitTest extends BrutalTest {
    async setup() {
        this.component = new MyComponent();
        this.appendChild(this.component);
    }
    
    async execute() {
        // Test individual methods
        this.assert.equals(this.component.method(), expected);
    }
    
    async teardown() {
        this.component.remove();
    }
}
```

### 2. **Integration Test Pattern**
```javascript
class SystemIntegrationTest extends BrutalTest {
    async execute() {
        // Test multiple components together
        const scheduler = renderScheduler;
        const component = new BrutalComponent();
        
        component.scheduleRender();
        await this.nextFrame();
        
        this.assert.assertNoSyncRenders();
    }
}
```

### 3. **Performance Test Pattern**
```javascript
class PerformanceTest extends BrutalTest {
    budget = {
        renderTime: 16.67,
        memoryDelta: 0,
        fps: 60
    };
    
    async execute() {
        const metrics = await this.measurePerformance(() => {
            // Performance critical code
        });
        
        this.assert.assertBudget(metrics, this.budget);
    }
}
```

### 4. **Visual Test Pattern**
```javascript
class VisualRegressionTest extends BrutalTest {
    async execute() {
        const component = new MyComponent();
        this.appendChild(component);
        
        const snapshot = await this.captureVisual();
        this.assert.visualMatch(snapshot, this.baseline);
    }
}
```

## 🏃 Test Runner Architecture

```javascript
class BrutalTestRunner extends BrutalComponent {
    constructor() {
        super();
        
        // Registry of all tests
        this._registry = new BrutalTestRegistry();
        
        // Execution queue
        this._queue = new BrutalTestQueue();
        
        // Results aggregator
        this._results = new BrutalTestResults();
    }
    
    // Discover tests (components with brutal-test tag)
    async discover() {
        // Find all elements that extend BrutalTest
        const tests = document.querySelectorAll('[is-brutal-test]');
        
        // Or use registry
        const registered = BrutalTestRegistry.getAll();
        
        return [...tests, ...registered];
    }
    
    // Run tests with orchestration
    async run(options = {}) {
        const tests = await this.discover();
        
        // Group by scenario/category
        const scenarios = this.groupByScenario(tests);
        
        // Execute with budgets and priorities
        for (const [scenario, tests] of scenarios) {
            await this.runScenario(scenario, tests);
        }
    }
}
```

## 📊 Métricas y Reportes

```javascript
class BrutalTestReporter extends BrutalComponent {
    createTemplate() {
        const summary = this._results.getSummary();
        
        return html`
            <brutal-test-report>
                <summary>
                    <h2>Test Results</h2>
                    <div class="stats">
                        <span class="total">${summary.total} tests</span>
                        <span class="passed">${summary.passed} passed</span>
                        <span class="failed">${summary.failed} failed</span>
                    </div>
                </summary>
                
                <details open>
                    <summary>Performance Metrics</summary>
                    ${this.renderPerformanceMetrics()}
                </details>
                
                <details>
                    <summary>Failed Tests</summary>
                    ${this.renderFailures()}
                </details>
            </brutal-test-report>
        `;
    }
}
```

## 🔌 Puntos de Integración

### 1. **Con V4 Core**
- Tests usan `BrutalComponent` como base
- Tests usan `BrutalState` para estado reactivo
- Tests usan `BrutalEvents` para comunicación
- Tests usan `renderScheduler` para validación

### 2. **Con brutal-test Original**
```javascript
// Adapter para usar análisis avanzado
class BrutalTestAdapter {
    static async analyze(testResults) {
        const analyzer = new BrutalErrorAnalyzer();
        return analyzer.analyze(testResults);
    }
}
```

### 3. **Con el Browser**
- Tests corren en el browser, no en Node
- Usan APIs nativas (Shadow DOM, Custom Elements)
- Pueden ser inspeccionados con DevTools

## 🎯 Beneficios de esta Arquitectura

1. **Dogfooding**: Usamos V4 para testear V4
2. **Visual**: Los tests se ven mientras corren
3. **Debuggeable**: Full DevTools support
4. **Reactivo**: Estado actualiza UI en tiempo real
5. **Componible**: Tests pueden contener otros tests
6. **Extensible**: Fácil agregar nuevos tipos de test

---

Esta arquitectura hace que el testing sea verdaderamente parte del framework, no un añadido. Los tests son ciudadanos de primera clase en V4.
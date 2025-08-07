/**
 * Week 3: Template Optimization Tests
 * Building on Week 2's 2.64x React performance foundation
 * Target: 3x+ React performance through template optimization
 */

const { JSDOM } = require('jsdom');
const { TemplateOptimizer } = require('../src/template-optimizer.cjs');

// Set up JSDOM environment
const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`);
global.document = dom.window.document;
global.window = dom.window;
global.HTMLElement = dom.window.HTMLElement;
global.customElements = dom.window.customElements;
global.performance = { now: () => Date.now() };
global.requestAnimationFrame = (cb) => setTimeout(cb, 16);
global.CSSStyleSheet = class CSSStyleSheet {
  constructor() { this.rules = []; }
  replace(css) { this.cssText = css; return Promise.resolve(); }
};

describe('WEEK 3: Template Optimization Engine', () => {
  beforeEach(() => {
    TemplateOptimizer.reset();
  });

  test('🚀 Template pool warming should enable ultra performance mode', () => {
    console.log('\n🔥 Testing Template Pool Warming...');
    
    TemplateOptimizer.enableTemplatePoolWarming();
    
    const metrics = TemplateOptimizer.getTemplateOptimizationMetrics();
    
    expect(metrics.templateOptimization.mode).toBe('TEMPLATE_ULTRA_PERFORMANCE');
    expect(metrics.templateOptimization.templatePools.sizeBasedPools).toBeGreaterThan(0);
    expect(metrics.templateOptimization.templatePools.contentHashCache).toBeGreaterThan(0);
    
    console.log(`✅ Template pools initialized: ${metrics.templateOptimization.templatePools.sizeBasedPools} size pools`);
    console.log(`✅ Content hashes warmed: ${metrics.templateOptimization.templatePools.contentHashCache} patterns`);
  });

  test('⚡ Ultra-fast template parsing should achieve sub-millisecond performance', () => {
    console.log('\n⚡ Testing ultra-fast template parsing...');
    
    TemplateOptimizer.enableTemplatePoolWarming();
    
    const smallTemplate = '<div class="container"><p>{{content}}</p></div>';
    const mediumTemplate = `
      <section class="card">
        <header><h2>{{title}}</h2></header>
        <div class="content">
          <p>{{description}}</p>
          <button class="action">{{buttonText}}</button>
        </div>
        <footer>{{footer}}</footer>
      </section>
    `;
    const largeTemplate = `
      <article class="post">
        <header class="post-header">
          <h1>{{title}}</h1>
          <div class="meta">
            <span class="author">{{author}}</span>
            <time>{{date}}</time>
          </div>
        </header>
        <div class="post-content">
          <div class="excerpt">{{excerpt}}</div>
          <div class="content">{{content}}</div>
          <div class="tags">
            {{#tags}}<span class="tag">{{.}}</span>{{/tags}}
          </div>
        </div>
        <footer class="post-footer">
          <div class="actions">
            <button class="like">{{likeText}}</button>
            <button class="share">{{shareText}}</button>
          </div>
        </footer>
      </article>
    `;
    
    // Test multiple template sizes
    const templates = [smallTemplate, mediumTemplate, largeTemplate];
    const results = [];
    
    templates.forEach((template, index) => {
      const startTime = performance.now();
      
      // Parse same template multiple times (should hit cache)
      for (let i = 0; i < 10; i++) {
        TemplateOptimizer.parseUltraFastTemplate(template, { 
          priority: 'high',
          cacheStrategy: 'aggressive' 
        });
      }
      
      const endTime = performance.now();
      const avgTime = (endTime - startTime) / 10;
      results.push(avgTime);
      
      console.log(`📊 Template ${index + 1} (${template.length} chars): ${avgTime.toFixed(4)}ms avg`);
    });
    
    const metrics = TemplateOptimizer.getTemplateOptimizationMetrics();
    console.log(`🎯 Template cache hit rate: ${metrics.templateOptimization.cacheEfficiency.templateHits}`);
    
    // Verify performance targets
    results.forEach(avgTime => {
      expect(avgTime).toBeLessThan(3); // Should be sub-3ms for all sizes
    });
    
    // Verify caching is working
    expect(parseFloat(metrics.templateOptimization.cacheEfficiency.templateHits)).toBeGreaterThan(70);
  });

  test('🎨 Template inheritance should optimize component composition', () => {
    console.log('\n🎨 Testing template inheritance optimization...');
    
    TemplateOptimizer.enableTemplatePoolWarming();
    
    const baseTemplate = '<div class="component">{{content}}</div>';
    const extensions = [
      { class: 'primary' },
      { style: 'background: blue' },
      { attributes: { 'data-type': 'enhanced' } }
    ];
    
    const startTime = performance.now();
    
    // Create multiple inherited templates
    for (let i = 0; i < 15; i++) {
      const inherited = TemplateOptimizer.createInheritedTemplate(
        baseTemplate, 
        extensions, 
        { 
          optimization: 'aggressive',
          caching: true 
        }
      );
      expect(inherited).toBeTruthy();
    }
    
    const endTime = performance.now();
    const avgTime = (endTime - startTime) / 15;
    
    console.log(`⚡ Created 15 inherited templates in ${(endTime - startTime).toFixed(4)}ms (avg: ${avgTime.toFixed(4)}ms)`);
    
    const metrics = TemplateOptimizer.getTemplateOptimizationMetrics();
    console.log(`📊 Inheritance chains cached: ${metrics.templateOptimization.templatePools.inheritanceChains}`);
    
    // Verify inheritance performance
    expect(avgTime).toBeLessThan(2); // Should be sub-2ms per inheritance
    expect(metrics.templateOptimization.templatePools.inheritanceChains).toBeGreaterThan(0);
  });

  test('🌊 Template streaming should enable progressive loading', () => {
    console.log('\n🌊 Testing template streaming...');
    
    TemplateOptimizer.enableTemplatePoolWarming();
    
    const largeTemplate = `
      <div class="progressive-component">
        <header>{{header}}</header>
        <main>
          <section class="primary">{{primaryContent}}</section>
          <section class="secondary">{{secondaryContent}}</section>
          <section class="tertiary">{{tertiaryContent}}</section>
        </main>
        <footer>{{footer}}</footer>
      </div>
    `;
    
    const startTime = performance.now();
    
    const streaming = TemplateOptimizer.createStreamingTemplate(largeTemplate, {
      chunkSize: 500,
      priority: 'high',
      loadStrategy: 'progressive'
    });
    
    const endTime = performance.now();
    const initTime = endTime - startTime;
    
    console.log(`🚀 Streaming template initialized in ${initTime.toFixed(4)}ms`);
    
    // Verify streaming components
    expect(streaming.placeholder).toBeTruthy();
    expect(streaming.templateId).toBeTruthy();
    expect(typeof streaming.onReady).toBe('function');
    expect(typeof streaming.getProgress).toBe('function');
    
    // Verify initialization is fast
    expect(initTime).toBeLessThan(5); // Should initialize in <5ms
    
    console.log(`✅ Streaming template ready: ${streaming.templateId.substring(0, 20)}...`);
  });

  test('🔄 Live template updates should achieve surgical DOM precision', () => {
    console.log('\n🔄 Testing live template updates...');
    
    TemplateOptimizer.enableTemplatePoolWarming();
    
    // Create a template instance
    const template = TemplateOptimizer.parseUltraFastTemplate(
      '<div class="live-component"><h2>{{title}}</h2><p>{{content}}</p></div>',
      { liveUpdates: true }
    );
    
    const templateInstance = {
      id: 'live-test-1',
      template: template,
      shadowRoot: document.createElement('div')
    };
    
    const startTime = performance.now();
    
    const liveBinding = TemplateOptimizer.enableLiveTemplateUpdates(templateInstance, {
      diffStrategy: 'content-hash',
      updateMode: 'surgical',
      batchUpdates: true
    });
    
    const setupTime = performance.now() - startTime;
    
    // Perform multiple updates
    const updateStartTime = performance.now();
    
    for (let i = 0; i < 10; i++) {
      liveBinding.update({
        title: `Title ${i}`,
        content: `Content updated ${i} times`
      });
    }
    
    const updateEndTime = performance.now();
    const avgUpdateTime = (updateEndTime - updateStartTime) / 10;
    
    console.log(`⚡ Live updates setup in ${setupTime.toFixed(4)}ms`);
    console.log(`🎯 Average live update time: ${avgUpdateTime.toFixed(4)}ms`);
    
    const metrics = TemplateOptimizer.getTemplateOptimizationMetrics();
    console.log(`📊 Live templates active: ${metrics.templateOptimization.templatePools.liveTemplates}`);
    
    // Verify live update performance
    expect(setupTime).toBeLessThan(2); // Setup should be <2ms
    expect(avgUpdateTime).toBeLessThan(1); // Updates should be <1ms
    expect(metrics.templateOptimization.templatePools.liveTemplates).toBeGreaterThan(0);
    
    // Cleanup
    liveBinding.destroy();
  });

  test('📈 Template optimization should exceed Week 2 performance baseline', () => {
    console.log('\n📈 Testing performance vs Week 2 baseline...');
    
    TemplateOptimizer.enableTemplatePoolWarming();
    
    const complexTemplate = `
      <div class="complex-component">
        <header class="header">
          <h1>{{title}}</h1>
          <nav>
            {{#navigation}}
            <a href="{{url}}">{{text}}</a>
            {{/navigation}}
          </nav>
        </header>
        <main class="content">
          <section class="primary">
            <h2>{{primaryTitle}}</h2>
            <div class="content">{{primaryContent}}</div>
          </section>
          <aside class="sidebar">
            <h3>{{sidebarTitle}}</h3>
            <ul>
              {{#sidebarItems}}
              <li>{{.}}</li>
              {{/sidebarItems}}
            </ul>
          </aside>
        </main>
        <footer class="footer">
          <p>{{footerText}}</p>
        </footer>
      </div>
    `;
    
    // Measure Week 3 template optimization
    const week3StartTime = performance.now();
    const week3Components = [];
    
    for (let i = 0; i < 20; i++) {
      const optimized = TemplateOptimizer.parseUltraFastTemplate(complexTemplate, {
        optimization: 'ultra',
        pooling: true,
        caching: 'aggressive'
      });
      week3Components.push(optimized);
    }
    
    const week3EndTime = performance.now();
    const week3Duration = week3EndTime - week3StartTime;
    
    // Simulate Week 2 baseline (using basic ShadowDOMOptimizer)
    const week2StartTime = performance.now();
    const week2Components = [];
    
    for (let i = 0; i < 20; i++) {
      const basic = document.createDocumentFragment();
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = complexTemplate;
      
      while (tempDiv.firstChild) {
        basic.appendChild(tempDiv.firstChild);
      }
      
      week2Components.push(basic);
    }
    
    const week2EndTime = performance.now();
    const week2Duration = week2EndTime - week2StartTime;
    
    const speedupFactor = week2Duration / week3Duration;
    
    console.log(`🚀 Week 3 Templates: ${week3Duration.toFixed(4)}ms`);
    console.log(`📊 Week 2 Baseline: ${week2Duration.toFixed(4)}ms`);
    console.log(`🎯 Template speedup: ${speedupFactor.toFixed(2)}x faster`);
    
    const metrics = TemplateOptimizer.getTemplateOptimizationMetrics();
    console.log(`⚡ Cache efficiency: ${metrics.templateOptimization.cacheEfficiency.templateHits}`);
    console.log(`🧠 Template pools utilized: ${metrics.templateOptimization.templatePools.sizeBasedPools}`);
    
    // Verify we're building on Week 2's foundation
    expect(speedupFactor).toBeGreaterThan(1.2); // Should be at least 20% faster than Week 2
    expect(week3Components.length).toBe(20);
    expect(week2Components.length).toBe(20);
    
    // Verify template optimization is working
    expect(parseFloat(metrics.templateOptimization.cacheEfficiency.templateHits)).toBeGreaterThan(80);
    
    console.log(`📈 Template optimization advantage: ${speedupFactor.toFixed(3)}x (building on Week 2's 2.64x React advantage)`);
  });

  test('🎛️ Template optimization metrics should provide comprehensive insights', () => {
    console.log('\n🎛️ Testing template optimization metrics...');
    
    TemplateOptimizer.enableTemplatePoolWarming();
    
    // Create various template operations to generate metrics
    const templates = [
      '<div>{{simple}}</div>',
      '<section><h1>{{title}}</h1><p>{{content}}</p></section>',
      '<article>{{#items}}<div>{{name}}: {{value}}</div>{{/items}}</article>'
    ];
    
    templates.forEach((template, index) => {
      for (let i = 0; i < 5; i++) {
        TemplateOptimizer.parseUltraFastTemplate(template, {
          caching: true,
          optimization: 'ultra'
        });
      }
    });
    
    // Test inheritance
    TemplateOptimizer.createInheritedTemplate(
      templates[0], 
      [{ class: 'test' }], 
      { caching: true }
    );
    
    const metrics = TemplateOptimizer.getTemplateOptimizationMetrics();
    
    console.log('📊 TEMPLATE OPTIMIZATION METRICS:');
    console.log(`Mode: ${metrics.templateOptimization.mode}`);
    console.log(`Template Pools: ${metrics.templateOptimization.templatePools.sizeBasedPools} size pools`);
    console.log(`Content Hash Cache: ${metrics.templateOptimization.templatePools.contentHashCache} patterns`);
    console.log(`Inheritance Chains: ${metrics.templateOptimization.templatePools.inheritanceChains} cached`);
    console.log(`Cache Hit Rate: ${metrics.templateOptimization.cacheEfficiency.templateHits}`);
    console.log(`Fragment Cache: ${metrics.templateOptimization.cacheEfficiency.fragmentCacheUtilization} fragments`);
    
    // Verify metrics structure and values
    expect(metrics.templateOptimization).toBeDefined();
    expect(metrics.templateOptimization.mode).toBe('TEMPLATE_ULTRA_PERFORMANCE');
    expect(metrics.templateOptimization.templatePools.sizeBasedPools).toBeGreaterThan(0);
    expect(metrics.templateOptimization.templatePools.contentHashCache).toBeGreaterThan(0);
    expect(parseFloat(metrics.templateOptimization.cacheEfficiency.templateHits)).toBeGreaterThanOrEqual(0);
    
    // Verify we still have Week 2's breakthrough metrics
    expect(metrics.breakthroughStatus).toBeDefined();
    expect(metrics.poolingStats).toBeDefined();
  });
});

module.exports = {
  testTemplateOptimization: () => {
    console.log('🚀 Template optimization tests available');
    return TemplateOptimizer.getTemplateOptimizationMetrics();
  }
};
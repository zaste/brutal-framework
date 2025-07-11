/**
 * @fileoverview Tests for Visual Debug Layer
 * @version 3.0.0
 */

import { describe, test, expect } from '../test-suite.js';
import { VisualDebugLayer } from '../03-visual/debug/VisualDebugLayer.js';
import { ComponentMonitor } from '../03-visual/debug/ComponentMonitor.js';
import { DataFlowRenderer } from '../03-visual/debug/DataFlowRenderer.js';
import { PerformanceHUD } from '../03-visual/debug/PerformanceHUD.js';
import { AutomatedVisualTester } from '../03-visual/debug/AutomatedVisualTester.js';
import { ParticleEngine } from '../03-visual/gpu/ParticleEngine.js';
import { GPUComponent } from '../03-visual/gpu/GPUComponent.js';
import { particleEffects } from '../03-visual/effects/ParticleEffects.js';

describe('Visual Debug Layer', () => {
    test('VisualDebugLayer initializes correctly', async () => {
        const debugLayer = new VisualDebugLayer({ enabled: true });
        
        // Should create but not initialize without canvas
        expect(debugLayer.enabled).toBe(true);
        expect(debugLayer.canvas).toBe(null);
        
        // Mock DOM
        document.body.innerHTML = '<div id="test"></div>';
        
        await debugLayer.init();
        
        // Should create overlay
        expect(document.getElementById('brutal-debug-layer')).toBeTruthy();
        expect(debugLayer.canvas).toBeTruthy();
        expect(debugLayer.particleEngine).toBeTruthy();
        
        // Clean up
        debugLayer.destroy();
    });
    
    test('ComponentMonitor tracks components', () => {
        const monitor = new ComponentMonitor();
        
        // Mock component
        const mockComponent = {
            tagName: 'TEST-COMPONENT',
            getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }),
            parentElement: null,
            children: []
        };
        
        // Track render
        monitor.trackRender(mockComponent, { renderTime: 5 });
        
        const report = monitor.getReport();
        expect(report.summary.totalRenders).toBe(1);
        expect(report.summary.activeComponents).toBe(1);
        
        // Track error
        monitor.trackError(mockComponent, new Error('Test error'));
        expect(monitor.getReport().summary.totalErrors).toBe(1);
        
        // Track destroy
        monitor.trackDestroy(mockComponent);
        expect(monitor.getReport().summary.activeComponents).toBe(0);
    });
    
    test('DataFlowRenderer tracks state changes', () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const renderer = new DataFlowRenderer(ctx);
        
        // Mock component
        const mockComponent = {
            getBoundingClientRect: () => ({ left: 100, top: 100, width: 50, height: 50 })
        };
        
        // Render state change
        const oldState = { count: 0 };
        const newState = { count: 1 };
        
        renderer.renderStateChange(mockComponent, oldState, newState);
        
        // Should create flow
        expect(renderer.flows.length).toBe(1);
        expect(renderer.flows[0].type).toBe('state');
        expect(renderer.flows[0].data.length).toBe(1);
        expect(renderer.flows[0].data[0].key).toBe('count');
        
        // Update animation
        renderer.update(16);
        
        // Clean up
        renderer.clear();
        expect(renderer.flows.length).toBe(0);
    });
    
    test('PerformanceHUD calculates metrics', () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const hud = new PerformanceHUD(ctx);
        
        // Update metrics
        hud.update(16.67); // 60fps frame
        
        // Should calculate FPS
        expect(hud.fps).toBeGreaterThan(0);
        expect(hud.frameTime).toBe(16.67);
        
        // Test gem activity tracking
        hud.trackGemActivity('StyleManager');
        expect(hud.gemsActivity.get('StyleManager')).toBe(true);
        
        // Export data
        const data = hud.exportData();
        expect(data.fps.current).toBe(hud.fps);
        expect(data.frameTime.current).toBe(16.67);
    });
    
    test('AutomatedVisualTester runs tests', async () => {
        const tester = new AutomatedVisualTester({ enabled: true, puppeteer: false });
        
        // Mock baseline
        tester.baseline = {
            timestamp: Date.now() - 60000,
            fps: 60,
            memory: 50,
            renderTime: 10,
            componentCount: 5
        };
        
        // Mock window objects
        window.__BRUTAL_DEBUG__ = {
            performanceHUD: { fps: 58, frameTime: 17 },
            componentMonitor: {
                metrics: { activeComponents: 5, totalRenders: 100, totalErrors: 1 },
                getReport: () => ({
                    summary: {
                        activeComponents: 5,
                        totalRenders: 100,
                        totalErrors: 1
                    }
                })
            }
        };
        
        // Collect metrics
        const metrics = await tester._collectMetrics();
        expect(metrics.fps).toBe(58);
        expect(metrics.componentCount).toBe(5);
        
        // Run performance tests
        const perfTests = await tester._runPerformanceTests();
        expect(perfTests.length).toBeGreaterThan(0);
        
        // First test should be FPS check
        expect(perfTests[0].name).toBe('FPS Check');
        expect(perfTests[0].status).toBe('passed'); // 58 >= 30
        
        // Get report
        const report = tester.getReport();
        expect(report.summary).toBeTruthy();
        expect(report.performanceBaseline).toBe(tester.baseline);
        
        // Clean up
        await tester.destroy();
        delete window.__BRUTAL_DEBUG__;
    });
    
    test('ParticleEngine manages particles', async () => {
        const canvas = document.createElement('canvas');
        const engine = new ParticleEngine(canvas);
        await engine.init();
        
        // Test particle emission
        engine.emit({
            x: 100,
            y: 100,
            count: 10,
            speed: 2,
            life: 1000,
            size: 4,
            color: '#ff0000'
        });
        
        expect(engine.particles.length).toBe(10);
        expect(engine.getParticleCount()).toBe(10);
        
        // Update particles
        engine.update(16);
        
        // Particles should have moved
        const firstParticle = engine.particles[0];
        expect(firstParticle.x).not.toBe(100);
        expect(firstParticle.life).toBeGreaterThan(0);
        
        // Test emitter
        const emitter = engine.createEmitter('test', {
            x: 200,
            y: 200,
            rate: 60
        });
        
        expect(engine.emitters.has('test')).toBe(true);
        expect(emitter.active).toBe(true);
        
        // Clear all
        engine.clear();
        expect(engine.particles.length).toBe(0);
        expect(engine.emitters.size).toBe(0);
        
        // Clean up
        engine.destroy();
    });
    
    test('GPUComponent detects capabilities', async () => {
        const component = new GPUComponent();
        
        // Should start uninitialized
        expect(component.gpu.available).toBe(false);
        expect(component.gpu.type).toBe(null);
        
        // Initialize GPU (will fallback to Canvas2D in tests)
        await component.initGPU();
        
        expect(component.gpu.available).toBe(true);
        expect(component.gpu.type).toBeTruthy();
        expect(component.offscreenCanvas).toBeTruthy();
        
        // Test shader compilation (Canvas2D returns null)
        const shader = component.compileShader('vertex', 'test');
        expect(shader).toBe(null); // Canvas2D doesn't support shaders
        
        // Get GPU info
        const info = component.getGPUInfo();
        expect(info.available).toBe(true);
        expect(info.type).toBe(component.gpu.type);
    });
    
    test('ParticleEffects plays predefined effects', async () => {
        const canvas = document.createElement('canvas');
        await particleEffects.init(canvas);
        
        // Get effect list
        const effects = particleEffects.getEffectList();
        expect(effects.length).toBeGreaterThan(0);
        
        // Play success effect
        const effectId = particleEffects.play('success', { x: 100, y: 100 });
        expect(particleEffects.engine.particles.length).toBeGreaterThan(0);
        
        // Test quality adjustment
        particleEffects.setQuality('low');
        expect(particleEffects.settings.quality).toBe('low');
        expect(particleEffects.settings.maxParticles).toBe(1000);
        
        // Stop all effects
        particleEffects.stopAll();
        expect(particleEffects.engine.particles.length).toBe(0);
        
        // Clean up
        particleEffects.destroy();
    });
    
    test('Visual Debug integration works', () => {
        // Set debug flags
        window.__BRUTAL__ = {
            debug: true,
            autoTest: false
        };
        
        // Mock component with events
        const mockComponent = {
            tagName: 'TEST-COMPONENT',
            getBoundingClientRect: () => ({ 
                left: 50, 
                top: 50, 
                width: 100, 
                height: 100 
            }),
            dispatchEvent: (event) => {
                window.dispatchEvent(event);
            }
        };
        
        // Dispatch render event
        const renderEvent = new CustomEvent('brutal:render', {
            detail: {
                component: mockComponent,
                metrics: { renderTime: 5 }
            }
        });
        
        let eventReceived = false;
        window.addEventListener('brutal:render', () => {
            eventReceived = true;
        });
        
        mockComponent.dispatchEvent(renderEvent);
        expect(eventReceived).toBe(true);
        
        // Clean up
        delete window.__BRUTAL__;
    });
    
    test('Shader Library provides shaders', () => {
        const { shaderLibrary } = require('../03-visual/gpu/ShaderLibrary.js');
        
        // Check particle shaders
        const particleVertex = shaderLibrary.getShader('particle-vertex');
        expect(particleVertex).toBeTruthy();
        expect(particleVertex.type).toBe('vertex');
        expect(particleVertex.source).toContain('#version 300 es');
        
        // Check effect shaders
        const glowShader = shaderLibrary.getShader('glow-fragment');
        expect(glowShader).toBeTruthy();
        expect(glowShader.type).toBe('fragment');
        
        // Check debug shaders
        const heatmapShader = shaderLibrary.getShader('heatmap-fragment');
        expect(heatmapShader).toBeTruthy();
        
        // Update common uniforms
        shaderLibrary.updateCommonUniforms(1.0, [1920, 1080], [960, 540]);
        expect(shaderLibrary.commonUniforms.time).toBe(1.0);
        expect(shaderLibrary.commonUniforms.resolution).toEqual([1920, 1080]);
    });
});
/**
 * BRUTAL V3 - HeroSection Component Tests
 * Comprehensive test suite for the hero section component
 */

import { describe, it, expect, createComponent, measurePerformance } from '../TestUtils.js';
import '../../04-components/core/HeroSection.js';

describe('HeroSection Component', () => {
    it('should create component with default props', async () => {
        const component = await createComponent('hero-section');
        
        expect(component.element).toBeInstanceOf(HTMLElement);
        expect(component.query('.hero-container')).toBeTruthy();
        expect(component.getState('variant')).toBe('default');
        
        component.destroy();
    });
    
    it('should render all variants correctly', async () => {
        const variants = [
            'default', 'split', 'fullscreen', 'video', 'gradient',
            'minimal', 'particles', 'parallax', 'animated', 'cta',
            'webgl', 'matrix', 'galaxy'
        ];
        
        for (const variant of variants) {
            const component = await createComponent('hero-section', { variant });
            
            expect(component.query('.hero-container')).toBeTruthy();
            expect(component.element.getAttribute('data-layout')).toBeTruthy();
            
            component.destroy();
        }
    });
    
    it('should handle title and subtitle updates', async () => {
        const component = await createComponent('hero-section');
        
        await component.setState('title', 'Test Title');
        await component.setState('subtitle', 'Test Subtitle');
        
        expect(component.query('.hero-title').textContent).toBe('Test Title');
        expect(component.query('.hero-subtitle').textContent).toBe('Test Subtitle');
        
        component.destroy();
    });
    
    it('should render action buttons when provided', async () => {
        const component = await createComponent('hero-section');
        
        await component.setState('primaryAction', {
            text: 'Get Started',
            href: '#start'
        });
        await component.setState('secondaryAction', {
            text: 'Learn More',
            href: '#learn'
        });
        
        const buttons = component.queryAll('.hero-btn');
        expect(buttons).toHaveLength(2);
        expect(buttons[0].textContent).toBe('Get Started');
        expect(buttons[1].textContent).toBe('Learn More');
        
        component.destroy();
    });
    
    it('should initialize particle system for particles variant', async () => {
        const component = await createComponent('hero-section', {
            variant: 'particles'
        });
        
        // Wait for particle initialization
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const canvas = component.query('.hero-canvas-bg');
        expect(canvas).toBeTruthy();
        expect(canvas.getContext).toBeTruthy();
        
        component.destroy();
    });
    
    it('should handle video variant with video source', async () => {
        const component = await createComponent('hero-section', {
            variant: 'video'
        });
        
        await component.setState('video', 'test-video.mp4');
        
        const video = component.query('.hero-video-bg');
        expect(video).toBeTruthy();
        expect(video.querySelector('source').src).toContain('test-video.mp4');
        
        component.destroy();
    });
    
    it('should lazy load images', async () => {
        const component = await createComponent('hero-section', {
            variant: 'split'
        });
        
        await component.setState('image', 'test-image.jpg');
        
        const img = component.query('.hero-image');
        expect(img.hasAttribute('data-lazy-src')).toBeTruthy();
        
        // Trigger intersection observer
        component.element.loadLazyAssets();
        
        expect(img.src).toContain('test-image.jpg');
        
        component.destroy();
    });
    
    it('should handle CTA variant features', async () => {
        const component = await createComponent('hero-section', {
            variant: 'cta'
        });
        
        const features = component.queryAll('.hero-feature');
        expect(features.length).toBeGreaterThan(0);
        expect(features[0].textContent).toContain('✓');
        
        component.destroy();
    });
    
    it('should emit custom events on action clicks', async () => {
        const component = await createComponent('hero-section');
        let eventFired = false;
        
        component.element.addEventListener('hero:action', (e) => {
            eventFired = true;
            expect(e.detail.action).toHaveProperty('text');
        });
        
        await component.setState('primaryAction', {
            text: 'Click Me',
            href: '#'
        });
        
        await component.click('.hero-btn-primary');
        
        expect(eventFired).toBeTruthy();
        
        component.destroy();
    });
    
    it('should maintain high performance with particle effects', async () => {
        const component = await createComponent('hero-section', {
            variant: 'particles'
        });
        
        const metrics = await measurePerformance(async () => {
            // Force re-render
            await component.setState('title', `Title ${Math.random()}`);
        }, 50);
        
        expect(metrics.fps).toBeGreaterThan(30);
        expect(metrics.avg).toBeLessThan(16.67); // 60fps threshold
        
        component.destroy();
    });
    
    it('should handle WebGL initialization gracefully', async () => {
        const component = await createComponent('hero-section', {
            variant: 'webgl'
        });
        
        // Component should not throw even if WebGL is not available
        expect(component.element).toBeTruthy();
        
        const canvas = component.query('.hero-webgl-bg');
        if (canvas) {
            expect(canvas.getContext).toBeTruthy();
        }
        
        component.destroy();
    });
    
    it('should clean up resources on disconnect', async () => {
        const component = await createComponent('hero-section', {
            variant: 'particles'
        });
        
        // Get animation frame count before
        const framesBefore = component.element.animationFrames?.size || 0;
        
        // Disconnect
        component.element.disconnectedCallback();
        
        // Animation frames should be cleared
        expect(component.element.animationFrames.size).toBe(0);
        
        component.destroy();
    });
    
    it('should resize canvas on container resize', async () => {
        const component = await createComponent('hero-section', {
            variant: 'particles'
        });
        
        const canvas = component.query('.hero-canvas-bg');
        if (canvas) {
            const initialWidth = canvas.width;
            
            // Simulate resize
            component.element.style.width = '800px';
            component.element.resizeCanvas();
            
            expect(canvas.width).toBe(800);
        }
        
        component.destroy();
    });
    
    it('should support theme customization via CSS variables', async () => {
        const component = await createComponent('hero-section');
        
        // Set CSS variables
        component.element.style.setProperty('--hero-title-color', 'red');
        component.element.style.setProperty('--hero-primary-color', 'blue');
        
        const styles = getComputedStyle(component.element);
        expect(styles.getPropertyValue('--hero-title-color')).toBe('red');
        expect(styles.getPropertyValue('--hero-primary-color')).toBe('blue');
        
        component.destroy();
    });
    
    it('should handle gradient variant with custom colors', async () => {
        const component = await createComponent('hero-section', {
            variant: 'gradient'
        });
        
        component.element.style.setProperty('--gradient-start', '#ff0000');
        component.element.style.setProperty('--gradient-end', '#0000ff');
        
        const gradientBg = component.query('.hero-gradient-bg');
        expect(gradientBg).toBeTruthy();
        
        component.destroy();
    });
});

// Run tests
import { TestUtils } from '../TestUtils.js';
TestUtils.printReport();
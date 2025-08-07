import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { animate, timeline } from '../src/index';

describe('@brutal/animation - Integration Tests', () => {
  let element: HTMLElement;
  let animationFrameCallbacks: Array<(time: number) => void> = [];
  let currentTime = 0;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    element = document.createElement('div');
    document.body.appendChild(element);
    
    // Reset time
    currentTime = 0;
    animationFrameCallbacks = [];
    
    // Mock performance.now
    global.performance = {
      now: jest.fn(() => currentTime)
    } as any;
    
    // Mock RAF to have full control
    let rafId = 0;
    global.requestAnimationFrame = jest.fn((callback) => {
      animationFrameCallbacks.push(callback);
      return ++rafId;
    }) as any;
    
    // Mock getComputedStyle
    global.getComputedStyle = jest.fn(() => ({
      transform: 'none',
      opacity: '1'
    })) as any;
  });

  afterEach(() => {
    animationFrameCallbacks = [];
  });

  // Helper to advance time and trigger RAF callbacks
  const advanceTime = (ms: number) => {
    currentTime += ms;
    const callbacks = [...animationFrameCallbacks];
    animationFrameCallbacks = [];
    callbacks.forEach(cb => cb(currentTime));
  };

  describe('Basic animations', () => {
    it('should animate opacity from 1 to 0', () => {
      animate(element, { opacity: 0 }, { duration: 100 });
      
      // Initial state
      expect(element.style.opacity).toBe('');
      
      // First frame - initialization
      advanceTime(16);
      expect(element.style.opacity).toBeTruthy();
      const initialOpacity = parseFloat(element.style.opacity);
      expect(initialOpacity).toBeLessThan(1);
      expect(initialOpacity).toBeGreaterThan(0);
      
      // Mid animation (50ms = 50%)
      advanceTime(34); // Total: 50ms
      const midOpacity = parseFloat(element.style.opacity);
      expect(midOpacity).toBeLessThan(initialOpacity);
      expect(midOpacity).toBeCloseTo(0.5, 1);
      
      // Complete animation
      advanceTime(50); // Total: 100ms
      expect(element.style.opacity).toBe('0');
    });

    it('should animate transform properties', () => {
      animate(element, { x: 100, y: 50 }, { duration: 100 });
      
      advanceTime(16);
      expect(element.style.transform).toContain('translate');
      
      advanceTime(84); // Total: 100ms
      expect(element.style.transform).toBe('translate(100px,50px)');
    });

    it('should handle multiple properties', () => {
      animate(element, { x: 100, scale: 2, opacity: 0.5 }, { duration: 100 });
      
      advanceTime(16);
      expect(element.style.transform).toContain('translate');
      expect(element.style.transform).toContain('scale');
      expect(element.style.opacity).toBeTruthy();
      
      advanceTime(84); // Total: 100ms
      expect(element.style.transform).toContain('translate(100px,0px)');
      expect(element.style.transform).toContain('scale(2)');
      expect(element.style.opacity).toBe('0.5');
    });
  });

  describe('Animation options', () => {
    it('should respect delay', () => {
      animate(element, { opacity: 0 }, { duration: 100, delay: 50 });
      
      // Before delay
      advanceTime(30);
      expect(element.style.opacity).toBe('');
      
      // After delay starts
      advanceTime(40); // Total: 70ms (20ms into animation)
      expect(element.style.opacity).toBeTruthy();
      const opacity = parseFloat(element.style.opacity);
      expect(opacity).toBeLessThan(1);
      expect(opacity).toBeGreaterThan(0.5);
    });

    it('should call callbacks', () => {
      const onUpdate = jest.fn();
      const onComplete = jest.fn();
      
      animate(element, { opacity: 0 }, { 
        duration: 100, 
        onUpdate,
        onComplete 
      });
      
      // Start
      advanceTime(16);
      expect(onUpdate).toHaveBeenCalled();
      expect(onUpdate).toHaveBeenLastCalledWith(expect.any(Number));
      expect(onComplete).not.toHaveBeenCalled();
      
      // Complete
      advanceTime(100);
      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(onUpdate).toHaveBeenLastCalledWith(1);
    });

    it('should stop animation', () => {
      const onComplete = jest.fn();
      const { stop } = animate(element, { opacity: 0 }, { 
        duration: 100,
        onComplete 
      });
      
      advanceTime(50);
      const midOpacity = element.style.opacity;
      
      stop();
      advanceTime(60); // Would complete if not stopped
      
      expect(element.style.opacity).toBe(midOpacity);
      expect(onComplete).not.toHaveBeenCalled();
    });
  });

  describe('Easing functions', () => {
    it('should apply different easing curves', () => {
      // Linear
      animate(element, { x: 100 }, { duration: 100, easing: 'linear' });
      advanceTime(50);
      expect(element.style.transform).toContain('translate(50px');
      
      // Reset
      element.style.transform = '';
      currentTime = 0;
      animationFrameCallbacks = [];
      
      // EaseOut (default) - should be > 50% at halfway
      animate(element, { x: 100 }, { duration: 100, easing: 'easeOut' });
      advanceTime(50);
      const transform = element.style.transform;
      const match = transform.match(/translate\((\d+)px/);
      expect(match).toBeTruthy();
      const x = parseFloat(match![1]);
      expect(x).toBeGreaterThan(50);
      expect(x).toBeLessThan(100);
    });

    it('should accept custom easing', () => {
      const customEasing = jest.fn((t: number) => t * t * t);
      
      animate(element, { opacity: 0 }, { 
        duration: 100, 
        easing: customEasing 
      });
      
      advanceTime(50);
      expect(customEasing).toHaveBeenCalled();
      expect(customEasing).toHaveBeenCalledWith(0.5);
    });
  });

  describe('Timeline', () => {
    it('should animate in sequence', async () => {
      const el1 = document.createElement('div');
      const el2 = document.createElement('div');
      document.body.appendChild(el1);
      document.body.appendChild(el2);
      
      const onComplete1 = jest.fn();
      const onComplete2 = jest.fn();
      
      timeline([
        [el1, { opacity: 0 }, { duration: 100, onComplete: onComplete1 }],
        [el2, { opacity: 0 }, { duration: 100, onComplete: onComplete2 }]
      ]);
      
      // First animation starts
      advanceTime(16);
      expect(el1.style.opacity).toBeTruthy();
      expect(el2.style.opacity).toBe('');
      
      // First completes
      advanceTime(100);
      expect(el1.style.opacity).toBe('0');
      expect(onComplete1).toHaveBeenCalled();
      expect(onComplete2).not.toHaveBeenCalled();
      
      // Second starts
      await Promise.resolve(); // Let promise chain resolve
      advanceTime(16);
      expect(el2.style.opacity).toBeTruthy();
      
      // Second completes
      advanceTime(100);
      expect(el2.style.opacity).toBe('0');
      expect(onComplete2).toHaveBeenCalled();
    });

    it('should stop entire timeline', () => {
      const el1 = document.createElement('div');
      const el2 = document.createElement('div');
      
      const { stop } = timeline([
        [el1, { opacity: 0 }, { duration: 100 }],
        [el2, { opacity: 0 }, { duration: 100 }]
      ]);
      
      advanceTime(50);
      stop();
      
      advanceTime(200);
      expect(el2.style.opacity).toBe(''); // Never started
    });
  });

  describe('Promises', () => {
    it('should resolve promise on complete', async () => {
      let resolved = false;
      
      const { promise } = animate(element, { opacity: 0 }, { duration: 100 });
      promise.then(() => { resolved = true; });
      
      expect(resolved).toBe(false);
      
      advanceTime(100);
      await Promise.resolve();
      
      expect(resolved).toBe(true);
    });

    it('should not resolve if stopped', async () => {
      let resolved = false;
      
      const anim = animate(element, { opacity: 0 }, { duration: 100 });
      anim.promise.then(() => { resolved = true; });
      
      advanceTime(50);
      anim.stop();
      advanceTime(60);
      await Promise.resolve();
      
      expect(resolved).toBe(false);
    });
  });
});
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { animate, timeline, easings } from '../src/index';

describe('@brutal/animation', () => {
  let element: HTMLElement;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    element = document.createElement('div');
    element.style.cssText = 'position: absolute; width: 100px; height: 100px;';
    document.body.appendChild(element);
    
    // Mock RAF with immediate execution for testing
    jest.useFakeTimers();
    let rafId = 0;
    global.requestAnimationFrame = jest.fn((cb) => {
      const id = ++rafId;
      setTimeout(() => cb(performance.now()), 16);
      return id;
    }) as any;
    global.performance = {
      now: jest.fn(() => Date.now())
    } as any;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Basic animations', () => {
    it('should animate opacity', async () => {
      const anim = animate(element, { opacity: 0 }, { duration: 100 });
      
      expect(element.style.opacity).toBe('');
      
      // Start animation
      jest.advanceTimersByTime(16);
      expect(parseFloat(element.style.opacity)).toBeGreaterThan(0.5);
      
      // Complete animation
      jest.advanceTimersByTime(100);
      expect(element.style.opacity).toBe('0');
    });

    it('should animate transform properties', async () => {
      animate(element, { x: 100, y: 50 }, { duration: 100 });
      
      jest.advanceTimersByTime(16);
      expect(element.style.transform).toContain('translate');
      
      jest.advanceTimersByTime(100);
      expect(element.style.transform).toContain('translate(100px, 50px)');
    });

    it('should animate scale', async () => {
      animate(element, { scale: 2 }, { duration: 100 });
      
      jest.advanceTimersByTime(116);
      expect(element.style.transform).toContain('scale(2)');
    });

    it('should animate rotation', async () => {
      animate(element, { rotate: 180 }, { duration: 100 });
      
      jest.advanceTimersByTime(116);
      expect(element.style.transform).toContain('rotate(180deg)');
    });

    it('should handle multiple properties', async () => {
      animate(element, { x: 100, opacity: 0.5, scale: 1.5 }, { duration: 100 });
      
      jest.advanceTimersByTime(116);
      expect(element.style.transform).toContain('translate(100px');
      expect(element.style.transform).toContain('scale(1.5)');
      expect(element.style.opacity).toBe('0.5');
    });
  });

  describe('Animation options', () => {
    it('should respect delay', async () => {
      animate(element, { opacity: 0 }, { duration: 100, delay: 50 });
      
      jest.advanceTimersByTime(30);
      expect(element.style.opacity).toBe('');
      
      jest.advanceTimersByTime(50);
      expect(parseFloat(element.style.opacity)).toBeGreaterThan(0);
    });

    it('should call onComplete', async () => {
      const onComplete = jest.fn();
      animate(element, { opacity: 0 }, { duration: 100, onComplete });
      
      expect(onComplete).not.toHaveBeenCalled();
      
      jest.advanceTimersByTime(116);
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('should call onUpdate with progress', async () => {
      const onUpdate = jest.fn();
      animate(element, { opacity: 0 }, { duration: 100, onUpdate });
      
      jest.advanceTimersByTime(50);
      expect(onUpdate).toHaveBeenCalled();
      expect(onUpdate.mock.calls[0][0]).toBeGreaterThan(0);
      expect(onUpdate.mock.calls[0][0]).toBeLessThan(1);
      
      jest.advanceTimersByTime(66);
      expect(onUpdate.mock.calls[onUpdate.mock.calls.length - 1][0]).toBe(1);
    });

    it('should stop animation', async () => {
      const { stop } = animate(element, { opacity: 0 }, { duration: 100 });
      
      jest.advanceTimersByTime(50);
      const midOpacity = parseFloat(element.style.opacity);
      
      stop();
      jest.advanceTimersByTime(50);
      
      expect(parseFloat(element.style.opacity)).toBe(midOpacity);
    });
  });

  describe('Easing functions', () => {
    it('should apply linear easing', () => {
      expect(easings.linear(0)).toBe(0);
      expect(easings.linear(0.5)).toBe(0.5);
      expect(easings.linear(1)).toBe(1);
    });

    it('should apply easeIn', () => {
      expect(easings.easeIn(0)).toBe(0);
      expect(easings.easeIn(0.5)).toBe(0.25);
      expect(easings.easeIn(1)).toBe(1);
    });

    it('should apply easeOut', () => {
      expect(easings.easeOut(0)).toBe(0);
      expect(easings.easeOut(0.5)).toBe(0.75);
      expect(easings.easeOut(1)).toBe(1);
    });

    it('should apply easeInOut', () => {
      expect(easings.easeInOut(0)).toBe(0);
      expect(easings.easeInOut(0.25)).toBe(0.125);
      expect(easings.easeInOut(0.75)).toBe(0.875);
      expect(easings.easeInOut(1)).toBe(1);
    });

    it('should use custom easing function', async () => {
      const customEasing = (t: number) => t * t * t;
      animate(element, { opacity: 0 }, { duration: 100, easing: customEasing });
      
      jest.advanceTimersByTime(50);
      const opacity = parseFloat(element.style.opacity);
      expect(opacity).toBeCloseTo(1 - customEasing(0.5), 1);
    });
  });

  describe('Timeline', () => {
    it('should animate sequence', async () => {
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

      // First animation
      jest.advanceTimersByTime(116);
      expect(el1.style.opacity).toBe('0');
      expect(onComplete1).toHaveBeenCalled();
      expect(onComplete2).not.toHaveBeenCalled();

      // Second animation
      jest.advanceTimersByTime(116);
      expect(el2.style.opacity).toBe('0');
      expect(onComplete2).toHaveBeenCalled();
    });

    it('should stop timeline', () => {
      const el1 = document.createElement('div');
      const el2 = document.createElement('div');
      document.body.appendChild(el1);
      document.body.appendChild(el2);

      const { stop } = timeline([
        [el1, { opacity: 0 }, { duration: 100 }],
        [el2, { opacity: 0 }, { duration: 100 }]
      ]);

      jest.advanceTimersByTime(50);
      stop();

      const opacity1 = el1.style.opacity;
      jest.advanceTimersByTime(150);
      
      expect(el1.style.opacity).toBe(opacity1);
      expect(el2.style.opacity).toBe('');
    });
  });

  describe('Promise API', () => {
    it('should return promise that resolves on complete', async () => {
      const { promise } = animate(element, { opacity: 0 }, { duration: 100 });
      
      let resolved = false;
      promise.then(() => { resolved = true; });
      
      expect(resolved).toBe(false);
      
      jest.advanceTimersByTime(116);
      await Promise.resolve();
      
      expect(resolved).toBe(true);
    });

    it('should chain timeline promises', async () => {
      const el1 = document.createElement('div');
      const el2 = document.createElement('div');
      
      const { promise } = timeline([
        [el1, { opacity: 0 }, { duration: 50 }],
        [el2, { opacity: 0 }, { duration: 50 }]
      ]);
      
      let resolved = false;
      promise.then(() => { resolved = true; });
      
      jest.advanceTimersByTime(60);
      await Promise.resolve();
      expect(resolved).toBe(false);
      
      jest.advanceTimersByTime(60);
      await Promise.resolve();
      expect(resolved).toBe(true);
    });
  });
});
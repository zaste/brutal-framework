import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { animate, timeline } from '../src/index';

describe('@brutal/animation - Proper Tests', () => {
  let element: HTMLElement;
  let rafCallbacks: Array<(time: number) => void> = [];
  let rafId = 0;
  let currentTime = 0;

  beforeEach(() => {
    // Reset
    rafCallbacks = [];
    rafId = 0;
    currentTime = 0;
    
    // Mock DOM element
    element = {
      style: {
        transform: '',
        opacity: '',
        willChange: ''
      }
    } as any;
    
    // Mock performance.now
    global.performance = {
      now: jest.fn(() => currentTime)
    } as any;
    
    // Mock RAF to store callbacks
    global.requestAnimationFrame = jest.fn((callback) => {
      rafCallbacks.push(callback);
      return ++rafId;
    }) as any;
    
    // Mock getComputedStyle
    global.getComputedStyle = jest.fn(() => ({
      transform: 'none',
      opacity: '1'
    })) as any;
  });

  // Helper to run animation frames
  function runFrames(count: number, timePerFrame: number = 16) {
    for (let i = 0; i < count; i++) {
      currentTime += timePerFrame;
      const callbacks = [...rafCallbacks];
      rafCallbacks = []; // Clear before executing
      callbacks.forEach(cb => {
        cb(currentTime);
        // RAF might have scheduled new callbacks during execution
      });
    }
  }
  
  // Helper to run a single frame
  function runFrame() {
    currentTime += 16;
    const callbacks = [...rafCallbacks];
    rafCallbacks = [];
    callbacks.forEach(cb => cb(currentTime));
  }

  it('should animate opacity correctly', () => {
    animate(element, { opacity: 0 }, { duration: 100 });
    
    // Frame 1: Initialize (no visual change yet)
    runFrames(1);
    expect(rafCallbacks.length).toBe(1); // Should request next frame
    
    // Frame 2: First visual update
    runFrames(1);
    expect(element.style.opacity).toBeTruthy();
    const opacity1 = parseFloat(element.style.opacity);
    expect(opacity1).toBeLessThan(1);
    expect(opacity1).toBeGreaterThan(0);
    
    // Continue animation
    currentTime = 50; // Half way
    runFrames(1);
    const opacity2 = parseFloat(element.style.opacity);
    expect(opacity2).toBeLessThan(opacity1); // Should progress
    
    // Complete
    currentTime = 100;
    runFrames(1);
    expect(element.style.opacity).toBe('0');
    expect(element.style.willChange).toBe('auto'); // Cleaned up
  });

  it('should handle multiple simultaneous animations', () => {
    const el1 = { style: { opacity: '', transform: '', willChange: '' } } as any;
    const el2 = { style: { opacity: '', transform: '', willChange: '' } } as any;
    
    animate(el1, { opacity: 0 }, { duration: 100 });
    animate(el2, { opacity: 0.5 }, { duration: 100 });
    
    runFrames(2); // Init + first update
    
    expect(el1.style.opacity).toBeTruthy();
    expect(el2.style.opacity).toBeTruthy();
    expect(parseFloat(el1.style.opacity)).not.toBe(parseFloat(el2.style.opacity));
  });

  it('should stop animation correctly', () => {
    const onComplete = jest.fn();
    const { stop } = animate(element, { opacity: 0 }, { 
      duration: 100,
      onComplete 
    });
    
    runFrames(2);
    const midOpacity = element.style.opacity;
    
    stop();
    runFrames(5); // Would complete if not stopped
    
    expect(element.style.opacity).toBe(midOpacity);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('should respect delay', () => {
    animate(element, { opacity: 0 }, { duration: 100, delay: 50 });
    
    // During delay
    runFrames(1); // Init
    runFrames(1); // Should not start yet
    expect(element.style.opacity).toBe('');
    
    // After delay
    currentTime = 60;
    runFrames(1);
    expect(element.style.opacity).toBeTruthy();
  });

  it('should call callbacks correctly', () => {
    const onUpdate = jest.fn();
    const onComplete = jest.fn();
    
    animate(element, { opacity: 0 }, {
      duration: 100,
      onUpdate,
      onComplete
    });
    
    runFrames(2); // Init + first update
    expect(onUpdate).toHaveBeenCalled();
    const firstProgress = onUpdate.mock.calls[0][0];
    expect(firstProgress).toBeGreaterThan(0);
    expect(firstProgress).toBeLessThan(1);
    
    currentTime = 100;
    runFrames(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onUpdate).toHaveBeenLastCalledWith(1);
  });

  it('should handle transform animations', () => {
    // Mock getComputedStyle to return current transform
    let currentTransform = 'none';
    global.getComputedStyle = jest.fn(() => ({
      transform: currentTransform,
      opacity: '1'
    })) as any;
    
    animate(element, { x: 100, y: 50, scale: 2, rotate: 45 }, { duration: 100 });
    
    runFrames(2);
    expect(element.style.transform).toContain('translate');
    expect(element.style.transform).toContain('scale');
    expect(element.style.transform).toContain('rotate');
    expect(element.style.willChange).toBe('transform');
    
    currentTime = 100;
    runFrames(1);
    expect(element.style.transform).toBe('translate(100px,50px) scale(2) rotate(45deg)');
  });

  it('should apply easing correctly', () => {
    animate(element, { opacity: 0 }, { duration: 100, easing: 'linear' });
    
    runFrames(1); // Init
    currentTime = 50; // Exactly half
    runFrames(1);
    
    const opacity = parseFloat(element.style.opacity);
    expect(opacity).toBeCloseTo(0.5, 1); // Linear = 0.5 at halfway
  });

  it('should handle custom easing', () => {
    const customEasing = jest.fn((t: number) => t * t); // Quadratic
    
    animate(element, { opacity: 0 }, { 
      duration: 100, 
      easing: customEasing 
    });
    
    runFrames(1); // Init
    currentTime = 50;
    runFrames(1);
    
    expect(customEasing).toHaveBeenCalledWith(0.5);
    const opacity = parseFloat(element.style.opacity);
    expect(opacity).toBeCloseTo(0.75, 1); // 1 - (0.5 * 0.5) = 0.75
  });

  it('should handle timeline correctly', async () => {
    const el1 = { style: { opacity: '', transform: '', willChange: '' } } as any;
    const el2 = { style: { opacity: '', transform: '', willChange: '' } } as any;
    
    const complete1 = jest.fn();
    const complete2 = jest.fn();
    
    timeline([
      [el1, { opacity: 0 }, { duration: 50, onComplete: complete1 }],
      [el2, { opacity: 0 }, { duration: 50, onComplete: complete2 }]
    ]);
    
    // First animation
    runFrames(2);
    expect(el1.style.opacity).toBeTruthy();
    expect(el2.style.opacity).toBe('');
    
    // Complete first
    currentTime = 50;
    runFrames(1);
    expect(complete1).toHaveBeenCalled();
    
    // Let promise chain resolve
    await Promise.resolve();
    
    // Second should start
    runFrames(1); // Init second
    runFrames(1); // First update
    expect(el2.style.opacity).toBeTruthy();
  });

  it('should return working promises', async () => {
    let resolved = false;
    const { promise } = animate(element, { opacity: 0 }, { duration: 50 });
    
    promise.then(() => { resolved = true; });
    
    runFrames(2);
    expect(resolved).toBe(false);
    
    currentTime = 50;
    runFrames(1);
    
    await Promise.resolve();
    expect(resolved).toBe(true);
  });
});
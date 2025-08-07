import { describe, it, expect } from '@jest/globals';
import { animate, timeline, easings } from '../src/index';

describe('@brutal/animation - Basic functionality', () => {
  it('should export main functions', () => {
    expect(typeof animate).toBe('function');
    expect(typeof timeline).toBe('function');
  });

  it('should export easing functions', () => {
    expect(typeof easings.linear).toBe('function');
    expect(typeof easings.easeIn).toBe('function');
    expect(typeof easings.easeOut).toBe('function');
    expect(typeof easings.easeInOut).toBe('function');
  });

  it('should calculate easing values correctly', () => {
    // Linear
    expect(easings.linear(0)).toBe(0);
    expect(easings.linear(0.5)).toBe(0.5);
    expect(easings.linear(1)).toBe(1);
    
    // Ease In
    expect(easings.easeIn(0)).toBe(0);
    expect(easings.easeIn(0.5)).toBe(0.25);
    expect(easings.easeIn(1)).toBe(1);
    
    // Ease Out
    expect(easings.easeOut(0)).toBe(0);
    expect(easings.easeOut(0.5)).toBe(0.75);
    expect(easings.easeOut(1)).toBe(1);
    
    // Ease In Out
    expect(easings.easeInOut(0)).toBe(0);
    expect(easings.easeInOut(0.25)).toBe(0.125);
    expect(easings.easeInOut(0.5)).toBe(0.5);
    expect(easings.easeInOut(0.75)).toBe(0.875);
    expect(easings.easeInOut(1)).toBe(1);
  });

  it('should return control object from animate', () => {
    const element = document.createElement('div');
    const result = animate(element, { x: 100 }, { duration: 100 });
    
    expect(typeof result.stop).toBe('function');
    expect(result.promise).toBeInstanceOf(Promise);
  });

  it('should return control object from timeline', () => {
    const element = document.createElement('div');
    const result = timeline([
      [element, { x: 100 }, { duration: 100 }]
    ]);
    
    expect(typeof result.stop).toBe('function');
    expect(result.promise).toBeInstanceOf(Promise);
  });

  it('should accept all animation properties', () => {
    const element = document.createElement('div');
    
    // Should not throw
    expect(() => {
      animate(element, {
        x: 100,
        y: 50,
        scale: 2,
        rotate: 180,
        opacity: 0.5
      }, {
        duration: 500,
        delay: 100,
        easing: 'easeInOut',
        onComplete: () => {},
        onUpdate: () => {}
      });
    }).not.toThrow();
  });

  it('should accept custom easing function', () => {
    const element = document.createElement('div');
    const customEasing = (t: number) => t * t * t;
    
    expect(() => {
      animate(element, { x: 100 }, {
        easing: customEasing
      });
    }).not.toThrow();
  });

  it('should handle empty properties', () => {
    const element = document.createElement('div');
    
    expect(() => {
      animate(element, {}, {});
    }).not.toThrow();
  });

  it('should handle timeline with multiple items', () => {
    const el1 = document.createElement('div');
    const el2 = document.createElement('div');
    const el3 = document.createElement('div');
    
    expect(() => {
      timeline([
        [el1, { x: 100 }, { duration: 100 }],
        [el2, { y: 50 }, { duration: 200 }],
        [el3, { scale: 2 }, { duration: 150 }]
      ]);
    }).not.toThrow();
  });
});
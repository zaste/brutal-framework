import { describe, it, expect, jest } from '@jest/globals';
import { animate } from '../src/index';

describe('Debug RAF issue', () => {
  it('should understand why RAF is not working', () => {
    let rafCallbacks: Array<(time: number) => void> = [];
    let currentTime = 0;
    
    // Track RAF calls
    global.requestAnimationFrame = jest.fn((callback) => {
      console.log('RAF called, adding callback');
      rafCallbacks.push(callback);
      return rafCallbacks.length;
    }) as any;
    
    global.performance = {
      now: () => currentTime
    } as any;
    
    global.getComputedStyle = () => ({
      transform: 'none',
      opacity: '1'
    }) as any;
    
    const element = {
      style: {
        transform: '',
        opacity: '',
        willChange: ''
      }
    } as any;
    
    console.log('Starting animation...');
    const anim = animate(element, { opacity: 0 }, { duration: 100 });
    
    console.log('RAF callbacks registered:', rafCallbacks.length);
    console.log('Element style after animate():', element.style);
    
    // Execute RAF callbacks
    currentTime = 16;
    console.log('\nExecuting RAF callbacks at 16ms...');
    const callbacks = [...rafCallbacks];
    rafCallbacks = [];
    callbacks.forEach(cb => {
      console.log('Calling RAF callback');
      cb(currentTime);
    });
    
    console.log('Element style after first RAF:', element.style);
    console.log('New RAF callbacks registered:', rafCallbacks.length);
    
    // Execute next frame
    currentTime = 50;
    console.log('\nExecuting RAF callbacks at 50ms...');
    const callbacks2 = [...rafCallbacks];
    rafCallbacks = [];
    callbacks2.forEach(cb => cb(currentTime));
    
    console.log('Element style after 50ms:', element.style);
  });
});
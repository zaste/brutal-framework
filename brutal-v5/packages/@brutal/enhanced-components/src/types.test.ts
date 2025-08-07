import { describe, it, expect } from '@jest/globals';
import type { ComponentErrorInfo, ComponentPerformanceEntry } from './types.js';

// Mock HTMLElement
class MockHTMLElement {
  tagName = 'div';
}

describe('types', () => {
  describe('ComponentErrorInfo', () => {
    it('should represent component error information', () => {
      const errorInfo: ComponentErrorInfo = {
        error: new Error('Component failed'),
        phase: 'render',
        component: new MockHTMLElement() as any,
        timestamp: Date.now()
      };
      
      expect(errorInfo.error).toBeInstanceOf(Error);
      expect(errorInfo.phase).toBe('render');
      expect(errorInfo.component).toBeDefined();
      expect(errorInfo.timestamp).toBeGreaterThan(0);
    });

    it('should accept unknown error types', () => {
      const errorInfo: ComponentErrorInfo = {
        error: 'String error',
        phase: 'init',
        component: new MockHTMLElement() as any,
        timestamp: Date.now()
      };
      
      expect(errorInfo.error).toBe('String error');
    });
  });

  describe('ComponentPerformanceEntry', () => {
    it('should represent performance measurement', () => {
      const perfEntry: ComponentPerformanceEntry = {
        measure: 'render-1',
        duration: 25.5,
        component: new MockHTMLElement() as any
      };
      
      expect(perfEntry.measure).toBe('render-1');
      expect(perfEntry.duration).toBe(25.5);
      expect(perfEntry.component).toBeDefined();
    });

    it('should support various measure names', () => {
      const measures = [
        'init-duration',
        'render-1',
        'update-5',
        'custom-operation'
      ];
      
      measures.forEach(measure => {
        const entry: ComponentPerformanceEntry = {
          measure,
          duration: 10,
          component: new MockHTMLElement() as any
        };
        
        expect(entry.measure).toBe(measure);
      });
    });
  });
});
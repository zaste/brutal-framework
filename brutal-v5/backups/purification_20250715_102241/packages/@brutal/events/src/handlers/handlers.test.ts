/**
 * Tests for DOM event handlers
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { DOMEventManager, domEvents, emit, createEvent } from './index.js';

describe('DOMEventManager', () => {
  let element: HTMLElement;
  let manager: DOMEventManager;
  
  beforeEach(() => {
    document.body.innerHTML = '';
    element = document.createElement('div');
    element.innerHTML = `
      <button class="btn" data-id="1">Button 1</button>
      <button class="btn" data-id="2">Button 2</button>
      <div class="container">
        <span class="text">Text</span>
      </div>
    `;
    document.body.appendChild(element);
    manager = new DOMEventManager();
  });
  
  afterEach(() => {
    document.body.innerHTML = '';
  });
  
  describe('direct event binding', () => {
    it('should bind events directly to elements', () => {
      const handler = jest.fn();
      const button = element.querySelector('.btn')!;
      
      manager.on(button, 'click', handler);
      
      button.dispatchEvent(new Event('click'));
      
      expect(handler).toHaveBeenCalled();
    });
    
    it('should support once option', () => {
      const handler = jest.fn();
      const button = element.querySelector('.btn')!;
      
      manager.on(button, 'click', handler, { once: true });
      
      button.dispatchEvent(new Event('click'));
      button.dispatchEvent(new Event('click'));
      
      expect(handler).toHaveBeenCalledTimes(1);
    });
    
    it('should cleanup event listeners', () => {
      const handler = jest.fn();
      const button = element.querySelector('.btn')!;
      
      const cleanup = manager.on(button, 'click', handler);
      
      button.dispatchEvent(new Event('click'));
      expect(handler).toHaveBeenCalledTimes(1);
      
      cleanup();
      
      button.dispatchEvent(new Event('click'));
      expect(handler).toHaveBeenCalledTimes(1); // Not called again
    });
  });
  
  describe('event delegation', () => {
    it('should delegate events to matching elements', () => {
      const handler = jest.fn();
      
      manager.delegate(element, 'click', '.btn', handler);
      
      const btn1 = element.querySelector('[data-id="1"]')!;
      const btn2 = element.querySelector('[data-id="2"]')!;
      const text = element.querySelector('.text')!;
      
      btn1.dispatchEvent(new Event('click', { bubbles: true }));
      btn2.dispatchEvent(new Event('click', { bubbles: true }));
      text.dispatchEvent(new Event('click', { bubbles: true }));
      
      expect(handler).toHaveBeenCalledTimes(2);
    });
    
    it('should handle events from dynamically added elements', () => {
      const handler = jest.fn();
      
      manager.delegate(element, 'click', '.dynamic', handler);
      
      // Add element after delegation
      const newBtn = document.createElement('button');
      newBtn.className = 'dynamic';
      element.appendChild(newBtn);
      
      newBtn.dispatchEvent(new Event('click', { bubbles: true }));
      
      expect(handler).toHaveBeenCalled();
    });
    
    it('should cleanup delegated events', () => {
      const handler = jest.fn();
      
      const cleanup = manager.delegate(element, 'click', '.btn', handler);
      
      const btn = element.querySelector('.btn')!;
      btn.dispatchEvent(new Event('click', { bubbles: true }));
      expect(handler).toHaveBeenCalledTimes(1);
      
      cleanup();
      
      btn.dispatchEvent(new Event('click', { bubbles: true }));
      expect(handler).toHaveBeenCalledTimes(1); // Not called again
    });
  });
  
  describe('global domEvents instance', () => {
    it('should provide singleton instance', () => {
      expect(domEvents).toBeInstanceOf(DOMEventManager);
      
      const handler = jest.fn();
      const button = element.querySelector('.btn')!;
      
      domEvents.on(button, 'click', handler);
      button.dispatchEvent(new Event('click'));
      
      expect(handler).toHaveBeenCalled();
    });
  });
  
  describe('emit helper', () => {
    it('should emit custom events on elements', () => {
      const handler = jest.fn();
      element.addEventListener('custom:event', handler);
      
      emit(element, 'custom:event', { value: 42 });
      
      expect(handler).toHaveBeenCalled();
      const event = handler.mock.calls[0][0];
      expect(event.detail).toEqual({ value: 42 });
    });
  });
  
  describe('createEvent helper', () => {
    it('should create custom events with detail', () => {
      const event = createEvent('test:event', { foo: 'bar' });
      
      expect(event).toBeInstanceOf(CustomEvent);
      expect(event.type).toBe('test:event');
      expect(event.detail).toEqual({ foo: 'bar' });
      expect(event.bubbles).toBe(true);
      expect(event.cancelable).toBe(true);
    });
    
    it('should create events with custom options', () => {
      const event = createEvent('test', { value: 1 }, {
        bubbles: false,
        cancelable: false,
        composed: true
      });
      
      expect(event.bubbles).toBe(false);
      expect(event.cancelable).toBe(false);
      expect(event.composed).toBe(true);
    });
  });
});
/**
 * Tests for DOM utilities
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  $,
  createElement,
  on,
  delegate,
  toggleClass,
  addClass,
  removeClass,
  matches,
  attr,
  data,
  empty,
  html,
  text,
  show,
  hide,
  dimensions,
  isInViewport,
  ready,
  dom
} from './index.js';

describe('DOM utilities', () => {
  let container: HTMLDivElement;
  
  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
  });
  
  afterEach(() => {
    document.body.removeChild(container);
  });
  
  describe('$()', () => {
    it('should query single element', () => {
      container.innerHTML = '<div class="test">Test</div>';
      const el = $('.test', { root: container });
      expect(el?.textContent).toBe('Test');
    });
    
    it('should query all elements when all: true', () => {
      container.innerHTML = '<div class="test">1</div><div class="test">2</div>';
      const els = $('.test', { root: container, all: true });
      expect(els.length).toBe(2);
    });
    
    it('should return null for non-existent element', () => {
      const el = $('.not-found', { root: container });
      expect(el).toBeNull();
    });
  });
  
  describe('createElement()', () => {
    it('should create element with tag', () => {
      const el = createElement('div');
      expect(el.tagName).toBe('DIV');
    });
    
    it('should set attributes', () => {
      const el = createElement('div', {
        id: 'test',
        class: 'foo bar',
        'data-value': '123'
      });
      expect(el.id).toBe('test');
      expect(el.className).toBe('foo bar');
      expect(el.dataset.value).toBe('123');
    });
    
    it('should handle style object', () => {
      const el = createElement('div', {
        style: { color: 'red', fontSize: '16px' }
      });
      expect(el.style.color).toBe('red');
      expect(el.style.fontSize).toBe('16px');
    });
    
    it('should handle class array', () => {
      const el = createElement('div', {
        class: ['foo', 'bar', null, '', 'baz']
      });
      expect(el.className).toBe('foo bar baz');
    });
    
    it('should add event listeners', () => {
      let clicked = false;
      const el = createElement('button', {
        onclick: () => { clicked = true; }
      });
      el.click();
      expect(clicked).toBe(true);
    });
    
    it('should add children', () => {
      const el = createElement('div', {}, [
        'Text',
        createElement('span', {}, ['Child'])
      ]);
      expect(el.childNodes.length).toBe(2);
      expect(el.textContent).toBe('TextChild');
    });
    
    it('should handle data attributes object', () => {
      const el = createElement('div', {
        data: { foo: 'bar', baz: 123 }
      });
      expect(el.dataset.foo).toBe('bar');
      expect(el.dataset.baz).toBe('123');
    });
  });
  
  describe('on()', () => {
    it('should add event listener', () => {
      const el = createElement('button');
      let clicked = false;
      const off = on(el, 'click', () => { clicked = true; });
      
      el.click();
      expect(clicked).toBe(true);
      
      clicked = false;
      off();
      el.click();
      expect(clicked).toBe(false);
    });
  });
  
  describe('delegate()', () => {
    it('should handle delegated events', () => {
      container.innerHTML = '<div><button class="btn">Click</button></div>';
      let clicked = false;
      let targetEl: Element | null = null;
      
      delegate(container, 'click', '.btn', (e, target) => {
        clicked = true;
        targetEl = target;
      });
      
      const btn = container.querySelector('.btn') as HTMLElement;
      btn.click();
      
      expect(clicked).toBe(true);
      expect(targetEl).toBe(btn);
    });
  });
  
  describe('class utilities', () => {
    let el: HTMLElement;
    
    beforeEach(() => {
      el = createElement('div');
    });
    
    it('should toggle classes', () => {
      expect(toggleClass(el, 'active')).toBe(true);
      expect(el.classList.contains('active')).toBe(true);
      
      expect(toggleClass(el, 'active')).toBe(false);
      expect(el.classList.contains('active')).toBe(false);
      
      expect(toggleClass(el, 'active', true)).toBe(true);
      expect(el.classList.contains('active')).toBe(true);
    });
    
    it('should add classes', () => {
      addClass(el, 'foo', 'bar', '', 'baz');
      expect(el.className).toBe('foo bar baz');
    });
    
    it('should remove classes', () => {
      el.className = 'foo bar baz';
      removeClass(el, 'bar', 'baz');
      expect(el.className).toBe('foo');
    });
  });
  
  describe('matches()', () => {
    it('should check if element matches selector', () => {
      const el = createElement('div', { class: 'foo bar', id: 'test' });
      expect(matches(el, '.foo')).toBe(true);
      expect(matches(el, '#test')).toBe(true);
      expect(matches(el, '.baz')).toBe(false);
    });
  });
  
  describe('attr()', () => {
    let el: HTMLElement;
    
    beforeEach(() => {
      el = createElement('div');
    });
    
    it('should get attribute', () => {
      el.setAttribute('data-test', 'value');
      expect(attr(el, 'data-test')).toBe('value');
    });
    
    it('should set attribute', () => {
      attr(el, 'data-test', 'value');
      expect(el.getAttribute('data-test')).toBe('value');
    });
    
    it('should remove attribute when null', () => {
      el.setAttribute('data-test', 'value');
      attr(el, 'data-test', null);
      expect(el.hasAttribute('data-test')).toBe(false);
    });
    
    it('should set multiple attributes', () => {
      attr(el, {
        'data-foo': 'bar',
        'data-baz': 'qux',
        'data-remove': null
      });
      expect(el.getAttribute('data-foo')).toBe('bar');
      expect(el.getAttribute('data-baz')).toBe('qux');
      expect(el.hasAttribute('data-remove')).toBe(false);
    });
  });
  
  describe('data()', () => {
    let el: HTMLElement;
    
    beforeEach(() => {
      el = createElement('div');
    });
    
    it('should get data attribute', () => {
      el.dataset.test = 'value';
      expect(data(el, 'test')).toBe('value');
    });
    
    it('should set data attribute', () => {
      data(el, 'test', 'value');
      expect(el.dataset.test).toBe('value');
    });
    
    it('should set multiple data attributes', () => {
      data(el, {
        foo: 'bar',
        baz: 123,
        bool: true
      });
      expect(el.dataset.foo).toBe('bar');
      expect(el.dataset.baz).toBe('123');
      expect(el.dataset.bool).toBe('true');
    });
  });
  
  describe('content utilities', () => {
    let el: HTMLElement;
    
    beforeEach(() => {
      el = createElement('div');
      el.innerHTML = '<span>Child</span>Text';
    });
    
    it('should empty element', () => {
      empty(el);
      expect(el.childNodes.length).toBe(0);
    });
    
    it('should set HTML content', () => {
      html(el, '<p>New content</p>');
      expect(el.innerHTML).toBe('<p>New content</p>');
    });
    
    it('should get/set text content', () => {
      expect(text(el)).toBe('ChildText');
      text(el, 'New text');
      expect(el.textContent).toBe('New text');
    });
  });
  
  describe('visibility utilities', () => {
    let el: HTMLElement;
    
    beforeEach(() => {
      el = createElement('div');
      container.appendChild(el);
    });
    
    it('should show/hide element', () => {
      hide(el);
      expect(el.style.display).toBe('none');
      
      show(el);
      expect(el.style.display).toBe('');
    });
  });
  
  describe('dimensions()', () => {
    it('should get element dimensions', () => {
      const el = createElement('div');
      el.style.width = '100px';
      el.style.height = '50px';
      el.style.position = 'absolute';
      el.style.top = '10px';
      el.style.left = '20px';
      el.textContent = 'Test'; // Force layout
      container.appendChild(el);
      
      // Force layout calculation
      el.offsetHeight;
      
      const dims = dimensions(el);
      expect(dims).toHaveProperty('width');
      expect(dims).toHaveProperty('height');
      expect(dims).toHaveProperty('top');
      expect(dims).toHaveProperty('left');
      expect(dims).toHaveProperty('right');
      expect(dims).toHaveProperty('bottom');
      expect(typeof dims.width).toBe('number');
      expect(typeof dims.height).toBe('number');
    });
  });
  
  describe('isInViewport()', () => {
    it('should check if element is in viewport', () => {
      const el = createElement('div');
      container.appendChild(el);
      
      // Element should be in viewport when attached to document
      expect(isInViewport(el)).toBe(true);
    });
  });
  
  describe('ready()', () => {
    it('should execute immediately if DOM is ready', () => {
      let executed = false;
      ready(() => { executed = true; });
      expect(executed).toBe(true);
    });
  });
  
  describe('dom export', () => {
    it('should export all utilities', () => {
      expect(dom.$).toBe($);
      expect(dom.createElement).toBe(createElement);
      expect(dom.on).toBe(on);
      expect(dom.delegate).toBe(delegate);
      expect(dom.toggleClass).toBe(toggleClass);
      expect(dom.addClass).toBe(addClass);
      expect(dom.removeClass).toBe(removeClass);
      expect(dom.matches).toBe(matches);
      expect(dom.attr).toBe(attr);
      expect(dom.data).toBe(data);
      expect(dom.empty).toBe(empty);
      expect(dom.html).toBe(html);
      expect(dom.text).toBe(text);
      expect(dom.show).toBe(show);
      expect(dom.hide).toBe(hide);
      expect(dom.dimensions).toBe(dimensions);
      expect(dom.isInViewport).toBe(isInViewport);
      expect(dom.ready).toBe(ready);
    });
  });
});
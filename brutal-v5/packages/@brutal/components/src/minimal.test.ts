import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import './minimal'; // This will register the components

describe('Minimal Components', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  describe('Button Component', () => {
    it('should create a button component', () => {
      const btn = document.createElement('b-btn');
      container.appendChild(btn);

      expect(btn.shadowRoot).toBeTruthy();
      expect(btn.shadowRoot!.querySelector('button')).toBeTruthy();
    });

    it('should handle click events', (done) => {
      const btn = document.createElement('b-btn') as any;
      container.appendChild(btn);

      btn.addEventListener('click', () => {
        done();
      });

      btn.shadowRoot!.querySelector('button')!.click();
    });

    it('should apply variant and size props', () => {
      const btn = document.createElement('b-btn') as any;
      btn.variant = 'secondary';
      btn.size = 'lg';
      container.appendChild(btn);

      const button = btn.shadowRoot!.querySelector('button')!;
      expect(button.className).toContain('b-secondary');
      expect(button.className).toContain('b-lg');
    });

    it('should handle disabled state', () => {
      const btn = document.createElement('b-btn') as any;
      btn.disabled = true;
      container.appendChild(btn);

      const button = btn.shadowRoot!.querySelector('button')!;
      expect(button.hasAttribute('disabled')).toBe(true);
    });
  });

  describe('Input Component', () => {
    it('should create an input component', () => {
      const input = document.createElement('b-input');
      container.appendChild(input);

      expect(input.shadowRoot).toBeTruthy();
      expect(input.shadowRoot!.querySelector('input')).toBeTruthy();
    });

    it('should handle input events', (done) => {
      const input = document.createElement('b-input') as any;
      container.appendChild(input);

      input.addEventListener('input', (e: any) => {
        expect(e.detail).toBe('test');
        done();
      });

      const inputEl = input.shadowRoot!.querySelector('input')!;
      inputEl.value = 'test';
      inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    });

    it('should show error state', () => {
      const input = document.createElement('b-input') as any;
      input.error = 'Required field';
      container.appendChild(input);

      expect(input.shadowRoot!.querySelector('.e')).toBeTruthy();
      expect(input.shadowRoot!.querySelector('.em')!.textContent).toBe('Required field');
    });
  });

  describe('Modal Component', () => {
    it('should create a modal component', () => {
      const modal = document.createElement('b-modal');
      container.appendChild(modal);

      expect(modal.shadowRoot).toBeTruthy();
    });

    it('should show/hide based on open prop', () => {
      const modal = document.createElement('b-modal') as any;
      container.appendChild(modal);

      expect(modal.shadowRoot!.querySelector('.o')).toBeFalsy();

      modal.open = true;
      modal.u(); // Force update

      expect(modal.shadowRoot!.querySelector('.o')).toBeTruthy();
    });

    it('should emit close event', (done) => {
      const modal = document.createElement('b-modal') as any;
      modal.open = true;
      container.appendChild(modal);

      modal.addEventListener('close', () => {
        done();
      });

      const closeBtn = modal.shadowRoot!.querySelector('[data-close]')!;
      closeBtn.dispatchEvent(new Event('click', { bubbles: true }));
    });
  });

  describe('Base Component Features', () => {
    it('should support state management', () => {
      const btn = document.createElement('b-btn') as any;
      container.appendChild(btn);

      btn.set({ count: 0 });
      expect(btn.s.count).toBe(0);

      btn.set({ count: 1 });
      expect(btn.s.count).toBe(1);
    });

    it('should support event emitter', (done) => {
      const btn = document.createElement('b-btn') as any;
      container.appendChild(btn);

      const unsubscribe = btn.on('custom', (data: any) => {
        expect(data).toBe('test');
        unsubscribe();
        done();
      });

      btn.emit('custom', 'test');
    });

    it('should support DOM queries', () => {
      const modal = document.createElement('b-modal') as any;
      modal.open = true;
      modal.title = 'Test Modal';
      container.appendChild(modal);

      expect(modal.$('.m')).toBeTruthy();
      expect(modal.$$('div').length).toBeGreaterThan(0);
    });
  });
});
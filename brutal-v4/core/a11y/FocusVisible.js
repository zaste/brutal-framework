/**
 * BRUTAL V4 - Focus Visible Polyfill
 * Provides :focus-visible support for better accessibility
 * Auto-applied to all interactive components
 */

let initialized = false;

export class FocusVisible {
    static init() {
        if (initialized) return;
        initialized = true;

        // Check native support
        try {
            document.querySelector(':focus-visible');
            console.log('Native :focus-visible supported');
            return;
        } catch {
            console.log('Applying :focus-visible polyfill');
            this.applyPolyfill();
        }
    }

    static applyPolyfill() {
        // Track keyboard vs mouse navigation
        let hadKeyboardEvent = true;
        const keyboardEvents = ['keydown', 'keyup'];
        const pointerEvents = ['mousedown', 'pointerdown', 'touchstart'];

        // Add global styles
        const style = document.createElement('style');
        style.textContent = `
            .focus-visible:focus {
                outline: 2px solid #0066cc;
                outline-offset: 2px;
            }
            
            :focus:not(.focus-visible) {
                outline: none;
            }
        `;
        document.head.appendChild(style);

        // Keyboard event handler
        keyboardEvents.forEach(event => {
            document.addEventListener(event, (e) => {
                if (e.metaKey || e.altKey || e.ctrlKey) return;
                hadKeyboardEvent = true;
            }, true);
        });

        // Pointer event handler
        pointerEvents.forEach(event => {
            document.addEventListener(event, () => {
                hadKeyboardEvent = false;
            }, true);
        });

        // Focus event handler
        document.addEventListener('focus', (e) => {
            if (!e.target || e.target === document) return;
            
            if (hadKeyboardEvent || this.shouldAlwaysShow(e.target)) {
                e.target.classList.add('focus-visible');
            }
        }, true);

        // Blur event handler
        document.addEventListener('blur', (e) => {
            if (!e.target || e.target === document) return;
            e.target.classList.remove('focus-visible');
        }, true);
    }

    static shouldAlwaysShow(element) {
        // Always show focus for certain elements
        const tagName = element.tagName.toLowerCase();
        const inputType = element.getAttribute('type');
        
        return (
            tagName === 'input' && inputType !== 'button' && inputType !== 'submit' ||
            tagName === 'textarea' ||
            tagName === 'select' ||
            element.contentEditable === 'true'
        );
    }
}

// Auto-init on import
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => FocusVisible.init());
    } else {
        FocusVisible.init();
    }
}
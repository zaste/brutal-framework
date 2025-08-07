/**
 * BrutalAssertions - Assertion Mixin for BrutalTest
 * 
 * Provides a comprehensive set of assertions for testing V4 components.
 * Designed to be mixed into BrutalTest for extended functionality.
 */

export const BrutalAssertions = {
    // Core assertions
    assertEqual(actual, expected, message = '') {
        const msg = message || `Expected ${expected}, got ${actual}`;
        return this.assert(actual === expected, msg);
    },
    
    assertNotEqual(actual, expected, message = '') {
        const msg = message || `Expected ${actual} to not equal ${expected}`;
        return this.assert(actual !== expected, msg);
    },
    
    assertTrue(value, message = '') {
        const msg = message || `Expected truthy value, got ${value}`;
        return this.assert(!!value, msg);
    },
    
    assertFalse(value, message = '') {
        const msg = message || `Expected falsy value, got ${value}`;
        return this.assert(!value, msg);
    },
    
    assertNull(value, message = '') {
        const msg = message || `Expected null, got ${value}`;
        return this.assert(value === null, msg);
    },
    
    assertNotNull(value, message = '') {
        const msg = message || `Expected non-null value, got ${value}`;
        return this.assert(value !== null, msg);
    },
    
    assertDefined(value, message = '') {
        const msg = message || `Expected defined value, got ${value}`;
        return this.assert(value !== undefined, msg);
    },
    
    assertUndefined(value, message = '') {
        const msg = message || `Expected undefined, got ${value}`;
        return this.assert(value === undefined, msg);
    },
    
    // Type assertions
    assertType(value, type, message = '') {
        const actualType = typeof value;
        const msg = message || `Expected type ${type}, got ${actualType}`;
        return this.assert(actualType === type, msg);
    },
    
    assertInstanceOf(value, constructor, message = '') {
        const msg = message || `Expected instance of ${constructor.name}`;
        return this.assert(value instanceof constructor, msg);
    },
    
    assertArray(value, message = '') {
        const msg = message || `Expected array, got ${typeof value}`;
        return this.assert(Array.isArray(value), msg);
    },
    
    // Numeric assertions
    assertGreaterThan(actual, expected, message = '') {
        const msg = message || `Expected ${actual} > ${expected}`;
        return this.assert(actual > expected, msg);
    },
    
    assertGreaterThanOrEqual(actual, expected, message = '') {
        const msg = message || `Expected ${actual} >= ${expected}`;
        return this.assert(actual >= expected, msg);
    },
    
    assertLessThan(actual, expected, message = '') {
        const msg = message || `Expected ${actual} < ${expected}`;
        return this.assert(actual < expected, msg);
    },
    
    assertLessThanOrEqual(actual, expected, message = '') {
        const msg = message || `Expected ${actual} <= ${expected}`;
        return this.assert(actual <= expected, msg);
    },
    
    assertInRange(value, min, max, message = '') {
        const msg = message || `Expected ${value} to be between ${min} and ${max}`;
        return this.assert(value >= min && value <= max, msg);
    },
    
    // String assertions
    assertContains(haystack, needle, message = '') {
        const msg = message || `Expected "${haystack}" to contain "${needle}"`;
        return this.assert(haystack.includes(needle), msg);
    },
    
    assertNotContains(haystack, needle, message = '') {
        const msg = message || `Expected "${haystack}" to not contain "${needle}"`;
        return this.assert(!haystack.includes(needle), msg);
    },
    
    assertStartsWith(string, prefix, message = '') {
        const msg = message || `Expected "${string}" to start with "${prefix}"`;
        return this.assert(string.startsWith(prefix), msg);
    },
    
    assertEndsWith(string, suffix, message = '') {
        const msg = message || `Expected "${string}" to end with "${suffix}"`;
        return this.assert(string.endsWith(suffix), msg);
    },
    
    assertMatches(string, pattern, message = '') {
        const msg = message || `Expected "${string}" to match ${pattern}`;
        return this.assert(pattern.test(string), msg);
    },
    
    // Array assertions
    assertArrayLength(array, length, message = '') {
        const msg = message || `Expected array length ${length}, got ${array.length}`;
        return this.assert(array.length === length, msg);
    },
    
    assertArrayContains(array, item, message = '') {
        const msg = message || `Expected array to contain ${item}`;
        return this.assert(array.includes(item), msg);
    },
    
    assertArrayNotContains(array, item, message = '') {
        const msg = message || `Expected array to not contain ${item}`;
        return this.assert(!array.includes(item), msg);
    },
    
    // Object assertions
    assertHasProperty(object, property, message = '') {
        const msg = message || `Expected object to have property "${property}"`;
        return this.assert(property in object, msg);
    },
    
    assertNotHasProperty(object, property, message = '') {
        const msg = message || `Expected object to not have property "${property}"`;
        return this.assert(!(property in object), msg);
    },
    
    assertDeepEqual(actual, expected, message = '') {
        const msg = message || `Expected deep equality`;
        const equal = JSON.stringify(actual) === JSON.stringify(expected);
        return this.assert(equal, msg);
    },
    
    // Exception assertions
    async assertThrows(fn, expectedError, message = '') {
        try {
            await fn();
            this.assert(false, message || 'Expected function to throw');
        } catch (error) {
            if (expectedError) {
                const matches = expectedError instanceof RegExp
                    ? expectedError.test(error.message)
                    : error.message.includes(expectedError);
                this.assert(matches, message || `Expected error message to match "${expectedError}"`);
            } else {
                this.assert(true, message || 'Function threw as expected');
            }
        }
    },
    
    async assertNotThrows(fn, message = '') {
        try {
            await fn();
            this.assert(true, message || 'Function did not throw');
        } catch (error) {
            this.assert(false, message || `Expected no throw, but got: ${error.message}`);
        }
    },
    
    // DOM assertions
    assertElementExists(selector, message = '') {
        const element = this.shadowRoot?.querySelector(selector) || 
                       document.querySelector(selector);
        const msg = message || `Expected element "${selector}" to exist`;
        return this.assert(!!element, msg);
    },
    
    assertElementNotExists(selector, message = '') {
        const element = this.shadowRoot?.querySelector(selector) || 
                       document.querySelector(selector);
        const msg = message || `Expected element "${selector}" to not exist`;
        return this.assert(!element, msg);
    },
    
    assertElementText(selector, expectedText, message = '') {
        const element = this.shadowRoot?.querySelector(selector) || 
                       document.querySelector(selector);
        const actualText = element?.textContent?.trim() || '';
        const msg = message || `Expected element text "${expectedText}", got "${actualText}"`;
        return this.assert(actualText === expectedText, msg);
    },
    
    assertElementAttribute(selector, attribute, expectedValue, message = '') {
        const element = this.shadowRoot?.querySelector(selector) || 
                       document.querySelector(selector);
        const actualValue = element?.getAttribute(attribute);
        const msg = message || `Expected attribute "${attribute}" to be "${expectedValue}", got "${actualValue}"`;
        return this.assert(actualValue === expectedValue, msg);
    },
    
    // Component assertions
    assertComponentState(component, statePath, expectedValue, message = '') {
        const actualValue = component._state.get(statePath);
        const msg = message || `Expected state "${statePath}" to be ${expectedValue}, got ${actualValue}`;
        return this.assert(actualValue === expectedValue, msg);
    },
    
    assertComponentRendered(component, message = '') {
        const msg = message || 'Expected component to be rendered';
        return this.assert(component.shadowRoot !== null, msg);
    },
    
    assertComponentConnected(component, message = '') {
        const msg = message || 'Expected component to be connected to DOM';
        return this.assert(component.isConnected, msg);
    },
    
    // Performance assertions
    assertRenderTime(component, maxTime, message = '') {
        const renderTime = component._lastRenderTime || 0;
        const msg = message || `Expected render time <= ${maxTime}ms, got ${renderTime}ms`;
        return this.assert(renderTime <= maxTime, msg);
    },
    
    assertMemoryUsage(maxBytes, message = '') {
        const usage = performance.memory?.usedJSHeapSize || 0;
        const msg = message || `Expected memory usage <= ${maxBytes} bytes, got ${usage}`;
        return this.assert(usage <= maxBytes, msg);
    },
    
    // Async assertions
    async assertEventFired(target, eventName, timeout = 1000) {
        return new Promise((resolve) => {
            let fired = false;
            const handler = () => {
                fired = true;
                target.removeEventListener(eventName, handler);
                this.assert(true, `Event "${eventName}" fired`);
                resolve();
            };
            
            target.addEventListener(eventName, handler);
            
            setTimeout(() => {
                if (!fired) {
                    target.removeEventListener(eventName, handler);
                    this.assert(false, `Event "${eventName}" did not fire within ${timeout}ms`);
                    resolve();
                }
            }, timeout);
        });
    },
    
    // Custom assertion builder
    createAssertion(name, validator, formatter) {
        this[name] = function(...args) {
            const result = validator(...args);
            const message = formatter ? formatter(...args) : `Assertion ${name} failed`;
            return this.assert(result, message);
        };
    }
};

// Helper to apply assertions to a test class
export function withAssertions(TestClass) {
    Object.assign(TestClass.prototype, BrutalAssertions);
    return TestClass;
}
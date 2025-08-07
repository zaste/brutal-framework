/**
 * BRUTAL Foundation - Executable Constraint: Composition Only
 * Enforce composition pattern, prevent inheritance chains
 */

import type { SourceFile, Constraint, ValidationResult } from '../types';

export const COMPOSITION_ONLY: Constraint = {
  id: 'composition-only',
  name: 'Use Composition Over Inheritance',
  severity: 'error',
  
  description: `
    Classes should not extend other classes (except HTMLElement for Web Components).
    Use composition patterns instead of inheritance.
  `,
  
  validate(source: SourceFile): ValidationResult {
    const violations = [];
    
    // Pattern to find class inheritance
    const classExtends = /class\s+\w+\s+extends\s+(\w+)/g;
    let match;
    
    while ((match = classExtends.exec(source.content)) !== null) {
      const baseClass = match[1];
      
      // HTMLElement is the only allowed base class
      if (baseClass !== 'HTMLElement') {
        violations.push({
          message: `Class extends "${baseClass}" - use composition instead`,
          line: source.content.substring(0, match.index).split('\n').length,
          severity: 'error',
          fix: 'Refactor to use composition pattern'
        });
      }
    }
    
    // Check for deep inheritance (extends extends)
    if (source.content.includes('super.super')) {
      violations.push({
        message: 'Deep inheritance detected (super.super)',
        severity: 'error',
        fix: 'Flatten hierarchy using composition'
      });
    }
    
    return {
      valid: violations.length === 0,
      violations
    };
  },
  
  exceptions: [
    'extends HTMLElement', // Web Components require this
  ],
  
  patterns: {
    good: `
// ✅ Good: Composition
function withState(element) {
  element.state = {};
  return element;
}

function withEvents(element) {
  element.on = () => {};
  return element;
}

const component = compose(
  withState,
  withEvents
)(document.createElement('div'));
    `,
    
    bad: `
// ❌ Bad: Inheritance
class BaseComponent extends HTMLElement { }
class StateComponent extends BaseComponent { }
class MyComponent extends StateComponent { }
    `
  },
  
  enforcement: {
    git: 'pre-commit',
    ci: 'required',
    override: 'needs-review'
  }
};
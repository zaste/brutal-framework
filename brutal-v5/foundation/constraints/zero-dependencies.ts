/**
 * BRUTAL Foundation - Executable Constraint: Zero Dependencies
 * This is not documentation - this is enforcement
 */

import type { Package, Constraint, ValidationResult } from '../types';

export const ZERO_DEPENDENCIES: Constraint = {
  id: 'zero-dependencies',
  name: 'Zero Runtime Dependencies',
  severity: 'error',
  
  description: `
    No external runtime dependencies allowed.
    Only @brutal/* packages can depend on other @brutal/* packages.
  `,
  
  validate(pkg: Package): ValidationResult {
    const deps = Object.keys(pkg.dependencies || {});
    const external = deps.filter(d => !d.startsWith('@brutal'));
    
    if (external.length === 0) {
      return { valid: true };
    }
    
    return {
      valid: false,
      violations: external.map(dep => ({
        message: `External dependency "${dep}" not allowed`,
        severity: 'error',
        fix: `Remove dependency or implement internally`
      }))
    };
  },
  
  exceptions: [
    // No exceptions for runtime dependencies
  ],
  
  enforcement: {
    git: 'pre-commit',
    ci: 'required',
    override: 'forbidden'
  }
};

// Helper to check during development
export function checkDependencies(packagePath: string): boolean {
  try {
    const pkg = require(`${packagePath}/package.json`);
    const result = ZERO_DEPENDENCIES.validate(pkg);
    
    if (!result.valid) {
      console.error('❌ Zero Dependencies Violation:');
      result.violations?.forEach(v => console.error(`   - ${v.message}`));
      return false;
    }
    
    console.log('✅ Zero Dependencies: PASS');
    return true;
  } catch (e) {
    console.error('Failed to check dependencies:', e);
    return false;
  }
}
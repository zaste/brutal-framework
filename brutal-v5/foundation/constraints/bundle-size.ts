/**
 * BRUTAL Foundation - Executable Constraint: Bundle Size Limits
 * Enforce size budgets per package
 */

import type { Package, BuildOutput, Constraint, ValidationResult } from '../types';

export const BUNDLE_SIZE_LIMITS: Constraint = {
  id: 'bundle-size',
  name: 'Bundle Size Budget',
  severity: 'error',
  
  description: `
    Each package must stay within its size budget.
    Sizes are measured after minification and gzip.
  `,
  
  // Size limits in bytes
  limits: {
    '@brutal2/core': 2048,      // 2KB
    '@brutal2/dom': 2048,       // 2KB  
    '@brutal2/state': 1024,     // 1KB
    '@brutal2/events': 1024,    // 1KB
    '@brutal2/router': 1024,    // 1KB
    '@brutal2/animation': 1024, // 1KB
    '@brutal2/utils': 512,      // 0.5KB
    
    // Legacy packages (more lenient)
    '@brutal/foundation': 6144,  // 6KB
    '@brutal/shared': 4096,      // 4KB
    '@brutal/events': 5120,      // 5KB
    '@brutal/templates': 7168,   // 7KB
    '@brutal/components': 8192,  // 8KB
    '@brutal/state': 6144,       // 6KB
    '@brutal/routing': 6144,     // 6KB
    
    // Default for any package
    'default': 5120              // 5KB
  },
  
  validate(build: BuildOutput): ValidationResult {
    const limit = this.limits[build.package] || this.limits.default;
    const size = build.size.gzipped;
    
    if (size <= limit) {
      return {
        valid: true,
        info: `${build.package}: ${size}B / ${limit}B (${Math.round(size/limit*100)}%)`
      };
    }
    
    const overBy = size - limit;
    const percentage = Math.round((size / limit - 1) * 100);
    
    return {
      valid: false,
      violations: [{
        message: `${build.package} exceeds size limit by ${overBy}B (+${percentage}%)`,
        severity: 'error',
        fix: `Reduce by ${overBy}B to meet ${limit}B budget`,
        details: {
          current: size,
          limit: limit,
          reduction: overBy
        }
      }]
    };
  },
  
  suggestions: {
    reduce: [
      'Remove unused exports',
      'Eliminate duplicate code',
      'Use shorter variable names', 
      'Remove unnecessary abstractions',
      'Inline single-use functions',
      'Remove error messages in production'
    ]
  },
  
  enforcement: {
    git: 'pre-push',
    ci: 'required',
    override: 'forbidden'
  }
};
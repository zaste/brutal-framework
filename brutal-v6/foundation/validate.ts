/**
 * THE validation function
 * This is the only public API of foundation
 */

import { PRINCIPLES } from './principles';
import * as rules from './rules';

export interface ValidationTarget {
  type: 'package' | 'file' | 'code' | 'build';
  path?: string;
  content?: any;
}

export interface ValidationOptions {
  fix?: boolean;
  verbose?: boolean;
}

export interface Violation {
  rule: string;
  severity: 'error' | 'warning';
  message: string;
  file?: string;
  line?: number;
  fix?: () => Promise<void>;
}

export interface ValidationResult {
  valid: boolean;
  violations: Violation[];
  fixed?: number;
  summary: string;
}

/**
 * Auto-detect what we're validating
 */
function detectType(target: string | any): ValidationTarget {
  if (typeof target === 'string') {
    if (target.endsWith('.ts') || target.endsWith('.js')) {
      return { type: 'file', path: target };
    }
    if (target === '.' || target.includes('/')) {
      return { type: 'package', path: target };
    }
    return { type: 'code', content: target };
  }
  
  if (target.dependencies !== undefined) {
    return { type: 'package', content: target };
  }
  
  if (target.size !== undefined && target.files !== undefined) {
    return { type: 'build', content: target };
  }
  
  return { type: 'code', content: target };
}

/**
 * Generate human-readable summary
 */
function generateSummary(violations: Violation[]): string {
  if (violations.length === 0) {
    return '✅ All validations passed';
  }
  
  const errors = violations.filter(v => v.severity === 'error').length;
  const warnings = violations.filter(v => v.severity === 'warning').length;
  
  const lines = [`❌ Validation failed: ${errors} errors, ${warnings} warnings\n`];
  
  violations.forEach(v => {
    const icon = v.severity === 'error' ? '🚫' : '⚠️';
    lines.push(`${icon} ${v.rule}: ${v.message}`);
    if (v.file) lines.push(`   📄 ${v.file}${v.line ? `:${v.line}` : ''}`);
  });
  
  return lines.join('\n');
}

/**
 * THE validation function
 * One function to rule them all
 */
export async function validate(
  target: string | any,
  options: ValidationOptions = {}
): Promise<ValidationResult> {
  // Auto-detect what we're validating
  const detectedTarget = detectType(target);
  
  // Collect all violations
  const violations: Violation[] = [];
  
  // Run all applicable rules
  for (const [name, rule] of Object.entries(rules)) {
    if (rule.appliesTo(detectedTarget.type)) {
      try {
        const result = await rule.validate(detectedTarget);
        if (!result.valid) {
          violations.push(...result.violations);
        }
      } catch (error) {
        violations.push({
          rule: name,
          severity: 'error',
          message: `Rule failed: ${error.message}`
        });
      }
    }
  }
  
  // Auto-fix if requested
  let fixed = 0;
  if (options.fix && violations.length > 0) {
    for (const violation of violations) {
      if (violation.fix) {
        try {
          await violation.fix();
          fixed++;
        } catch (error) {
          if (options.verbose) {
            console.error(`Failed to fix ${violation.rule}: ${error.message}`);
          }
        }
      }
    }
    
    // Re-validate after fixes
    if (fixed > 0) {
      const revalidation = await validate(target, { ...options, fix: false });
      return {
        ...revalidation,
        fixed,
        summary: `${revalidation.summary}\n\n🔧 Auto-fixed ${fixed} violations`
      };
    }
  }
  
  return {
    valid: violations.length === 0,
    violations,
    fixed,
    summary: generateSummary(violations)
  };
}

// That's it. One function. No more API.
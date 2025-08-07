/**
 * Export all rules
 * Each rule is a simple module with one responsibility
 */

export { sizeRule } from './size';
export { dependenciesRule } from './dependencies';
export { compositionRule } from './composition';
export { duplicationRule } from './duplication';
export { patternsRule } from './patterns';
export { frameworkGrowth } from './framework-growth';
export { wisdomRule } from './wisdom';

// Rule interface that all rules implement
export interface Rule {
  name: string;
  appliesTo: (type: string) => boolean;
  validate: (target: any) => Promise<RuleResult>;
}

export interface RuleResult {
  valid: boolean;
  violations: RuleViolation[];
}

export interface RuleViolation {
  rule: string;
  severity: 'error' | 'warning';
  message: string;
  file?: string;
  line?: number;
  fix?: () => Promise<void>;
}
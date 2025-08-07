/**
 * Framework Growth Prevention Rule
 * 
 * This rule embodies the core lesson from V3-V5:
 * Frameworks grow uncontrollably without executable constraints.
 * 
 * It monitors and prevents the patterns that killed previous versions.
 */

import { Rule, RuleResult, RuleViolation } from './index';
import * as fs from 'fs/promises';
import * as path from 'path';

interface GrowthMetrics {
  totalFiles: number;
  totalSize: number;
  duplicateImplementations: Map<string, string[]>;
  complexityScore: number;
}

/**
 * The maximum allowed metrics based on V6 goals
 * These are NOT guidelines - they are hard limits
 */
const GROWTH_LIMITS = {
  maxFiles: 100,              // V5 had 43,282 files
  maxTotalSize: 8704,         // 8.5KB total (in bytes)
  maxImplementations: 1,      // ONE way to do things
  maxComplexity: 10,          // Cyclomatic complexity per function
  maxDirectoryDepth: 3,       // Prevent deep nesting
  maxFileSize: 2048,          // 2KB per file
} as const;

/**
 * Patterns that indicate uncontrolled growth
 */
const GROWTH_PATTERNS = [
  /\/(legacy|old|deprecated|backup|v\d+)\//,  // Version proliferation
  /\.(backup|old|copy|tmp)\.([jt]s)$/,       // File duplication
  /TODO|FIXME|HACK|XXX/,                     // Technical debt markers
  /experimental|prototype|poc/i,              // Uncommitted experiments
] as const;

async function analyzeGrowth(targetPath: string): Promise<GrowthMetrics> {
  const metrics: GrowthMetrics = {
    totalFiles: 0,
    totalSize: 0,
    duplicateImplementations: new Map(),
    complexityScore: 0,
  };

  async function walk(dir: string, depth = 0): Promise<void> {
    if (depth > GROWTH_LIMITS.maxDirectoryDepth) {
      throw new Error(`Directory nesting exceeds ${GROWTH_LIMITS.maxDirectoryDepth} levels`);
    }

    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        await walk(fullPath, depth + 1);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.js'))) {
        metrics.totalFiles++;
        
        const stats = await fs.stat(fullPath);
        metrics.totalSize += stats.size;
        
        // Check for growth patterns
        for (const pattern of GROWTH_PATTERNS) {
          if (pattern.test(fullPath)) {
            throw new Error(`Growth pattern detected: ${fullPath} matches ${pattern}`);
          }
        }
      }
    }
  }

  await walk(targetPath);
  return metrics;
}

export const frameworkGrowth: Rule = {
  name: 'framework-growth',
  
  appliesTo: (type: string) => type === 'package',
  
  async validate(target: any): Promise<RuleResult> {
    const violations: RuleViolation[] = [];
    
    if (!target.path || target.path === '.') {
      // Validating entire framework
      const metrics = await analyzeGrowth('./packages');
      
      // Check total files
      if (metrics.totalFiles > GROWTH_LIMITS.maxFiles) {
        violations.push({
          rule: 'framework-growth',
          severity: 'error',
          message: `Framework has ${metrics.totalFiles} files (limit: ${GROWTH_LIMITS.maxFiles}). V5 died with 43,282 files.`,
        });
      }
      
      // Check total size
      if (metrics.totalSize > GROWTH_LIMITS.maxTotalSize) {
        violations.push({
          rule: 'framework-growth',
          severity: 'error',
          message: `Framework is ${(metrics.totalSize / 1024).toFixed(1)}KB (limit: 8.5KB). V3 died at 206KB.`,
        });
      }
    }
    
    return {
      valid: violations.length === 0,
      violations,
    };
  },
};

// No default export, already exported as named export
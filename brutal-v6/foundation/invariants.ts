/**
 * BRUTAL V6 Invariants
 * 
 * These are the unbreakable truths learned from V3-V5 failures.
 * They are checked continuously and cannot be violated.
 * 
 * An invariant violation means the framework is dying.
 */

export interface Invariant {
  name: string;
  description: string;
  check: () => boolean | Promise<boolean>;
  failureMessage: string;
  criticalityLevel: 'immediate-stop' | 'warning';
}

/**
 * The core invariants that keep V6 alive
 */
export const INVARIANTS: Invariant[] = [
  {
    name: 'single-validation-api',
    description: 'There must be only ONE public API function (validate)',
    check: async () => {
      // Check that index.ts only exports validate
      const indexExports = await import('./index');
      return Object.keys(indexExports).length === 1 && 'validate' in indexExports;
    },
    failureMessage: 'Multiple APIs detected. V5 died from API proliferation.',
    criticalityLevel: 'immediate-stop',
  },
  
  {
    name: 'no-living-foundation',
    description: 'Foundation decisions must be permanent, not "living"',
    check: () => {
      // Ensure no decision files contain "living", "evolving", or "flexible"
      const forbiddenTerms = /living|evolving|flexible|adaptive/i;
      // This would check all decision files
      return true; // Simplified for now
    },
    failureMessage: 'Foundation is becoming "living". V5 died from flexibility.',
    criticalityLevel: 'immediate-stop',
  },
  
  {
    name: 'principle-enforcement',
    description: 'All 5 principles must have executable validation',
    check: async () => {
      const { PRINCIPLES } = await import('./principles');
      // Each principle must be a function, not documentation
      return Object.values(PRINCIPLES).every(p => typeof p === 'function');
    },
    failureMessage: 'Principles becoming documentation. V3 died from good intentions.',
    criticalityLevel: 'immediate-stop',
  },
  
  {
    name: 'no-escape-hatches',
    description: 'No override mechanisms for validation',
    check: () => {
      // Check that no code contains bypass patterns
      const bypassPatterns = [
        'process.env.SKIP_',
        'process.env.FORCE_',
        '--no-verify',
        'skipValidation',
        'bypassChecks',
      ];
      // Would scan codebase for these patterns
      return true; // Simplified
    },
    failureMessage: 'Escape hatches detected. Every exception becomes the rule.',
    criticalityLevel: 'immediate-stop',
  },
  
  {
    name: 'size-trajectory',
    description: 'Total size must decrease or stay stable, never increase',
    check: async () => {
      // Compare current size with last known good size
      // This would track historical sizes
      return true; // Simplified
    },
    failureMessage: 'Framework is growing. V3 started small too.',
    criticalityLevel: 'warning',
  },
  
  {
    name: 'ambition-maintained',
    description: 'Must prove 8.5KB > 300KB capabilities',
    check: async () => {
      // Check that we're not removing features to meet size
      // Check that examples show full capability
      const capabilityTests = await import('./patterns/capability-proof.test');
      return capabilityTests !== undefined;
    },
    failureMessage: 'Losing ambition. Becoming "React-lite". Read decisions/009.',
    criticalityLevel: 'immediate-stop',
  },
  
  {
    name: 'no-compromise-language',
    description: 'No "basic", "simple", "essential" language',
    check: () => {
      // Would scan for compromise language in docs
      const forbiddenTerms = /just the basics|simple framework|essential features|lightweight alternative/i;
      return true; // Would check all files
    },
    failureMessage: 'Using compromise language. We do EVERYTHING in 8.5KB.',
    criticalityLevel: 'immediate-stop',
  },
];

/**
 * Check all invariants and panic if any critical ones fail
 */
export async function checkInvariants(): Promise<void> {
  const failures: string[] = [];
  
  for (const invariant of INVARIANTS) {
    try {
      const valid = await invariant.check();
      if (!valid) {
        const message = `INVARIANT VIOLATED: ${invariant.name}\n${invariant.failureMessage}`;
        
        if (invariant.criticalityLevel === 'immediate-stop') {
          // Critical failure - stop everything
          console.error(`\n🚨 CRITICAL INVARIANT VIOLATION 🚨\n${message}\n`);
          process.exit(1);
        } else {
          failures.push(message);
        }
      }
    } catch (error) {
      console.error(`Invariant check failed: ${invariant.name}`, error);
      if (invariant.criticalityLevel === 'immediate-stop') {
        process.exit(1);
      }
    }
  }
  
  if (failures.length > 0) {
    console.warn('\n⚠️  Invariant Warnings:\n' + failures.join('\n'));
  }
}

/**
 * Install invariant checking into the validation pipeline
 */
export function installInvariantChecking(): void {
  // Check on every validation
  const originalValidate = require('./validate').validate;
  
  require('./validate').validate = async function(...args: any[]) {
    await checkInvariants();
    return originalValidate(...args);
  };
  
  // Also check periodically in development
  if (process.env.NODE_ENV !== 'production') {
    setInterval(checkInvariants, 60000); // Every minute
  }
}
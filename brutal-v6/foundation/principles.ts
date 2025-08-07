/**
 * The 5 BRUTAL Principles as executable code
 * These are not words, they are validations
 */

interface Package {
  name: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  size?: number;
}

interface Build {
  size: number;
  files: string[];
}

/**
 * The 5 principles that define BRUTAL
 * Change these = create BRUTAL V7
 */
export const PRINCIPLES = {
  /**
   * Zero runtime dependencies
   * Only browser APIs allowed
   */
  ZERO_DEPS: (pkg: Package): boolean => {
    const deps = Object.keys(pkg.dependencies || {});
    return deps.length === 0 || deps.every(d => d.startsWith('@brutal/'));
  },

  /**
   * Composition over inheritance
   * No classes except extending HTMLElement
   */
  COMPOSITION: (code: string): boolean => {
    // Check for class inheritance (except HTMLElement)
    const inheritancePattern = /class\s+\w+\s+extends\s+(?!HTMLElement)\w+/g;
    return !inheritancePattern.test(code);
  },

  /**
   * Size as a feature
   * Every byte must justify its existence
   */
  SIZE_FIRST: (build: Build): boolean => {
    const MAX_SIZE = 2048; // 2KB per package
    return build.size <= MAX_SIZE;
  },

  /**
   * One way only
   * No alternative implementations
   */
  ONE_WAY: (implementations: string[]): boolean => {
    // Check that there's only one implementation of each feature
    return implementations.length <= 1;
  },

  /**
   * User-driven development
   * Features must be requested, not imagined
   */
  USER_DRIVEN: (feature: { requested: boolean; used: boolean }): boolean => {
    return feature.requested && feature.used;
  },

  /**
   * Aggressive ambition
   * Every feature must prove 8.5KB > 300KB
   */
  AMBITIOUS: (feature: { name: string; justification: string }): boolean => {
    // Check that feature justification includes why it's better than React
    const hasComparison = /better than|faster than|simpler than|smaller than/i.test(feature.justification);
    const provesValue = /demonstrates|proves|shows/i.test(feature.justification);
    return hasComparison && provesValue;
  }
} as const;

// Type derived from principles
export type Principle = keyof typeof PRINCIPLES;
export type PrincipleValidator = typeof PRINCIPLES[Principle];
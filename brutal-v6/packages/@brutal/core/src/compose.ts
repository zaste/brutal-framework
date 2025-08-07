/**
 * Core composition function
 * This is THE fundamental pattern of BRUTAL
 */

/**
 * Composes multiple functions from right to left
 * @param fns Functions to compose
 * @returns Composed function
 */
export function compose<T>(...fns: Array<(x: T) => T>): (x: T) => T {
  return (x: T) => fns.reduceRight((v, f) => f(v), x);
}


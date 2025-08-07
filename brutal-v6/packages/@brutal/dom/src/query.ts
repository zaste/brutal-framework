/**
 * Minimal query utilities
 */

export function query<T extends Element = Element>(selector: string, root?: Element | Document): T | null {
  return (root || document).querySelector<T>(selector);
}

export function queryAll<T extends Element = Element>(selector: string, root?: Element | Document): T[] {
  return Array.from((root || document).querySelectorAll<T>(selector));
}
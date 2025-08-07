/**
 * @brutal/animation - Ultra-lightweight animation library
 * @packageDocumentation
 */

// Export minimal implementation with proper names
export {
  animate,
  timeline,
  // Re-export minified versions for internal use
  a,
  tl
} from './minimal.js';

// Export types
export type {
  AnimatableProperties,
  AnimationOptions,
  Animation,
  TimelineItem,
  TimelineSequence,
  EasingFunction,
  EasingName
} from './types.js';

// Constants
export const VERSION = '__VERSION__';
export const PACKAGE_NAME = '@brutal/animation';

// Default easing functions for direct use
export const easings = {
  linear: (t: number) => t,
  easeIn: (t: number) => t * t,
  easeOut: (t: number) => t * (2 - t),
  easeInOut: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
};
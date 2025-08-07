/**
 * Type definitions for @brutal/animation
 */

export interface AnimatableProperties {
  x?: number;
  y?: number;
  scale?: number;
  rotate?: number;
  opacity?: number;
}

export type EasingFunction = (t: number) => number;

export type EasingName = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';

export interface AnimationOptions {
  duration?: number;
  delay?: number;
  easing?: EasingName | EasingFunction;
  onComplete?: () => void;
  onUpdate?: (progress: number) => void;
}

export interface Animation {
  element: HTMLElement;
  properties: AnimatableProperties;
  options: AnimationOptions;
  startTime?: number;
  startValues?: AnimatableProperties;
  running: boolean;
  id: number;
}

export interface TimelineItem {
  element: HTMLElement;
  properties: AnimatableProperties;
  options?: AnimationOptions;
}

export type TimelineSequence = TimelineItem[];
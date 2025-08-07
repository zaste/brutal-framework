/**
 * Global type augmentations for @brutal/state
 */

declare global {
  interface Window {
    __BRUTAL_STATE_VERSION__?: string;
  }
}

export {};

/**
 * Global type augmentations for @brutal/plugins
 */

declare global {
  interface Window {
    __BRUTAL_PLUGINS_VERSION__?: string;
  }
}

export {};

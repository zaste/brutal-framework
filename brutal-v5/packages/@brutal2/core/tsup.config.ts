import { defineConfig } from 'tsup';
import baseConfig from '../../../config/tsup.config.base.js';

export default defineConfig({
  ...baseConfig,
  entry: ['src/index.ts'],
  banner: {
    js: '/* @brutal2/core - Composition utilities for BRUTAL2 */'
  }
});
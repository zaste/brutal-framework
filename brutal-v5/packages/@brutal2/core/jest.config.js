import baseConfig from '../../../config/jest.config.base.js';

export default {
  ...baseConfig,
  displayName: '@brutal2/core',
  testMatch: [
    '<rootDir>/src/**/*.test.ts',
    '<rootDir>/tests/**/*.test.ts'
  ]
};
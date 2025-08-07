import baseConfig from "../../../config/jest.preset.mjs";

export default {
  ...baseConfig,
  displayName: '@brutal/enhanced-components',
  rootDir: '.',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testMatch: [
    '<rootDir>/src/**/*.test.ts',
    '<rootDir>/tests/**/*.test.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    }
  }
};

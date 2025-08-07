import baseConfig from "../../../config/jest.preset.mjs";

export default {
  ...baseConfig,
  rootDir: '.',
  testEnvironment: 'jsdom',
  testMatch: ['**/src/minimal.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/base/Component.test.ts']
};

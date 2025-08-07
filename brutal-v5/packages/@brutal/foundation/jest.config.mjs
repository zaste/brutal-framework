import baseConfig from "../../../config/jest.preset.mjs";

export default {
  ...baseConfig,
  rootDir: '.',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
    }],
  },
};
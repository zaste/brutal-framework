import baseConfig from "../../../config/jest.preset.mjs";

export default {
  ...baseConfig,
  rootDir: '.',
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 95,
      lines: 90,
      statements: 90
    }
  },
};

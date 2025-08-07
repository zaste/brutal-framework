/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: [
    '**/test/**/*.test.ts',
    '**/*.test.ts'
  ],
  collectCoverageFrom: [
    '*.ts',
    '!*.d.ts',
    '!**/node_modules/**',
    '!**/test/**',
    '!jest.config.js'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true
      }
    }]
  },
  globals: {
    'ts-jest': {
      isolatedModules: true
    }
  }
};